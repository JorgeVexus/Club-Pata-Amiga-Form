/**
 * Sección de ayuda - Diseño Figma Pata Amiga
 * Muestra información de contacto con imagen de mascota
 */

'use client';

import React from 'react';
import styles from './HelpSection.module.css';

interface HelpSectionProps {
    email?: string;
    phone?: string;
}

export default function HelpSection({
    email = 'contacto@pataamiga.mx',
    phone, // El teléfono se oculta si no se pasa como prop
}: HelpSectionProps) {
    return (
        <div className={styles.helpSection}>
            <div className={styles.dogPhoto}>
                <img
                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698df7162dcc8cf77605f9c4_3a36b4693a9c0f39d18d08ff201360e0_help%20box%20img.png"
                    alt="French Bulldog"
                    className={styles.dogImage}
                />
            </div>
            <div className={styles.helpContent}>
                <h3 className={styles.helpTitle}>¿Necesitas ayuda?</h3>
                <p className={styles.helpSubtitle}>Contáctanos</p>
                <div className={styles.contactInfo}>
                    <a href={`mailto:${email}`} className={styles.contactLink}>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        {email}
                    </a>
                    {phone && (
                        <a href={`tel:${phone.replace(/\s/g, '')}`} className={styles.contactLink}>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            {phone}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
