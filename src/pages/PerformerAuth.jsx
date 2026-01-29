import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import classes from './PerformerAuth.module.css';

const PerformerAuth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showReset, setShowReset] = useState(false);  // Password Reset View Toggle
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Real Name
    const [error, setError] = useState('');
    const { performerLogin, performerSignup, resetPassword } = useAuth();
    const navigate = useNavigate();

    // --- 회원가입 활성화 여부 제어 플래그 ---
    // 나중에 다시 보이게 하려면 true로 변경하세요.
    const isSignupEnabled = false;

    // 만약 가입 모드인데 가입이 비활성화되어 있다면 로그인 모드로 강제 전환
    const effectiveIsLogin = isSignupEnabled ? isLogin : true;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (effectiveIsLogin) {
                await performerLogin(email, password);
            } else {
                await performerSignup(email, password, name);
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault(); // Prevent default form submission if wrapped in a form
        if (!email) {
            setError('비밀번호 재설정을 위해 이메일을 입력해주세요.');
            return;
        }
        try {
            await resetPassword(email);
            alert('비밀번호 재설정 메일을 보냈습니다. 이메일을 확인해주세요.');
            setShowReset(false); // Return to login screen
        } catch (err) {
            setError('메일 전송 실패: ' + err.message);
        }
    };

    // --- RENDER: RESET PASSWORD VIEW ---
    if (showReset) {
        return (
            <div className={classes.container}>
                <h2 className={classes.title}>비밀번호 재설정</h2>
                <form onSubmit={handleResetPassword} className={classes.form}>
                    <p style={{ color: '#ccc', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        가입하신 이메일 주소를 입력해 주시면,<br />
                        새로운 비밀번호를 설정할 수 있는 링크를 보내드립니다.
                    </p>

                    <div className={classes.inputGroup}>
                        <label>이메일</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="가입했던 이메일 주소"
                            required
                        />
                    </div>

                    {error && <p className={classes.error}>{error}</p>}

                    <button type="submit" className={classes.submitBtn}>
                        비밀번호 재설정 메일 받기
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setShowReset(false);
                            setError('');
                        }}
                        className={classes.switchBtn}
                        style={{ marginTop: '1rem', display: 'block', width: '100%' }}
                    >
                        로그인으로 돌아가기
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className={classes.container}>
            <h2 className={classes.title}>
                {effectiveIsLogin ? '공연진 로그인' : '공연진 등록 신청'}
            </h2>

            <form onSubmit={handleSubmit} className={classes.form}>
                {!effectiveIsLogin && (
                    <div className={classes.inputGroup}>
                        <label>실명 (본명)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="예: 홍길동"
                            required
                        />
                    </div>
                )}

                <div className={classes.inputGroup}>
                    <label>이메일</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={effectiveIsLogin ? "테스트 계정: admin@test.com" : ""}
                        required
                    />
                </div>

                <div className={classes.inputGroup}>
                    <label>비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={effectiveIsLogin ? "아무 비밀번호나 입력하세요" : ""}
                        required
                    />
                </div>

                {effectiveIsLogin && (
                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowReset(true);
                                setError('');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#888',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                padding: 0
                            }}
                        >
                            비밀번호를 잊으셨나요?
                        </button>
                    </div>
                )}

                {error && <p className={classes.error}>{error}</p>}

                <button type="submit" className={classes.submitBtn}>
                    {effectiveIsLogin ? '로그인' : '가입 신청'}
                </button>
            </form>

            {isSignupEnabled && (
                <div className={classes.switchMode}>
                    <p>
                        {isLogin ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className={classes.switchBtn}
                        >
                            {isLogin ? '가입 신청하기' : '로그인하기'}
                        </button>
                    </p>
                </div>
            )}
        </div>
    );
};

export default PerformerAuth;
