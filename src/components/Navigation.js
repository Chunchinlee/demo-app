import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import '../css/Navigation.css';

function Navigation({ user }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [navLinksOpen, setNavLinksOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        const auth = getAuth();
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const toggleDropdown = () => {
        setDropdownOpen(prev => !prev);
    };

    const toggleNavLinks = () => {
        setNavLinksOpen(prev => {
            console.log('Nav links open:', !prev); // Debugging statement
            return !prev; // Toggle mobile nav links
        });
    };

    return (
        <nav className="navigation">
            <Link to="/" className="nav-logo">
                <img src="/images/FixMeLogo.png" alt="Fix Me Logo" className="logo-image" />
            </Link>
            <button className="mobile-menu-button" onClick={toggleNavLinks}>
                ☰
            </button>
            <div className={`nav-links ${navLinksOpen ? 'show' : ''}`}>
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                {user ? (
                    <>
                        <Link to="/dashboard">Dashboard</Link>
                        <div className="user-menu">
                            <span className="user-email" onClick={toggleDropdown}>
                                {user.email}
                            </span>
                            <div className={`user-dropdown ${dropdownOpen ? 'show' : ''}`}>
                                <Link to="/profile">Profile</Link>
                                <Link to="/quizzes">Quizzes</Link>
                                <button onClick={handleLogout} className="logout-button">Logout</button>
                            </div>
                        </div>
                    </>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </div>
        </nav>
    );
}

export default Navigation;
