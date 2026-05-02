'use client';

import React from 'react';
import styles from './BenefitsMarquee.module.css';

const BENEFITS = [
    {
        icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-emergencias_pbfplq.svg',
        title: 'emergencias médicas',
        subtitle: 'Hasta $3,000 MXN'
    },
    {
        icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/Icon-vacuna_ybuall.svg',
        title: 'vacunación anual',
        subtitle: 'Hasta $300 MXN'
    },
    {
        icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-fallecimiento_xwqe2g.png',
        title: 'apoyo en caso de fallecimiento',
        subtitle: 'Hasta $2,000 MXN'
    },
    {
        icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-chat_mqbwg0.png',
        title: 'chat veterinario',
        subtitle: 'Disponibilidad 24/7'
    },
    {
        icon: 'https://res.cloudinary.com/dqy07kgu6/image/upload/v1772904245/icon-comunidad_cvbgpt.svg',
        title: 'comunidad',
        subtitle: 'Una manada que te acompaña'
    }
];

export default function BenefitsMarquee() {
    // Duplicate the benefits array to create an infinite loop effect
    const marqueeItems = [...BENEFITS, ...BENEFITS];

    return (
        <div className={styles.wrapper}>
            <div className={styles.track}>
                {marqueeItems.map((benefit, index) => (
                    <div key={index} className={styles.item}>
                        <img src={benefit.icon} className={styles.icon} alt="" />
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
