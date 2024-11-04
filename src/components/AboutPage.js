// src/components/AboutPage.js
import React from 'react';
import '../css/AboutPage.css';

import dev1Image from '../images/Luares.jpg';
import dev2Image from '../images/Ramos.jpg';
import dev3Image from '../images/Torres.png';
import dev4Image from '../images/Tristan.jpg';

function AboutPage() {
    const developers = [
        { name: 'Luares, Gener Bryan', image: dev1Image },
        { name: 'Ramos, King Philip', image: dev2Image },
        { name: 'Torres, Michael Lhance', image: dev3Image },
        { name: 'Sereño, Tristan', image: dev4Image },
    ];

    return (
        <div className="about-page">
            <h1>About Fix Me</h1>
            <p>
                Fix Me is an innovative mobile game designed to help aspiring IT professionals hone their skills through engaging puzzles and challenges.
            </p>
            <div className="developer-grid">
                {developers.map((dev, index) => (
                    <div key={index} className="developer-card">
                        <img src={dev.image} alt={dev.name} className="developer-image" />
                        <p>{dev.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AboutPage;