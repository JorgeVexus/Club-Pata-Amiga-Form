'use client';

import React from 'react';
import styles from './BenefitsBanner.module.css';

interface BenefitsBannerProps {
    showVetCoverage?: boolean;
}

export default function BenefitsBanner({ showVetCoverage = true }: BenefitsBannerProps) {
    const benefits = [
        { icon: '🏥', text: 'Cobertura veterinaria', show: true },
        { icon: '🚑', text: 'Emergencias 24/7', show: true },
        { icon: '💰', text: 'Sin deducible', show: true },
        { icon: '⚕️', text: 'Telemedicina', show: showVetCoverage },
    ];

    return (
        <div className={styles.banner}>
            {benefits.filter(b => b.show).map((benefit, index) => (
                <div key={index} className={styles.benefit}>
                    <span className={styles.icon}>{benefit.icon}</span>
                    <span className={styles.check}>✓</span>
                    <span>{benefit.text}</span>
                </div>
            ))}
        </div>
    );
}
