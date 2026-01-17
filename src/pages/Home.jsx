import React, { useEffect, useRef, useState } from 'react';
import { Image, DoorOpen, Music, Coffee, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, onSnapshot } from '../api/firebase';
import AudienceEntry from '../components/AudienceEntry';
import classes from './Home.module.css';

const Home = () => {
    const { user, updateNickname } = useAuth();
    const [rotationBase, setRotationBase] = useState(0);
    const [dragRotation, setDragRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [hintSpin, setHintSpin] = useState(false);
    const [checkinStatus, setCheckinStatus] = useState(null);
    const [nickname, setNickname] = useState('');
    const [nicknameSaved, setNicknameSaved] = useState(false);
    const touchStartX = useRef(null);
    const cardWidth = useRef(0);
    const flipCardRef = useRef(null);

    useEffect(() => {
        if (!user?.isVerified) return;
        setHintSpin(true);
        const timer = setTimeout(() => {
            setHintSpin(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, [user?.isVerified]);

    useEffect(() => {
        if (user?.isVerified) {
            setNickname(user.name || '');
        }
    }, [user?.isVerified, user?.name]);

    useEffect(() => {
        if (!user?.isVerified || !user?.reservationId) {
            setCheckinStatus(null);
            return;
        }
        const reservationRef = doc(db, 'reservations', user.reservationId);
        const unsubscribe = onSnapshot(reservationRef, (snap) => {
            if (!snap.exists()) {
                setCheckinStatus(null);
                return;
            }
            const data = snap.data();
            setCheckinStatus({
                checkedIn: Boolean(data.checkedIn),
                checkedInAt: data.checkedInAt || null
            });
        });
        return unsubscribe;
    }, [user?.isVerified, user?.reservationId]);

    const handleFlip = () => {
        if (!user?.isVerified) return;
        setRotationBase((prev) => prev + 180);
    };

    const handleTouchStart = (event) => {
        if (!user?.isVerified) return;
        if (event.touches && event.touches.length > 0) {
            touchStartX.current = event.touches[0].clientX;
            cardWidth.current = flipCardRef.current?.offsetWidth || 0;
            setIsDragging(true);
        }
    };

    const handleTouchMove = (event) => {
        if (!user?.isVerified) return;
        if (touchStartX.current === null || !cardWidth.current) return;
        const moveX = event.touches && event.touches.length > 0
            ? event.touches[0].clientX
            : null;
        if (moveX === null) return;
        const deltaX = moveX - touchStartX.current;
        const rotation = (deltaX / cardWidth.current) * 180;
        const clamped = Math.max(-180, Math.min(180, rotation));
        setDragRotation(clamped);
    };

    const handleTouchEnd = (event) => {
        if (!user?.isVerified) return;
        if (touchStartX.current === null) return;
        const endX = event.changedTouches && event.changedTouches.length > 0
            ? event.changedTouches[0].clientX
            : null;
        if (endX === null) return;
        touchStartX.current = null;
        setIsDragging(false);
        if (Math.abs(dragRotation) < 40) {
            setDragRotation(0);
            return;
        }
        setRotationBase((prev) => prev + (dragRotation > 0 ? 180 : -180));
        setDragRotation(0);
    };

    const handleTouchCancel = () => {
        if (!user?.isVerified) return;
        touchStartX.current = null;
        setIsDragging(false);
        setDragRotation(0);
    };

    const handleNicknameSubmit = (e) => {
        e.preventDefault();
        if (!nickname.trim()) return;
        updateNickname(nickname.trim());
        setNicknameSaved(true);
        setTimeout(() => setNicknameSaved(false), 1500);
    };

    return (
        <div className={classes.home}>

            {/* Logic: Show Entry Form if not logged in. Else show Content */}
            {!user ? (
                <AudienceEntry />
            ) : (
                <>
                    {/* Poster or Ticket Section */}
                    <section className={classes.posterSection}>
                        {user.isVerified ? (
                            <>
                                <div
                                    className={`${classes.flipCard} ${hintSpin ? classes.hintSpin : ''}`}
                                    onClick={handleFlip}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchCancel={handleTouchCancel}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') handleFlip();
                                    }}
                                    ref={flipCardRef}
                                >
                                    <div
                                        className={`${classes.flipInner} ${isDragging ? classes.dragging : ''}`}
                                        style={{ transform: `rotateY(${rotationBase + dragRotation}deg)` }}
                                    >
                                        <div className={`${classes.flipFace} ${classes.flipFront}`}>
                                            <div className={classes.posterCard}>
                                                <img src="/poster.png" alt="공연 포스터" className={classes.posterImage} />
                                            </div>
                                        </div>
                                        <div className={`${classes.flipFace} ${classes.flipBack}`}>
                                            <div className={classes.ticketCard}>
                                                {checkinStatus?.checkedIn && (
                                                    <div className={classes.checkinBadge}>
                                                        입장 인증 완료
                                                    </div>
                                                )}
                                                <div className={classes.ticketHeader}>
                                                    <span className={classes.ticketTitle}>ATEMPO 6기</span>
                                                </div>
                                                <div className={classes.ticketBody}>
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(user.token || user.uid)}`}
                                                        alt="Ticket QR"
                                                        className={classes.qrCode}
                                                    />
                                                    <p className={classes.ticketName}>{user.name} 님</p>
                                                    <p className={classes.ticketInfo}>2025.12.29 19:00 | 라디오가가</p>
                                                </div>
                                                <div className={classes.ticketFooter}>
                                                    입장 시 이 QR코드를 보여주세요
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={classes.posterCard}>
                                {/* Use standard img tag for external/asset images if Lucide Image is placeholder */}
                                <img src="/poster.png" alt="공연 포스터" className={classes.posterImage} />
                            </div>
                        )}
                    </section>
                    {user.isVerified && (
                        <section className={classes.nicknameSection}>
                            <form className={classes.nicknameForm} onSubmit={handleNicknameSubmit}>
                                <label className={classes.nicknameLabel} htmlFor="nickname">
                                    응원 게시판 닉네임
                                </label>
                                <div className={classes.nicknameControls}>
                                    <input
                                        id="nickname"
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder="닉네임을 입력하세요"
                                        maxLength={12}
                                    />
                                    <button type="submit">변경</button>
                                </div>
                                {nicknameSaved && (
                                    <p className={classes.nicknameSaved}>닉네임이 변경되었습니다.</p>
                                )}
                            </form>
                        </section>
                    )}

                    <section className={classes.timelineSection}>
                        <div className={classes.timelineHeader}>
                            <h2>공연 타임라인</h2>
                        </div>

                        <div className={classes.timelineContainer}>
                            <div className={classes.timelineLine}></div>

                            {/* Item 1: 18:30 (Left) */}
                            <div className={`${classes.timelineItem} ${classes.leftAlign}`}>
                                <div className={classes.contentBox}>
                                    <span className={classes.timeText}>18:30</span>
                                    <div className={classes.itemTitle}>관객 입장</div>
                                </div>
                                <div className={`${classes.centerIcon} ${classes.iconGreen}`}>
                                    <DoorOpen size={16} />
                                </div>
                                <div className={classes.dummyBox}></div>
                            </div>

                            {/* Item 2: 19:00 (Right) */}
                            <div className={`${classes.timelineItem} ${classes.rightAlign}`}>
                                <div className={classes.dummyBox}></div>
                                <div className={`${classes.centerIcon} ${classes.iconBlue}`}>
                                    <Music size={16} />
                                </div>
                                <div className={classes.contentBox}>
                                    <span className={classes.timeText}>19:00</span>
                                    <div className={classes.itemTitle}>Wave 공연</div>
                                </div>
                            </div>

                            {/* Item 3: 20:00 (Left) */}
                            <div className={`${classes.timelineItem} ${classes.leftAlign}`}>
                                <div className={classes.contentBox}>
                                    <span className={classes.timeText}>20:00</span>
                                    <div className={classes.itemTitle}>Intermission</div>
                                </div>
                                <div className={`${classes.centerIcon} ${classes.iconYellow}`}>
                                    <Coffee size={16} />
                                </div>
                                <div className={classes.dummyBox}></div>
                            </div>

                            {/* Item 4: 20:15 (Right) */}
                            <div className={`${classes.timelineItem} ${classes.rightAlign}`}>
                                <div className={classes.dummyBox}></div>
                                <div className={`${classes.centerIcon} ${classes.iconPrimary}`}>
                                    <Flame size={16} />
                                </div>
                                <div className={classes.contentBox}>
                                    <span className={classes.timeText}>20:15</span>
                                    <div className={classes.itemTitle}>Atempo 공연</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )
            }
        </div >
    );
};

export default Home;
