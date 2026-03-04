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
            <div className={styles.marqueeTrack}>
                {/* Primera tanda de beneficios */}
                {benefits.filter(b => b.show).map((benefit, index) => (
                    <div key={`b1-${index}`} className={styles.benefit}>
                        <span className={styles.icon}>{benefit.icon}</span>
                        <div className={styles.checkWrapper}>
                            <span className={styles.check}>✓</span>
                        </div>
                        <span className={styles.text}>{benefit.text}</span>
                    </div>
                ))}
                {/* Segunda tanda de beneficios para el efecto infinito */}
                {benefits.filter(b => b.show).map((benefit, index) => (
                    <div key={`b2-${index}`} className={styles.benefit}>
                        <span className={styles.icon}>{benefit.icon}</span>
                        <div className={styles.checkWrapper}>
                            <span className={styles.check}>✓</span>
                        </div>
                        <span className={styles.text}>{benefit.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
