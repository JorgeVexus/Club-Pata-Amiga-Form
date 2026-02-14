'use client';

import React from 'react';
import styles from './BrandLogo.module.css';

export default function BrandLogo() {
    return (
        <a
            href="https://www.pataamiga.mx"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.logoLink}
        >
            <img
                src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6930687c8f64d3b129a9cece_PATA_AMIGA_LOGOTIPO_EDITABLE-02.webp"
                alt="Pata Amiga Logo"
                className={styles.logoImage}
            />
        </a>
    );
}
