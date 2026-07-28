'use client';

import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    large?: boolean;
    noPadding?: boolean;
    className?: string;
}

export default function Card({ children, large, noPadding, className = '' }: CardProps) {
    const cls = [
        styles.card,
        large ? styles.cardLg : '',
        noPadding ? styles.cardNoPadding : '',
        className,
    ].filter(Boolean).join(' ');

    return <div className={cls}>{children}</div>;
}
