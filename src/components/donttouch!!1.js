import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, orderBy, limit, getDoc, writeBatch  } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import '../css/DashboardAdmin.css';

function DashboardAdmin({ user }) {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, quizzesCompleted: 0 });
    const [newStudent, setNewStudent] = useState({ email: '', password: '' });
    const [leaderboard, setLeaderboard] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [newQuiz, setNewQuiz] = useState({ title: '', level: '', type: '', questions: [], showAnswers: false });
    const [showPassword, setShowPassword] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState({ text: '', answers: [], correctAnswer: '' });
    const [showModal, setShowModal] = useState(false);
    
        useEffect(() => {
            const fetchData = async () => {
                const db = getFirestore();
    
                try {
                    // Fetch users
                    const usersSnapshot = await getDocs(collection(db, 'users'));
                    const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setUsers(usersData);
    
                    // Calculate stats
                    const totalUsers = usersData.length;
                    const activeUsers = usersData.filter(user => user.lastActive > Date.now() - 7 * 24 * 60 * 60 * 1000).length;
                    const quizzesCompleted = usersData.reduce((sum, user) => sum + (user.quizzesCompleted || 0), 0);
                    setStats({ totalUsers, activeUsers, quizzesCompleted });
    
                    // Fetch leaderboard
                    const leaderboardQuery = query(collection(db, 'users'), orderBy('totalScore', 'desc'), limit(10));
                    const leaderboardSnapshot = await getDocs(leaderboardQuery);
                    const leaderboardData = leaderboardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
                
                      // Fetch user names
                    const updatedLeaderboard = leaderboardData
                    .filter(entry => !entry.isAdmin) // This line already excludes admins
                    .map(entry => ({
                    id: entry.id,
                    name: `${entry.firstName} ${entry.lastName}${entry.middleName ? ' ' + entry.middleName : ''}`,
                    score: entry.totalScore || 0
                }));
    
                    setLeaderboard(updatedLeaderboard);
    
                    // Fetch quizzes
                    const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
                    const quizzesData = quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setQuizzes(quizzesData);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            };
    
            fetchData();
        }, []);
    

    const handleAddStudent = async () => {
        if (window.confirm('Are you sure you want to add this student?')) {
            const auth = getAuth();
            const db = getFirestore();
            setShowModal(false);
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, newStudent.email, newStudent.password);
                const user = userCredential.user;
                await setDoc(doc(db, 'users', user.uid), {
                    firstName: newStudent.firstName,
                    middleName: newStudent.middleName,
                    lastName: newStudent.lastName,
                    email: newStudent.email,
                    isAdmin: false,
                    isDisabled: false, // Add the isDisabled field
                    isDeleted: false, // Add the isDeleted field
                    createdAt: new Date(),
                    achievements: ['first_login'] // Add "First Steps" achievement
                });
                await setDoc(doc(db, 'userProgress', user.uid), {
                    recentActivity: []
                });
                setUsers(prevUsers => [...prevUsers, { id: user.uid, email: newStudent.email, isAdmin: false, isDisabled: false, isDeleted: false, createdAt: new Date() }]);
                setNewStudent({ firstName: '', middleName: '', lastName: '', email: '', password: '' });
                alert('Student successfully registered');
            } catch (error) {
                console.error('Error adding student:', error);
                alert('Error adding student: ' + error.message);
            }
        }
    };

    const handleDeleteStudent = async (id) => {
        const auth = getAuth();
        const db = getFirestore(); 
        const userDoc = await getDoc(doc(db, 'users', id));
        const userData = userDoc.data();
    
        if (userData.isAdmin) {
            alert('This is an admin user and cannot be deleted.');
            return;
        }
    
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                // Delete the user from Firebase Authentication
                const user = auth.currentUser;
                if (user && user.uid === id) {
                    await user.delete();
                } else {

                }
    
                // Delete the user document from Firestore
                await deleteDoc(doc(db, 'users', id));
    
                // Optionally, delete the user progress document
                await deleteDoc(doc(db, 'userProgress', id));
    
                setUsers(users.filter(user => user.id !== id));
                alert('Student successfully deleted');
            } catch (error) {
                console.error('Error deleting student:', error);
                alert('Error deleting student: ' + error.message);
            }
        }
    };

    const handleResetPassword = async (id) => {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', id));
        const userData = userDoc.data();

        if (userData.isAdmin) {
            alert('This is an admin user and cannot be reset.');
            return;
        }

        if (window.confirm('Are you sure you want to reset the password for this student?')) {
            const auth = getAuth();
            try {
                await sendPasswordResetEmail(auth, userData.email);
                alert('Password reset email sent successfully');
            } catch (error) {
                console.error('Error sending password reset email:', error);
                alert('Error sending password reset email: ' + error.message);
            }
        }
    };

    const handleDisableAccount = async (id) => {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', id));
        const userData = userDoc.data();

        if (userData.isAdmin) {
            alert('This is an admin user and cannot be disabled.');
            return;
        }

        if (window.confirm('Are you sure you want to disable this student account?')) {
            try {
                await updateDoc(doc(db, 'users', id), {
                    isDisabled: true
                });
                setUsers(users.map(user => user.id === id ? { ...user, isDisabled: true } : user));
                alert('Student account successfully disabled');
            } catch (error) {
                console.error('Error disabling student account:', error);
                alert('Error disabling student account: ' + error.message);
            }
        }
    };

    const handleEnableAccount = async (id) => {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', id));
        const userData = userDoc.data();

        if (userData.isAdmin) {
            alert('This is an admin user and cannot be enabled.');
            return;
        }

        if (window.confirm('Are you sure you want to enable this student account?')) {
            try {
                await updateDoc(doc(db, 'users', id), {
                    isDisabled: false
                });
                setUsers(users.map(user => user.id === id ? { ...user, isDisabled: false } : user));
                alert('Student account successfully enabled');
            } catch (error) {
                console.error('Error enabling student account:', error);
                alert('Error enabling student account: ' + error.message);
            }
        }
    };

    const handleAddQuiz = async () => {
        if (!newQuiz.title || !newQuiz.level || !newQuiz.type || newQuiz.questions.length === 0) {
            alert('Please fill in all required fields and add at least one question.');
            return;
        }

        const db = getFirestore();
        try {
            const quizDocRef = doc(collection(db, 'quizzes'));
            await setDoc(quizDocRef, newQuiz);
            setQuizzes([...quizzes, { id: quizDocRef.id, ...newQuiz }]);
            setNewQuiz({ title: '', level: '', type: '', questions: [], showAnswers: false });
            setCurrentQuestion({ text: '', answers: [], correctAnswer: '' });
        } catch (error) {
            console.error('Error adding quiz:', error);
        }
    };

    const handleDeleteQuiz = async (id) => {
        const db = getFirestore();
        try {
            await deleteDoc(doc(db, 'quizzes', id));
            setQuizzes(quizzes.filter(quiz => quiz.id !== id));
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    };

    const handleClearLeaderboard = async () => {
        if (window.confirm('Are you sure you want to clear the leaderboard?')) {
            const db = getFirestore();
            try {
                const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
                const batch = writeBatch(db);
                leaderboardSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                setLeaderboard([]);
                alert('Leaderboard successfully cleared');
            } catch (error) {
                console.error('Error clearing leaderboard:', error);
                alert('Error clearing leaderboard: ' + error.message);
            }
        }
    };
    const handleAnswerSelection = (answer) => {
        setCurrentQuestion(prev => ({ ...prev, correctAnswer: answer }));
    };
    
    const handleClearQuizzesCompleted = async () => {
        if (window.confirm('Are you sure you want to clear the total quizzes completed?')) {
            const db = getFirestore();
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const batch = writeBatch(db);
                usersSnapshot.docs.forEach(doc => {
                    batch.update(doc.ref, { quizzesCompleted: 0 });
                });
                await batch.commit();
                setStats(prevStats => ({ ...prevStats, quizzesCompleted: 0 }));
                alert('Total quizzes completed successfully cleared');
            } catch (error) {
                console.error('Error clearing total quizzes completed:', error);
                alert('Error clearing total quizzes completed: ' + error.message);
            }
        }
    };

    const handleAddQuestion = () => {
        if (!currentQuestion.text) {
            alert('Please enter a question.');
            return;
        }
    
        if (newQuiz.type === 'True/False' && !currentQuestion.correctAnswer) {
            alert('Please select the correct answer for the true/false question.');
            return;
        }
    
        if (newQuiz.type === 'Multiple Choice' && currentQuestion.answers.length < 2) {
            alert('Please enter at least two answers for multiple choice questions.');
            return;
        }

        if (newQuiz.type === 'Multiple Choice' && !currentQuestion.correctAnswer) {
            alert('Please select the correct answer for multiple choice questions.');
            return;
        }

        if (newQuiz.type === 'Identification' && !currentQuestion.correctAnswer) {
            alert('Please enter the correct answer for identification questions.');
            return;
        }

        setNewQuiz(prevQuiz => ({
            ...prevQuiz,
            questions: [...prevQuiz.questions, currentQuestion]
        }));
        setCurrentQuestion({ text: '', answers: [], correctAnswer: '' });
    };

    return (
        <div className="dashboard-admin">
            <h1>Admin Dashboard</h1>
            <div className="stats-overview">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p>{stats.totalUsers}</p>
                </div>
                <div className="stat-card">
                    <h3>Active Users (Last 7 Days)</h3>
                    <p>{stats.activeUsers}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Quizzes Completed</h3>
                    <p>{stats.quizzesCompleted}</p>
                    <button className="handlequiz" onClick={handleClearQuizzesCompleted}>Clear Quizzes Completed</button>
                </div>
            </div>
            <div className="section">
      <h2>Manage Students</h2>
      
      <button className="studentadded" onClick={() => setShowModal(true)}>Add</button>

      {showModal && (
    <div className="modal-overlay">
        <div className="modal-content">
            <h3>Add New Student</h3>
            <input
                type="text"
                placeholder="First Name"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
            />
            <input
                type="text"
                placeholder="Middle Name"
                value={newStudent.middleName}
                onChange={(e) => setNewStudent({ ...newStudent, middleName: e.target.value })}
            />
            <input
                type="text"
                placeholder="Last Name"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
            />
            <input
                type="email"
                placeholder="Student Email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            />
            <div className="password-input">
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Student Password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
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
            <div className="addnew-student">
                <button className="addnew" onClick={handleAddStudent}>Confirm Add Student</button>
                <button className="cancelnew" onClick={() => setShowModal(false)}>Cancel</button>       
           </div>
          </div>
        </div>
      )}
                <ul style={{ color: 'cyan' }}>
                {users.length > 0 ? (
        users.map((user) => (
            <li key={user.id}>
            {user.firstName} {user.middleName} {user.lastName} - {user.email}
                {user.isAdmin ? (
                <span> (Admin - Cannot be deleted)</span>
                ) : (
                    <div className="button-container">
                        <button className="handlepassword" onClick={() => handleResetPassword(user.id)}>
                            Reset Password
                        </button>
                        <button className="handledisable" onClick={() => handleDisableAccount(user.id)}>
                            Disable Account
                        </button>
                        <button className="handledelete" onClick={() => handleDeleteStudent(user.id)}>
                            Delete Account
                        </button>
                    </div>
                )}
            </li>
        ))
    ) : (
        <li>No users found.</li>
    )}
                </ul>
            </div>
          
            <div className="section">
                <h2>Leaderboard</h2>
                <button className="handleleader" onClick={handleClearLeaderboard}>Clear Leaderboard</button>
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
                            leaderboard.map((user, index) => (
                                <tr key={user.id}>
                                    <td>{index + 1}</td>
                                    <td>{user.name}</td>
                                    <td>{user.score}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3">None</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="section">
                <h2>Manage Quizzes</h2>
                <input
                    type="text"
                    placeholder="Quiz Title"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    required
                />
                <input
                    type="number"
                    placeholder="Quiz Level"
                    value={newQuiz.level}
                    onChange={(e) => setNewQuiz({ ...newQuiz, level: e.target.value })}
                    min="1"
                    max="100"
                    required
                />
                <select
                    value={newQuiz.type}
                    onChange={(e) => setNewQuiz({ ...newQuiz, type: e.target.value })}
                    required
                >
                    <option value="">Select Quiz Type</option>
                    <option value="Multiple Choice">Multiple Choice</option>
                    <option value="Identification">Identification</option>
                    <option value="True or False">True or False</option>
                </select>
                <label>
                    <input
                        type="checkbox"
                        checked={newQuiz.showAnswers}
                        onChange={(e) => setNewQuiz({ ...newQuiz, showAnswers: e.target.checked })}
                    />
                    Show Correct Answers
                </label>
                <div className="questions-section">
                    <h3>Create Questions</h3>
                    <input
                        type="text"
                        placeholder="Question Text"
                        value={currentQuestion.text}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                        required
                    />
                    {newQuiz.type === 'Multiple Choice' && (
                        <div>
                            <input
                                type="text"
                                placeholder="Answer 1"
                                value={currentQuestion.answers[0] || ''}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answers: [e.target.value, ...currentQuestion.answers.slice(1)] })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Answer 2"
                                value={currentQuestion.answers[1] || ''}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answers: [currentQuestion.answers[0], e.target.value, ...currentQuestion.answers.slice(2)] })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Correct Answer (index)"
                                value={currentQuestion.correctAnswer}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                                required
                            />
                        </div>
                    )}
                    {newQuiz.type === 'Identification' && (
                        <input
                            type="text"
                            placeholder="Correct Answer"
                            value={currentQuestion.correctAnswer}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                            required
                        />
                    )}
                    {newQuiz.type === 'True or False' && (
                        <select
                            value={currentQuestion.correctAnswer}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                            required
                        >
                            <option value="">Select Correct Answer</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    )}
                    <button onClick={handleAddQuestion}>Add Question</button>
                </div>
                <button onClick={handleAddQuiz}>Add Quiz</button>
                <ul>
                    {quizzes.map(quiz => (
                        <li key={quiz.id}>
                            {quiz.title}
                            <button onClick={() => handleDeleteQuiz(quiz.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default DashboardAdmin;
