// src/components/ToastNotification.js
import React, { useState, useEffect } from 'react';
import '../css/ToastNotification.css';

function ToastNotification({ message, type = 'info', duration = 3000, onClose }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`toast-notification ${type}`}>
            <p>{message}</p>
        </div>
    );
}

export default ToastNotification;
