'use client';

import React from 'react';
import styles from './AdminComingSoon.module.css';

interface AdminComingSoonProps {
    title: string;
}

export default function AdminComingSoon({ title }: AdminComingSoonProps) {
    return (
        <div className={styles.wrapper}>
            <h1 className={styles.title}>{title}</h1>
            <span className={styles.badge}>Llega en un próximo milestone 🐾</span>
        </div>
    );
}
