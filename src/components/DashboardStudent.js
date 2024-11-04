import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, arrayUnion, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import ProgressTracker from './ProgressTracker';
import Achievements from './Achievements';
import '../css/DashboardStudent.css';

function DashboardStudent({ user, accountStatus }) {
    const [studentData, setStudentData] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [rank, setRank] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!user || !user.uid) {
                console.error('User or user.uid is undefined');
                return;
            }
    
            const db = getFirestore();
            try {
                // Fetch student data
                const studentDoc = await getDoc(doc(db, 'users', user.uid));
                const userProgressDoc = await getDoc(doc(db, 'userProgress', user.uid));
                
                if (studentDoc.exists()) {
                    const studentData = studentDoc.data();
                    const studentScore = studentData.totalScore || 0;
                    console.log('Fetched student data:', studentData);
                    setStudentData({
                        ...studentData,
                        recentActivity: userProgressDoc.exists() ? userProgressDoc.data().recentActivity : []
                    });
    
                    // Fetch leaderboard and exclude admin
                    const leaderboardQuery = query(collection(db, 'users'), orderBy('totalScore', 'desc'));
                    const leaderboardSnapshot = await getDocs(leaderboardQuery);
                    const leaderboardData = leaderboardSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(entry => entry.id !== 'AHZhifgX7QQYF966mEEz0o1lcD53'); // Exclude admin by UID
                    setLeaderboard(leaderboardData);
    
                    // Calculate rank based on user's score position
                    const sortedLeaderboard = leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
                    const userRank = sortedLeaderboard.findIndex(entry => entry.id === user.uid) + 1;
                    
                    if (userRank > 0) {
                        setRank(userRank);
                    } else {
                        // If not in top entries, calculate rank based on position
                        const lowerRanks = sortedLeaderboard.filter(entry => entry.totalScore > studentScore).length;
                        setRank(lowerRanks + 1);
                    }
                }
            } catch (error) {
                console.error('Error fetching student data:', error);
            }
        };
    
        fetchStudentData();
    }, [user]);
    

    const clearRecentActivity = async () => {
        if (!user || !user.uid) {
            console.error('User or user.uid is undefined');
            return;
        }

        try {
            const db = getFirestore();
            const userProgressRef = doc(db, 'userProgress', user.uid);
            await updateDoc(userProgressRef, {
                recentActivity: []
            });
            setStudentData(prevData => ({
                ...prevData,
                recentActivity: []
            }));
        } catch (error) {
            console.error('Error clearing recent activity:', error);
        }
    };

    if (accountStatus === 'deleted' || accountStatus === 'disabled') {
        return (
            <div className="account-status">
                <h2>Your account has been {accountStatus === 'deleted' ? 'deleted' : 'disabled'}.</h2>
                <p>Please contact the admin for more information.</p>
                <button onClick={() => navigate('/')}>Go Back</button>
                <button onClick={() => navigate('/login')}>Logout</button>
            </div>
        );
    }

    if (!studentData) return <div>Loading...</div>;

    return (
        <div className="dashboard-student">
            <h1>Welcome, {studentData.firstName || 'Student'}!</h1>
            <div className="dashboard-content">
                <div className="stats-card">
                    <h2>Your Stats</h2>
                    <p>Rank: {rank !== null ? rank : 'Calculating...'}</p>
                    <p>Level: {studentData.level || 'N/A'}</p>
                    <p>Quizzes Completed: {studentData.quizzesCompleted || 'N/A'}</p>
                </div>
                <Leaderboard leaderboardData={leaderboard} />
                <ProgressTracker user={user} />
                <Achievements user={user} />
                <div className="recent-activity-card">
                    <h2>Recent Activity</h2>
                    {studentData.recentActivity && studentData.recentActivity.length > 0 ? (
                        <>
                            <ul>
                                {studentData.recentActivity.map((activity, index) => (
                                    <li key={index}>
                                        {activity.date && typeof activity.date === 'object' && activity.date instanceof Timestamp
                                            ? activity.date.toDate().toLocaleString()
                                            : new Date(activity.date).toLocaleString()
                                        }: {activity.activity}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={clearRecentActivity}>Clear Recent Activity</button>
                        </>
                    ) : (
                        <p>No recent activity.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardStudent;
