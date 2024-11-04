// src/components/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../css/HomePage.css';

function HomePage() {
    return (
        <div className="home-page">
        <h1>Fix Me</h1>
        <p>Mobile Game for Aspiring ITs</p>
        <Link to="/download" className="download-button">
            <img src="/images/FixMeAndroidIconDownload.png" alt="Android Icon" />
            Download Now!
        </Link>
        </div>
    );
}

export default HomePage;
