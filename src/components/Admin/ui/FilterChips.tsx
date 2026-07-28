'use client';

import React from 'react';
import styles from './FilterChips.module.css';

export interface FilterChipOption {
    id: string;
    label: string;
    count?: number;
}

interface FilterChipsProps {
    options: FilterChipOption[];
    activeId: string;
    onChange: (id: string) => void;
}

export default function FilterChips({ options, activeId, onChange }: FilterChipsProps) {
    return (
        <div className={styles.row}>
            {options.map((opt) => (
                <button
                    key={opt.id}
                    type="button"
                    className={`${styles.chip} ${activeId === opt.id ? styles.chipActive : ''}`}
                    onClick={() => onChange(opt.id)}
                >
                    {opt.label}
                    {opt.count !== undefined && <span className={styles.count}>{opt.count}</span>}
                </button>
            ))}
        </div>
    );
}
