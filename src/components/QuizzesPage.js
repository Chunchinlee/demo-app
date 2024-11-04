import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, getDocs, doc, getDoc, updateDoc, increment, arrayUnion, Timestamp, setDoc } from 'firebase/firestore';
import '../css/QuizzesPage.css';

function QuizzesPage({ user, showToast }) {
    const [quizzes, setQuizzes] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [showAnswers, setShowAnswers] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, [showToast, user]);

    const fetchQuizzes = async () => {
        try {
            const db = getFirestore();
            const quizzesQuery = query(collection(db, 'quizzes'));
            const quizzesSnapshot = await getDocs(quizzesQuery);
            const quizzesData = quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (user && !user.isAdmin) {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                const completedQuizzes = userDoc.data()?.completedQuizzes || [];

                const availableQuizzes = quizzesData.filter(quiz => !completedQuizzes.includes(quiz.id));
                setQuizzes(availableQuizzes);
            } else {
                setQuizzes(quizzesData);
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            showToast('Error fetching quizzes. Please try again.', 'error');
        }
    };

    const startQuiz = (quiz) => {
        setCurrentQuiz(quiz);
        setCurrentQuestion(0);
        setUserAnswers({});
        setQuizCompleted(false);
        setScore(0);
        setShowAnswers(quiz.showAnswers);
    };

    const handleAnswer = (answer) => {
        setUserAnswers({ ...userAnswers, [currentQuestion]: answer.toString() });
        if (currentQuestion === currentQuiz.questions.length - 1) {
            completeQuiz();
        } else {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const completeQuiz = async () => {
        let correctAnswers = 0;
    
        currentQuiz.questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            if (currentQuiz.type === 'Identification') {
                if (userAnswer?.toLowerCase() === question.correctAnswer.toLowerCase()) {
                    correctAnswers++;
                }
            } else {
                if (userAnswer === question.correctAnswer) {
                    correctAnswers++;
                }
            }
        });
    
        const finalScore = correctAnswers * 5;
        setScore(finalScore);
        setQuizCompleted(true);
    
        if (user && !user.isAdmin) {
            try {
                const db = getFirestore();
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    [`quizScores.${currentQuiz.id}`]: finalScore,
                    totalScore: increment(finalScore),
                    quizzesCompleted: increment(1),
                    achievements: arrayUnion('first_quiz'),
                    completedQuizzes: arrayUnion(currentQuiz.id), 
                });
    
                const userProgressRef = doc(db, 'userProgress', user.uid);
                const userProgressDoc = await getDoc(userProgressRef);
                if (!userProgressDoc.exists()) {
                    await setDoc(userProgressRef, { recentActivity: [], progressHistory: [] });
                }
    
                await updateDoc(userProgressRef, {
                    recentActivity: arrayUnion({
                        activity: `Completed quiz: ${currentQuiz.title}`,
                        date: Timestamp.now() 
                    })
                });
    
                showToast('Quiz results saved successfully!', 'success');
            } catch (error) {
                console.error('Error updating user data:', error);
                showToast('Error saving quiz results. Please try again.', 'error');
            }
        } else {
            showToast('Quiz completed successfully!', 'success');
        }
    };

    if (!currentQuiz) {
        return (
            <div className="quizzes-page">
                <h1>Available Quizzes</h1>
                <div className="quiz-list">
                    {quizzes.length > 0 ? (
                        quizzes.map(quiz => (
                            <div key={quiz.id} className="quiz-card">
                                <h3>{quiz.title}</h3>
                                <p>Difficulty: Level {quiz.level}</p>
                                <p>Type: {quiz.type}</p>
                                <p>Questions: {quiz.questions.length}</p>
                                <button className="handlestartquiz" onClick={() => startQuiz(quiz)}>Start Quiz</button>
                            </div>
                        ))
                    ) : (
                        <p>No quizzes available.</p>
                    )}
                </div>
            </div>
        );
    }

    if (quizCompleted) {
        return (
            <div className="quiz-completed">
                <h2>Quiz Completed!</h2>
                <p>Your score: {score}</p>
                {showAnswers && (
                    <div className="correct-answers">
                        <h3>Correct Answers:</h3>
                        <ul>
                            {currentQuiz.questions.map((question, index) => (
                                <li key={index}>
                                    <strong>Question {index + 1}:</strong>
                                    <span className="handlequestion">{question.text}</span>
                                    <br />
                                    <strong className="handlelabel">Your Answer:</strong>
                                    <span className="handleanswer">{userAnswers[index] !== undefined ? userAnswers[index] : "No answer"}</span>
                                    <br />
                                    <strong>Correct Answer:</strong>
                                    <span className="handlecorrect">{question.correctAnswer}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <button  className="handlebackquiz" onClick={() => setCurrentQuiz(null)}>Back to Quizzes</button>
            </div>
        );
    }

    const question = currentQuiz.questions[currentQuestion];

    return (
        <div className="quiz-in-progress">
            <h2>{currentQuiz.title}</h2>
            <div className="question">
                <h3>Question {currentQuestion + 1} of {currentQuiz.questions.length}</h3>
                <p>{question.text}</p>
                <div className="answers">
                    {currentQuiz.type === 'True or False' && (
                        <>
                            <button className="handletrue" onClick={() => handleAnswer(true)}>True</button>
                            <button className="handlefalse" onClick={() => handleAnswer(false)}>False</button>
                        </>
                    )}
                    {currentQuiz.type === 'Multiple Choice' && question.answers.map((answer, index) => (
                        <button key={index} onClick={() => handleAnswer(answer)}>{answer}</button>
                    ))}
                    {currentQuiz.type === 'Identification' && (
                        <input
                            type="text"
                            placeholder="Type your answer here"
                            onChange={(e) => setUserAnswers({ ...userAnswers, [currentQuestion]: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleAnswer(e.target.value)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuizzesPage;
