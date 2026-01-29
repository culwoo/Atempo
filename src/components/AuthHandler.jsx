import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthHandler = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { verifyToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('auth') || searchParams.get('token');
        if (token) {
            verifyToken(token).then(success => {
                if (!success) {
                    alert("유효하지 않거나 만료된 티켓 링크입니다.");
                }
                // Calculate Clean URL manually to avoid reload, then navigate
                // Remove auth param
                searchParams.delete('auth');
                navigate('/', { replace: true });
            });
        }
    }, [searchParams, verifyToken, navigate]);

    return null; // Invisible component
};

export default AuthHandler;
