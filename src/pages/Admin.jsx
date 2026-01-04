import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc, getDocs } from '../api/firebase';
import classes from './Admin.module.css';

const Admin = () => {
    const [reservations, setReservations] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setReservations(list);
        });
        return unsubscribe;
    }, []);

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
            <h2 className={classes.header}>관리자 대시보드</h2>

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
                                                {res.status === 'paid' ? '확정' : res.status === 'pending' ? '대기' : '확인필요'}
                                            </span>
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
                                            {res.status !== 'paid' && (
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
            </div>
        </div>
    );
};

export default Admin;
