import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import '../css/Leaderboard.css';

function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState(null);

    const fetchLeaderboard = async () => {
        try {
            const db = getFirestore();
            const q = query(collection(db, 'users'), orderBy('totalScore', 'desc'), limit(5));
            const querySnapshot = await getDocs(q);
            const leaderboardData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
    
        
            const updatedLeaderboard = leaderboardData
                .filter(entry => !entry.isAdmin)
                .map(entry => ({
                    id: entry.id,
                    name: `${entry.firstName} ${entry.lastName}${entry.middleName ? ' ' + entry.middleName : ''}`,
                    score: entry.totalScore || 0
                }));
    
            setLeaderboard(updatedLeaderboard);
            
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setError(`Failed to load leaderboard data: ${error.message}`);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    return (
        <div className="leaderboard">
            <h2>Top Performers</h2>
            {error ? (
                <div className="error">{error}</div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.length > 0 ? (
                            leaderboard.map((entry, index) => (
                                <tr key={entry.id}>
                                    <td>{index + 1}</td>
                                    <td>{entry.name}</td>
                                    <td>{entry.score}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3">No data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Leaderboard;
