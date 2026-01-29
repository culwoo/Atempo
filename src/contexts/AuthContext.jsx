import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateNickname } from '../utils/nickname';
import {
    auth, db,
    onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail,
    doc, setDoc, functions, httpsCallable
} from '../api/firebase';
import { isAdminEmail } from '../config/admins';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // { name: string, role: 'performer'|'audience', uid?: string }
    const [loading, setLoading] = useState(true);

    // 1. Check for Firebase User (Performer)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || '공연진',
                    email: firebaseUser.email,
                    role: 'performer',
                    isAdmin: isAdminEmail(firebaseUser.email)
                });
                setLoading(false);
            } else {
                // If no performer logged in, checks for Audience session
                const storedAudience = localStorage.getItem('melodic_audience_user');
                if (storedAudience) {
                    const parsed = JSON.parse(storedAudience);
                    // Patch: If existing session lacks UID, add one
                    if (!parsed.uid) {
                        parsed.uid = 'audience_' + Date.now();
                        localStorage.setItem('melodic_audience_user', JSON.stringify(parsed));
                    }
                    setUser(parsed);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    // Performer Actions
    const performerLogin = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const performerSignup = async (email, password, name) => {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });

        // Save Performer Profile to Firestore for "Receiver List"
        await setDoc(doc(db, "users", res.user.uid), {
            uid: res.user.uid,
            name: name,
            email: email,
            role: 'performer',
            createdAt: new Date().toISOString()
        });

        // Reload user to get updated profile
        setUser({
            uid: res.user.uid,
            name: name,
            email: res.user.email,
            role: 'performer',
            isAdmin: isAdminEmail(res.user.email)
        });
    };

    const resetPassword = (email) => {
        return sendPasswordResetEmail(auth, email);
    };

    const performerLogout = async () => {
        await firebaseSignOut(auth);
        // After logging out performer, check if we should fall back to audience or null?
        // For simplicity, just clear everything. User can re-enter as audience.
        setUser(null);
    };

    // Helper: Get or Create Persistent Device UID
    const getDeviceUid = () => {
        let deviceUid = localStorage.getItem('melodic_device_uid');
        if (!deviceUid) {
            deviceUid = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('melodic_device_uid', deviceUid);
        }
        return deviceUid;
    };

    // Audience Actions
    const audienceLogin = (nickname) => {
        const finalNickname = nickname || generateNickname();
        const deviceUid = getDeviceUid();

        // Use persistent Device UID for identity matching
        const audienceUser = {
            uid: deviceUid,
            name: finalNickname,
            role: 'audience',
            enteredAt: new Date().toISOString()
        };
        localStorage.setItem('melodic_audience_user', JSON.stringify(audienceUser));
        setUser(audienceUser);
    };

    const logout = () => {
        if (user?.role === 'performer') {
            performerLogout();
        } else {
            if (user?.isVerified) {
                return;
            }
            // Validate: remove user session but KEEP device_uid for future identity recognition
            localStorage.removeItem('melodic_audience_user');
            setUser(null);
        }
    };

    const updateNickname = (nickname) => {
        if (!nickname || !user || user.role !== 'audience') return;
        const updated = { ...user, name: nickname.trim() };
        localStorage.setItem('melodic_audience_user', JSON.stringify(updated));
        setUser(updated);
    };

    // Ticket Actions
    const verifyToken = async (token) => {
        try {
            const verifyTicket = httpsCallable(functions, "verifyTicket");
            const result = await verifyTicket({ token });
            const data = result?.data;

            if (!data?.success) {
                return false;
            }

            // Login as Verified Audience
            const deviceUid = getDeviceUid();
            const verifiedUser = {
                uid: deviceUid,
                name: data.name || '',
                role: 'audience',
                isVerified: true, // Key flag
                reservationId: data.reservationId,
                token,
                checkedIn: Boolean(data.checkedIn),
                checkedInAt: data.checkedInAt || null,
                enteredAt: new Date().toISOString()
            };

            localStorage.setItem('melodic_audience_user', JSON.stringify(verifiedUser));
            setUser(verifiedUser);
            return true;
        } catch (err) {
            console.error("Token verification failed:", err);
            return false;
        }
    };

    const value = {
        user,
        loading,
        performerLogin,
        performerSignup,
        audienceLogin,
        logout,
        updateNickname,
        updateNickname,
        verifyToken,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
