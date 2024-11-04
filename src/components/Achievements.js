import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import '../css/Achievements.css';

const achievementsList = {
    'first_login': { name: 'First Steps', description: 'Logged in for the first time', icon: '🏆' },
    'complete_profile': { name: 'Identity Established', description: 'Completed your profile', icon: '📝' },
    'first_quiz': { name: 'Quiz Taker', description: 'Completed your first quiz', icon: '✅' },
    'perfect_score': { name: 'Perfect Score', description: 'Got 100% on a quiz', icon: '💯' },
    'streak_7': { name: 'Week Warrior', description: 'Logged in for 7 consecutive days', icon: '🔥' },
    // Add more achievements as needed
};

function Achievements({ user }) {
    const [userAchievements, setUserAchievements] = useState([]);

    useEffect(() => {
        const fetchAchievements = async () => {
            if (!user || !user.uid) {
                console.error('User or user.uid is undefined');
                return;
            }

            const db = getFirestore();
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserAchievements(userData.achievements || []);
            }
        };

        fetchAchievements();
    }, [user]);

    return (
        <div className="achievements">
            <h2>Your Achievements</h2>
            <div className="achievements-grid">
                {Object.entries(achievementsList).map(([key, achievement]) => (
                    <div key={key} className={`achievement ${userAchievements.includes(key) ? 'unlocked' : 'locked'}`}>
                        <div className="achievement-icon">{achievement.icon}</div>
                        <h3>{achievement.name}</h3>
                        <p>{achievement.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Achievements;
