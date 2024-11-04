import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import LoginPage from './components/LoginPage';
import DashboardStudent from './components/DashboardStudent';
import DashboardAdmin from './components/DashboardAdmin';
import ProfilePage from './components/ProfilePage';
import QuizzesPage from './components/QuizzesPage';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Leaderboard from './components/Leaderboard';
import ProgressTracker from './components/ProgressTracker';
import Achievements from './components/Achievements';
import './App.css';
import PrivateRoute from './components/PrivateRoute';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AccountStatusPage from './components/AccountStatusPage';

function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accountStatus, setAccountStatus] = useState(null);

    useEffect(() => {
        const auth = getAuth();
        const db = getFirestore();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user);
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.isDeleted) {
                            await signOut(auth);
                            setAccountStatus('deleted');
                        } else if (userData.isDisabled) {
                            setAccountStatus('disabled');
                        } else {
                            setUserData(userData);
                            setAccountStatus(null);
                        }
                    } else {
                        console.error('User document does not exist');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
                setUser(user);
            } else {
                setUser(null);
                setUserData(null);
                setAccountStatus(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        const auth = getAuth();
        const db = getFirestore();
        const user = auth.currentUser;

        if (user) {
            try {
                const userProgressRef = doc(db, 'userProgress', user.uid);
                const userProgressDoc = await getDoc(userProgressRef);
                if (!userProgressDoc.exists()) {
                    await setDoc(userProgressRef, { recentActivity: [] });
                }

                await updateDoc(userProgressRef, {
                    recentActivity: arrayUnion({
                        date: Timestamp.now().toDate().toLocaleString(),
                        activity: 'Logged out'
                    })
                });

                await signOut(auth);
                setUser(null);
                setUserData(null);
                toast.success('Logged out successfully!');
            } catch (error) {
                console.error('Error logging out:', error);
                toast.error('Error logging out. Please try again.');
            }
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <ErrorBoundary>
            <Router>
                <div className="App">
                    <Navigation user={user} handleLogout={handleLogout} accountStatus={accountStatus} />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage showToast={toast} />} />
                        <Route path="/dashboard" element={<PrivateRoute user={user} userData={userData} component={userData?.isAdmin ? DashboardAdmin : DashboardStudent} showToast={toast} />} />
                        <Route path="/profile" element={<PrivateRoute user={user} component={ProfilePage} showToast={toast} />} />
                        <Route path="/quizzes" element={<PrivateRoute user={user} component={QuizzesPage} showToast={toast} />} />
                        <Route path="/leaderboard" element={<PrivateRoute user={user} component={Leaderboard} />} />
                        <Route path="/progress" element={<PrivateRoute user={user} component={ProgressTracker} />} />
                        <Route path="/achievements" element={<PrivateRoute user={user} component={Achievements} />} />
                        <Route path="/account-status" element={<AccountStatusPage accountStatus={accountStatus} />} />
                    </Routes>
                    <ToastContainer />
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
