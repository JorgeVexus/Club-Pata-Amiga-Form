'use client';

import React, { useEffect } from 'react';
import styles from './Toast.module.css';

export interface ToastProps {
    message: string;
    type?: 'error' | 'success' | 'warning';
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export default function Toast({
    message,
    type = 'error',
    isVisible,
    onClose,
    duration = 4000
}: ToastProps) {

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'error': return '❌';
            case 'success': return '✅';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    const getTypeClass = () => {
        switch (type) {
            case 'error': return styles.error;
            case 'success': return styles.success;
            case 'warning': return styles.warning;
            default: return '';
        }
    };

    return (
        <div className={`${styles.toast} ${isVisible ? styles.toastVisible : ''} ${getTypeClass()}`}>
            <span className={styles.icon}>{getIcon()}</span>
            <span className={styles.message}>{message}</span>
        </div>
    );
}
