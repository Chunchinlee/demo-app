import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccountStatusPage = ({ accountStatus }) => {
    const navigate = useNavigate();

    if (accountStatus === 'deleted') {
        return (
            <div className="account-status">
                <h2>Your account has been deleted.</h2>
                <p>Please contact the admin for more information.</p>
                <button onClick={() => navigate('/')}>Go Back</button>
                <button onClick={() => navigate('/login')}>Logout</button>
            </div>
        );
    }

    if (accountStatus === 'disabled') {
        return (
            <div className="account-status">
                <h2>Your account has been disabled.</h2>
                <p>Please contact the admin for more information.</p>
                <button onClick={() => navigate('/')}>Go Back</button>
                <button onClick={() => navigate('/login')}>Logout</button>
            </div>
        );
    }

    return null;
};

export default AccountStatusPage;
