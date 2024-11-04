// src/components/toast.js
import React, { useState } from 'react';
import ToastNotification from './ToastNotification';

const useToast = () => {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    return { toast, showToast, hideToast };
};

export default useToast;
