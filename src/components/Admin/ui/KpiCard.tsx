'use client';

import React from 'react';
import Link from 'next/link';
import styles from './KpiCard.module.css';

interface KpiCardProps {
    label: string;
    value: React.ReactNode;
    note?: string;
    noteVariant?: 'default' | 'success';
    href?: string;
}

export default function KpiCard({ label, value, note, noteVariant = 'default', href }: KpiCardProps) {
    const content = (
        <>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
            {note && (
                <span className={noteVariant === 'success' ? styles.noteSuccess : styles.note}>
                    {note}
                </span>
            )}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={`${styles.card} ${styles.linkable}`}>
                {content}
            </Link>
        );
    }

    return <div className={styles.card}>{content}</div>;
}
