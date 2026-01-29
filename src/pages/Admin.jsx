import React, { useState, useEffect } from 'react';
import {
    db,
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    where,
    functions,
    httpsCallable
} from '../api/firebase';
import { useAuth } from '../contexts/AuthContext';
import classes from './Admin.module.css';

const Admin = () => {
    const { user } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [performers, setPerformers] = useState([]);
    const [performersLoading, setPerformersLoading] = useState(true);
    const [performersError, setPerformersError] = useState('');

    const [error, setError] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setReservations(list);
            setError(null);
        }, (err) => {
            console.error("Reservations fetch error:", err);
            setError("예약 정보를 불러오는데 실패했습니다: " + err.message);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user?.isAdmin) {
            setPerformers([]);
            setPerformersLoading(false);
            return undefined;
        }

        const q = query(
            collection(db, "users"),
            where("role", "==", "performer")
        );
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs
                    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
                    .sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt));
                setPerformers(list);
                setPerformersLoading(false);
                setPerformersError('');
            },
            (err) => {
                console.error("Failed to load performers:", err);
                setPerformersError("공연진 목록을 불러오지 못했습니다: " + err.message);
                setPerformersLoading(false);
            }
        );
        return unsubscribe;
    }, [user?.isAdmin]);

    const handleManualApprove = async (id) => {
        if (!window.confirm("수동으로 승인하시겠습니까?")) return;

        const reservation = reservations.find(r => r.id === id);
        if (!reservation) return;

        const token = 'm_' + Math.random().toString(36).substr(2, 9);
        await updateDoc(doc(db, "reservations", id), {
            status: 'paid',
            depositTime: new Date().toISOString(),
            token: token
        });

        alert(`${reservation.name} 예약을 승인했습니다. 곧 이메일이 발송됩니다.`);
    };

    const handleOnsiteApprove = async (id) => {
        if (!window.confirm("현장 결제를 확인하셨습니까?")) return;

        const reservation = reservations.find(r => r.id === id);
        if (!reservation) return;

        await updateDoc(doc(db, "reservations", id), {
            status: 'onsite_paid',
            depositTime: new Date().toISOString()
        });
    };

    const handleDeleteReservation = async (id) => {
        if (!window.confirm("이 예약을 삭제할까요? 되돌릴 수 없습니다.")) return;

        const reservation = reservations.find(r => r.id === id);
        if (!reservation) return;

        await deleteDoc(doc(db, "reservations", id));
        alert(`${reservation.name} 예약을 삭제했습니다.`);
    };

    const handleDeleteAllReservations = async () => {
        if (!window.confirm("모든 예약을 삭제할까요? 되돌릴 수 없습니다.")) return;

        const snapshot = await getDocs(collection(db, "reservations"));
        if (snapshot.empty) {
            alert("삭제할 예약이 없습니다.");
            return;
        }

        for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, "reservations", docSnap.id));
        }

        alert("모든 예약을 삭제했습니다.");
    };

    const handleDeletePerformer = async (performer) => {
        if (!user?.isAdmin) return;

        const isSelf = performer.uid && performer.uid === user.uid;
        const confirmMessage = isSelf
            ? "본인 계정을 삭제하면 다시 로그인할 수 없습니다. 정말 삭제할까요?"
            : "이 공연진 계정을 삭제할까요? 되돌릴 수 없습니다.";

        if (!window.confirm(confirmMessage)) return;

        try {
            const callDeletePerformer = httpsCallable(functions, "deletePerformer");
            await callDeletePerformer({ uid: performer.uid });
            alert(`${performer.email || performer.name || '공연진'} 계정을 삭제했습니다.`);
        } catch (err) {
            console.error("Failed to delete performer:", err);
            setPerformersError("공연진 삭제에 실패했습니다.");
        }
    };

    const handleResetPerformerPassword = async (performer) => {
        if (!user?.isAdmin) return;

        const newPassword = prompt(`"${performer.name || performer.email}" 계정의 새로운 비밀번호를 입력하세요. (6자 이상)`);
        if (newPassword === null) return; // Cancelled
        if (newPassword.trim().length < 6) {
            alert("비밀번호는 6자 이상이어야 합니다.");
            return;
        }

        try {
            const callAdminResetPassword = httpsCallable(functions, "adminResetPassword");
            await callAdminResetPassword({ uid: performer.uid, newPassword: newPassword.trim() });
            alert("비밀번호가 변경되었습니다.");
        } catch (err) {
            console.error("Failed to reset password:", err);
            alert("비밀번호 변경 실패: " + err.message);
        }
    };

    const handleUpdateVisitedFor = async (id, value) => {
        await updateDoc(doc(db, "reservations", id), {
            visitedFor: value
        });
    };

    const getTimestampValue = (value) => {
        if (!value) return 0;
        const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
        const time = date.getTime();
        return Number.isNaN(time) ? 0 : time;
    };

    const formatTimestamp = (value) => {
        if (!value) return '-';
        const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
        return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('ko-KR');
    };

    const getEmailStatusInfo = (reservation) => {
        if (reservation.emailStatus === 'success') {
            return { label: '전송 완료', className: 'logSuccess', timeLabel: '발송 시각' };
        }
        if (reservation.emailStatus === 'error') {
            return { label: '전송 실패', className: 'logError', timeLabel: '오류 시각' };
        }
        if (reservation.emailStatus === 'sending') {
            return { label: '전송 중', className: 'logSending', timeLabel: '전송 시작' };
        }
        if (reservation.status === 'paid') {
            return { label: '대기', className: 'logPending', timeLabel: '대기 시작' };
        }
        return { label: '대상 아님', className: 'logIdle', timeLabel: '기록 시각' };
    };

    const emailLogs = reservations
        .filter((res) => res.status === 'paid' || res.emailStatus)
        .map((res) => ({
            ...res,
            logTimestamp: res.emailSentAt || res.emailAttemptedAt || res.depositTime || res.createdAt
        }))
        .sort((a, b) => getTimestampValue(b.logTimestamp) - getTimestampValue(a.logTimestamp));

    return (
        <div className={classes.container}>
            <h2 className={classes.header}>
                관리자 대시보드
                <span className={classes.totalCount}>
                    (총 {reservations.length}명)
                </span>
            </h2>

            {error && (
                <div className={classes.errorBanner} style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', marginBottom: '1rem', borderRadius: '0.5rem' }}>
                    <strong>오류 발생:</strong> {error}
                    <br />
                    <small>Firebase 연결 상태나 권한을 확인해주세요.</small>
                </div>
            )}

            <div className={classes.grid}>
                <div className={classes.card}>
                    <h3>예약 현황</h3>
                    <div className={classes.listActions}>
                        <button className={classes.deleteAllBtn} onClick={handleDeleteAllReservations}>
                            전체 삭제
                        </button>
                    </div>
                    <div className={classes.listContainer}>
                        <table className={classes.table}>
                            <thead>
                                <tr>
                                    <th>이름</th>
                                    <th>상태</th>
                                    <th>체크인</th>
                                    <th>방문 목적</th>
                                    <th>링크</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.map(res => (
                                    <tr key={res.id} className={classes[res.status]}>
                                        <td>
                                            <div className={classes.reservationName}>{res.name}</div>
                                            <div className={classes.reservationMeta}>
                                                <small>{res.phone}</small>
                                                <small className={classes.reservationTime}>
                                                    접수 {formatTimestamp(res.createdAt)}
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${classes.badge} ${classes[res.status]}`}>
                                                {res.status === 'paid' ? '확정' :
                                                    res.status === 'pending' ? '대기' :
                                                        res.status === 'onsite_pending' ? '현장대기' :
                                                            res.status === 'onsite_paid' ? '현장완료' : '확인필요'}
                                            </span>
                                        </td>
                                        <td>
                                            {res.checkedIn ? (
                                                <div className={classes.checkinInfo}>
                                                    <span className={classes.checkinBadge}>완료</span>
                                                    <small>{(() => {
                                                        if (!res.checkedInAt) return '';
                                                        const date = res.checkedInAt.seconds ? new Date(res.checkedInAt.seconds * 1000) : new Date(res.checkedInAt);
                                                        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                                                    })()}</small>
                                                </div>
                                            ) : (
                                                <span className={classes.noCheckin}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            <select
                                                className={classes.visitSelect}
                                                value={res.visitedFor || ''}
                                                onChange={(e) => handleUpdateVisitedFor(res.id, e.target.value)}
                                            >
                                                <option value="">선택</option>
                                                <option value="Wave">Wave</option>
                                                <option value="Atempo">Atempo</option>
                                            </select>
                                        </td>
                                        <td>
                                            {res.status === 'paid' && (
                                                <button
                                                    className={classes.linkBtn}
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/?auth=${res.token}`;
                                                        navigator.clipboard.writeText(url);
                                                        alert("티켓 링크가 복사되었습니다.\n" + url);
                                                    }}
                                                >
                                                    링크복사
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            {res.status === 'onsite_pending' && (
                                                <button onClick={() => handleOnsiteApprove(res.id)}>현장확인</button>
                                            )}
                                            {res.status === 'pending' && (
                                                <button onClick={() => handleManualApprove(res.id)}>승인</button>
                                            )}
                                            <button
                                                className={classes.deleteBtn}
                                                onClick={() => handleDeleteReservation(res.id)}
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className={classes.card}>
                    <h3>메일 발송 로그</h3>
                    <p className={classes.logHint}>Gmail SMTP 발송 상태를 실시간으로 확인합니다.</p>
                    <div className={classes.logList}>
                        {emailLogs.length === 0 ? (
                            <div className={classes.emptyState}>표시할 로그가 없습니다.</div>
                        ) : (
                            emailLogs.map((log) => {
                                const statusInfo = getEmailStatusInfo(log);
                                return (
                                    <div key={log.id} className={classes.logItem}>
                                        <div className={classes.logHeader}>
                                            <div className={classes.logIdentity}>
                                                <span className={classes.logName}>{log.name || '이름 없음'}</span>
                                                <span className={classes.logEmail}>{log.email || '-'}</span>
                                            </div>
                                            <span className={`${classes.logBadge} ${classes[statusInfo.className]}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <div className={classes.logMeta}>
                                            <span className={classes.logTimeLabel}>{statusInfo.timeLabel}</span>
                                            <span>{formatTimestamp(log.logTimestamp)}</span>
                                        </div>
                                        {log.emailStatus === 'error' && log.emailError && (
                                            <div className={classes.logMessage}>{log.emailError}</div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                <div className={classes.card}>
                    <h3>공연진 계정 관리</h3>
                    {!user?.isAdmin && (
                        <p className={classes.sectionHint}>관리자 계정으로 로그인해야 확인할 수 있습니다.</p>
                    )}
                    {user?.isAdmin && (
                        <>
                            <p className={classes.sectionHint}>
                                잘못 가입된 공연진 계정을 삭제할 수 있습니다.
                            </p>
                            {performersError && (
                                <p className={classes.errorText}>{performersError}</p>
                            )}
                            {performersLoading ? (
                                <div className={classes.emptyState}>불러오는 중...</div>
                            ) : performers.length === 0 ? (
                                <div className={classes.emptyState}>등록된 공연진이 없습니다.</div>
                            ) : (
                                <div className={classes.listContainer}>
                                    <table className={classes.table}>
                                        <thead>
                                            <tr>
                                                <th>이름</th>
                                                <th>이메일</th>
                                                <th>가입일</th>
                                                <th>가입일</th>
                                                <th>관리</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {performers.map(performer => (
                                                <tr key={performer.id}>
                                                    <td>{performer.name || '-'}</td>
                                                    <td>{performer.email || '-'}</td>
                                                    <td>{formatTimestamp(performer.createdAt)}</td>
                                                    <td>
                                                        <button
                                                            className={classes.linkBtn}
                                                            onClick={() => handleResetPerformerPassword(performer)}
                                                            style={{ marginRight: '0.5rem' }}
                                                        >
                                                            비밀번호 변경
                                                        </button>
                                                        <button
                                                            className={classes.deleteBtn}
                                                            onClick={() => handleDeletePerformer(performer)}
                                                        >
                                                            삭제
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin;
