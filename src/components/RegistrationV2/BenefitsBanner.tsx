'use client';

import React from 'react';
import styles from './BenefitsBanner.module.css';

interface BenefitsBannerProps {
    showVetCoverage?: boolean;
}

export default function BenefitsBanner({ showVetCoverage = true }: BenefitsBannerProps) {
    const benefits = [
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-emergencias_pbfplq.svg',
            title: 'emergencias médicas',
            subtitle: 'Hasta $3,000 MXN',
            show: true
        },
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/Icon-vacuna_ybuall.svg',
            title: 'vacunación anual',
            subtitle: 'Hasta $300 MXN',
            show: true
        },
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-fallecimiento_xwqe2g.png',
            title: 'apoyo en caso de fallecimiento',
            subtitle: 'Hasta $2,000 MXN',
            show: true
        },
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-chat_mqbwg0.png',
            title: 'chat veterinario',
            subtitle: 'Disponibilidad 24/7',
            show: showVetCoverage
        },
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-comunidad_cvbgpt.svg',
            title: 'comunidad',
            subtitle: 'Una manada que te acompaña',
            show: true
        },
    ];

    return (
        <div className={styles.banner}>
            <div className={styles.marqueeTrack}>
                {benefits.filter(b => b.show).map((benefit, index) => (
                    <div key={`b1-${index}`} className={styles.benefit}>
                        <img src={benefit.icon} alt={benefit.title} className={styles.icon} />
                        <div className={styles.textContainer}>
                            <span className={styles.title}>{benefit.title}</span>
                            <span className={styles.subtitle}>{benefit.subtitle}</span>
                        </div>
                    </div>
                ))}
                {benefits.filter(b => b.show).map((benefit, index) => (
                    <div key={`b2-${index}`} className={styles.benefit}>
                        <img src={benefit.icon} alt={benefit.title} className={styles.icon} />
                        <div className={styles.textContainer}>
                            <span className={styles.title}>{benefit.title}</span>
                            <span className={styles.subtitle}>{benefit.subtitle}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
