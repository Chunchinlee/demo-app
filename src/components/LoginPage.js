import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import '../css/LoginPage.css';
import { toast } from 'react-toastify';

function LoginPage({ showToast }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [isCodeCorrect, setIsCodeCorrect] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isCodeCorrect) {
            setError('Incorrect verification code');
            return;
        }

        const auth = getAuth();
        const db = getFirestore();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if the user document exists in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
                throw new Error('User account has been deleted.');
            }

            // Check if the user account is disabled or deleted
            const userData = userDoc.data();
            if (userData.isDisabled) {
                throw new Error('User account has been disabled.');
            }
            if (userData.isDeleted) {
                throw new Error('User account has been deleted.');
            }

            const userProgressRef = doc(db, 'userProgress', user.uid);
            const userProgressDoc = await getDoc(userProgressRef);

            if (!userProgressDoc.exists()) {
                await setDoc(userProgressRef, {
                    recentActivity: [],
                });
            }

            await updateDoc(userProgressRef, {
                recentActivity: arrayUnion({
                    date: Timestamp.now().toDate().toLocaleString(),
                    activity: 'Logged in'
                })
            });

            const today = new Date().toISOString().split('T')[0];
            const lastLogin = userDoc.data().lastLogin || '';

            if (lastLogin) {
                const lastLoginDate = new Date(lastLogin).toISOString().split('T')[0];
                const daysDifference = (new Date(today) - new Date(lastLoginDate)) / (1000 * 60 * 60 * 24);

                if (daysDifference === 1) {
                    await updateDoc(userDocRef, {
                        loginStreak: userDoc.data().loginStreak + 1,
                        lastLogin: today
                    });
                } else if (daysDifference > 1) {
                    await updateDoc(userDocRef, {
                        loginStreak: 1,
                        lastLogin: today
                    });
                }
            } else {
                await updateDoc(userDocRef, {
                    loginStreak: 1,
                    lastLogin: today
                });
            }

            if (userDoc.data().loginStreak + 1 >= 7) {
                await updateDoc(userDocRef, {
                    achievements: arrayUnion('streak_7')
                });
            }

            // Proceed with login
            showToast('Login successful', 'success');
        } catch (error) {
            setError(error.message);
            showToast('Error logging in: ' + error.message, 'error');
        }
    };

    const handleForgotPassword = () => {
        showToast.info('Please contact the admin to reset your password.');
    };

    const handleGetCode = () => {
        const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedCode(randomCode);
        showToast.info(`Verification Code: ${randomCode}`);
    };

    const handleCodeInput = (e) => {
        setVerificationCode(e.target.value);
        setIsCodeCorrect(e.target.value === generatedCode);
    };

    return (
        <div className="login-page">
            <form onSubmit={handleLogin} className="login-form">
                <h2>Login</h2>
                <input
                    type="email"
                    placeholder="Enter an email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <div className="password-input">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <label>
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                        />
                        Show Password
                    </label>
                </div>

                <button type="button" onClick={handleGetCode}>Get Code</button>

                <input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={handleCodeInput}
                    required
                />

                <button type="submit" disabled={!isCodeCorrect}>Login</button>

                <button type="button" onClick={handleForgotPassword}>Forgot Password?</button>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
}

export default LoginPage;
