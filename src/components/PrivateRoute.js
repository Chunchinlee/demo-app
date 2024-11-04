import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ user, userData, component: Component, showToast, ...rest }) => {
    if (!user) {
        return <Navigate to="/login" />;
    }

    if (userData && (userData.isDeleted || userData.isDisabled)) {
        return <Navigate to="/account-status" />;
    }

    return <Component {...rest} user={user} showToast={showToast} />;
};

export default PrivateRoute;
