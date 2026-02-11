/**
 * Toggle/Switch component - Diseño Figma Pata Amiga
 */

import React from 'react';
import styles from './Toggle.module.css';

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    helpText?: string;
    name?: string;
}

export default function Toggle({
    label,
    checked,
    onChange,
    helpText,
    name = 'toggle',
}: ToggleProps) {
    return (
        <div className={styles.fieldWrapper}>
            <label className={styles.toggleLabel}>
                <span className={styles.labelText}>{label}</span>
                <div className={styles.toggleWrapper}>
                    <input
                        type="checkbox"
                        name={name}
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        className={styles.toggleInput}
                        role="switch"
                    />
                    <span className={`${styles.toggleSlider} ${checked ? styles.checked : ''}`} />
                </div>
            </label>
            {helpText && <p className={styles.helpText}>{helpText}</p>}
        </div>
    );
}
