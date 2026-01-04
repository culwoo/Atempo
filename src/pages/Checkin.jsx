import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { db, collection, doc, getDocs, onSnapshot, query, updateDoc, where } from '../api/firebase';
import classes from './Checkin.module.css';

const parseToken = (rawText) => {
    if (!rawText) return '';
    try {
        const url = new URL(rawText);
        return url.searchParams.get('auth') || rawText.trim();
    } catch {
        return rawText.trim();
    }
};

const Checkin = () => {
    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const [scanStatus, setScanStatus] = useState(null);
    const [totals, setTotals] = useState({ paid: 0, checkedIn: 0 });
    const [manualToken, setManualToken] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'reservations'), where('status', '==', 'paid'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let paidCount = 0;
            let checkedInCount = 0;
            snapshot.forEach((docSnap) => {
                paidCount += 1;
                const data = docSnap.data();
                if (data.checkedIn) checkedInCount += 1;
            });
            setTotals({ paid: paidCount, checkedIn: checkedInCount });
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const startScan = async () => {
            if (!videoRef.current) return;
            try {
                await reader.decodeFromVideoDevice(null, videoRef.current, (result) => {
                    if (result) {
                        handleToken(result.getText());
                    }
                });
            } catch (error) {
                setScanStatus({ type: 'error', message: '카메라를 열 수 없습니다.' });
            }
        };

        startScan();
        return () => {
            reader.reset();
        };
    }, []);

    const handleToken = async (rawText) => {
        const token = parseToken(rawText);
        if (!token) return;

        setScanStatus({ type: 'loading', message: '입장 상태 확인 중...' });

        try {
            const q = query(collection(db, 'reservations'), where('token', '==', token));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setScanStatus({ type: 'error', message: '유효하지 않은 티켓입니다.' });
                return;
            }

            const targetDoc = snapshot.docs[0];
            const data = targetDoc.data();

            if (data.status !== 'paid') {
                setScanStatus({ type: 'error', message: '입금 확인 전 티켓입니다.' });
                return;
            }

            if (data.checkedIn) {
                setScanStatus({
                    type: 'info',
                    message: `${data.name}님은 이미 입장 완료되었습니다.`,
                    name: data.name
                });
                return;
            }

            await updateDoc(doc(db, 'reservations', targetDoc.id), {
                checkedIn: true,
                checkedInAt: new Date().toISOString()
            });

            setScanStatus({
                type: 'success',
                message: `${data.name}님 입장 완료`,
                name: data.name
            });
        } catch (error) {
            setScanStatus({ type: 'error', message: '입장 처리 중 오류가 발생했습니다.' });
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualToken.trim()) return;
        handleToken(manualToken.trim());
        setManualToken('');
    };

    return (
        <div className={classes.container}>
            <header className={classes.header}>
                <h2>체크인 데스크</h2>
                <p>최초 입장 시 QR을 스캔하고, 재입장은 인증 마크를 확인하세요.</p>
            </header>

            <section className={classes.stats}>
                <div className={classes.statCard}>
                    <span>총 사전 예약</span>
                    <strong>{totals.paid}명</strong>
                </div>
                <div className={classes.statCard}>
                    <span>입장 완료</span>
                    <strong>{totals.checkedIn}명</strong>
                </div>
            </section>

            <section className={classes.scanner}>
                <div className={classes.videoFrame}>
                    <video ref={videoRef} className={classes.video} muted playsInline />
                </div>
                {scanStatus && (
                    <div className={`${classes.statusCard} ${classes[scanStatus.type]}`}>
                        <p>{scanStatus.message}</p>
                    </div>
                )}
            </section>

            <section className={classes.manual}>
                <form onSubmit={handleManualSubmit}>
                    <input
                        type="text"
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        placeholder="QR 토큰을 직접 입력"
                    />
                    <button type="submit">확인</button>
                </form>
            </section>
        </div>
    );
};

export default Checkin;
