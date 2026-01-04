import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import classes from './PerformerAuth.module.css';

const PerformerAuth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Real Name
    const [error, setError] = useState('');
    const { performerLogin, performerSignup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await performerLogin(email, password);
            } else {
                await performerSignup(email, password, name);
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className={classes.container}>
            <h2 className={classes.title}>
                {isLogin ? '공연진 로그인' : '공연진 등록 신청'}
            </h2>

            <form onSubmit={handleSubmit} className={classes.form}>
                {!isLogin && (
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
                        placeholder={isLogin ? "테스트 계정: admin@test.com" : ""}
                        required
                    />
                </div>

                <div className={classes.inputGroup}>
                    <label>비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isLogin ? "아무 비밀번호나 입력하세요" : ""}
                        required
                    />
                </div>

                {error && <p className={classes.error}>{error}</p>}

                <button type="submit" className={classes.submitBtn}>
                    {isLogin ? '로그인' : '가입 신청'}
                </button>
            </form>

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
        </div>
    );
};

export default PerformerAuth;
