'use client';

import React from 'react';
import styles from './StatusChip.module.css';

export type StatusChipTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusChipProps {
    children: React.ReactNode;
    tone: StatusChipTone;
}

export default function StatusChip({ children, tone }: StatusChipProps) {
    return <span className={`${styles.chip} ${styles[tone]}`}>{children}</span>;
}
