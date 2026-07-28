'use client';

import React from 'react';
import styles from './PillButton.module.css';

type PillButtonVariant = 'primary' | 'outline' | 'danger';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: PillButtonVariant;
    small?: boolean;
}

export default function PillButton({
    variant = 'primary',
    small,
    className = '',
    children,
    ...rest
}: PillButtonProps) {
    const cls = [styles.btn, styles[variant], small ? styles.small : '', className]
        .filter(Boolean)
        .join(' ');

    return (
        <button className={cls} {...rest}>
            {children}
        </button>
    );
}
