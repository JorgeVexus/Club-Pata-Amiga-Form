'use client';

import React from 'react';
import styles from './BenefitsBanner.module.css';

interface BenefitsBannerProps {
    showVetCoverage?: boolean;
}

export default function BenefitsBanner({ showVetCoverage = true }: BenefitsBannerProps) {
    const benefits = [
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-comunidad_cvbgpt.svg',
            title: 'Comunidad',
            subtitle: 'Una manada que te acompaña',
            show: true
        },
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-emergencias_pbfplq.svg',
            title: 'Emergencias médicas',
            subtitle: 'Reintegro hasta $3,000 MXN',
            show: true
        },
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/Icon-vacuna_ybuall.svg',
            title: 'Vacunación anual',
            subtitle: 'Reintegro hasta $300 MXN',
            show: true
        },
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-fallecimiento_xwqe2g.png',
            title: 'Apoyo en caso de fallecimiento',
            subtitle: 'Reintegro hasta $2,000 MXN',
            show: true
        },
        {
            icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-chat_mqbwg0.png',
            title: 'Orientación veterinaria',
            subtitle: 'Chat 24/7',
            show: showVetCoverage
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
