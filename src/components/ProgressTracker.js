import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import '../css/ProgressTracker.css';

function ProgressTracker({ user }) {
    const [progressData, setProgressData] = useState({
        dates: [],
        scores: []
    });
    const [completedQuizzes, setCompletedQuizzes] = useState([]);
    const canvasRef = useRef(null);

    useEffect(() => {
        const fetchProgressData = async () => {
            if (!user || !user.uid) {
                console.error('User or user.uid is undefined');
                return;
            }
        
            try {
                const db = getFirestore();
                const userProgressDoc = await getDoc(doc(db, 'userProgress', user.uid));
                const userDoc = await getDoc(doc(db, 'users', user.uid));

                if (userProgressDoc.exists() && userDoc.exists()) {
                    const userProgressData = userProgressDoc.data();
                    const userData = userDoc.data();

                    // Ensure progressHistory exists and is an array
                    const progressHistory = Array.isArray(userProgressData.progressHistory)
                        ? userProgressData.progressHistory
                        : [];

                    // Fetch completed quizzes
                    const completedQuizzes = userData.completedQuizzes || [];
                    setCompletedQuizzes(completedQuizzes);

                    // Filter out hidden quizzes
                    const visibleProgressHistory = progressHistory.filter(entry => !completedQuizzes.includes(entry.quizId));

                    setProgressData({
                        dates: visibleProgressHistory.map(entry => entry.date),
                        scores: visibleProgressHistory.map(entry => entry.score)
                    });
                } else {
                    console.log('No progress data found for this user.');
                }
            } catch (error) {
                console.error('Error fetching progress data:', error);
            }
        };
        
        fetchProgressData();
    }, [user]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the background circle
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#e0e0e0'; // Light gray background
        ctx.fill();

        // Calculate the average score
        const totalScore = progressData.scores.reduce((acc, score) => acc + score, 0);
        const averageScore = totalScore / progressData.scores.length || 0;
        const percentage = (averageScore / 100) * 2 * Math.PI;

        // Draw the foreground circle based on the average score
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 10, 0, percentage);
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#4a90e2'; // Blue foreground
        ctx.fill();

        // Draw the percentage text
        ctx.fillStyle = '#333333'; // Dark text color
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(averageScore) + '%', canvas.width / 2, canvas.height / 2 + 10);
    }, [progressData]);

    const clearProgressData = async () => {
        if (!user || !user.uid) {
            console.error('User or user.uid is undefined');
            return;
        }

        try {
            const db = getFirestore();
            const userProgressRef = doc(db, 'userProgress', user.uid);
            await updateDoc(userProgressRef, {
                progressHistory: []
            });
            setProgressData({
                dates: [],
                scores: []
            });
        } catch (error) {
            console.error('Error clearing progress data:', error);
        }
    };

    return (
        <div className="progress-tracker">
            <h2>Your Progress</h2>
            <div className="chart-container">
                <canvas ref={canvasRef} width="300" height="280"></canvas>
            </div>
        </div>
    );
}

export default ProgressTracker;