import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import classes from './Layout.module.css';

import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleRoleSwitch = () => {
        // For testing: navigating to performer login if current role is audience (or null)
        if (user?.role === 'performer') {
            logout(); // Logout to switch back to nothing (or audience flow)
            navigate('/');
        } else {
            navigate('/performer/login');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const location = useLocation();
    const isReservePage = location.pathname === '/reserve';
    const isAdminPage = location.pathname === '/admin';
    const isCheckinPage = location.pathname === '/checkin';
    const hideStatusBar = isReservePage || isAdminPage || isCheckinPage || user?.isVerified;

    return (
        <div className={classes.container}>
            {/* Top Navigation */}
            <nav className={classes.navbar}>
                <div className={classes.logo}>
                    <Link to="/">🎵 Atempo</Link>
                </div>
                <div
                    className={classes.navLinks}
                    style={isReservePage ? { pointerEvents: 'none', opacity: 0.3 } : {}}
                >
                    <Link to="/" className={classes.link}>홈</Link>
                    <Link to="/info" className={classes.link}>공연 정보</Link>
                    <Link to="/board" className={classes.link}>응원 게시판</Link>
                </div>
            </nav>

            {/* Status Bar - Hidden on Reserve and Admin Pages */}
            {!hideStatusBar ? (
                <div className={classes.statusBar}>
                    {user ? (
                        <>
                            <span className={classes.statusText}>
                                현재 접속: <span className={classes.nickname}>{user.name}</span> ({user.role === 'audience' ? '관객' : '공연진'})
                            </span>
                            {user.role === 'audience' && user.isVerified ? (
                                <span className={classes.statusHint}>티켓 인증 상태에서는 로그아웃할 수 없습니다.</span>
                            ) : (
                                <button className={classes.roleSwitchBtn} onClick={handleLogout}>로그아웃</button>
                            )}
                        </>
                    ) : (
                        <>
                            <span className={classes.statusText}>로그인/입장 전</span>
                            <button className={classes.roleSwitchBtn} onClick={handleRoleSwitch}>공연진 로그인</button>
                        </>
                    )}
                </div>
            ) : null}

            {/* Main Content */}
            <main className={classes.main}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
