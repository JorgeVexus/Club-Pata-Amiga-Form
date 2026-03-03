/**
 * Sección de Adopción - Componente reutilizable
 * Muestra el formulario de historia de adopción
 * 
 * Uso:
 * - Dashboard de usuario (próximamente)
 * - Perfil de mascota
 * 
 * Props:
 * - isAdopted: boolean - Si la mascota fue adoptada
 * - adoptionStory: string - La historia de adopción
 * - onAdoptedChange: (isAdopted: boolean) => void - Callback cuando cambia el checkbox
 * - onStoryChange: (story: string) => void - Callback cuando cambia el textarea
 * - readOnly?: boolean - Si es solo lectura (para dashboard)
 */

'use client';

import React from 'react';
import styles from './steps/steps.module.css';

interface AdoptionSectionProps {
    isAdopted: boolean;
    adoptionStory: string;
    onAdoptedChange: (isAdopted: boolean) => void;
    onStoryChange: (story: string) => void;
    readOnly?: boolean;
}

export default function AdoptionSection({
    isAdopted,
    adoptionStory,
    onAdoptedChange,
    onStoryChange,
    readOnly = false
}: AdoptionSectionProps) {
    return (
        <div className={styles.adoptionSection}>
            <div className={styles.adoptionHeader}>
                <div className={styles.adoptionIcon}>🏠</div>
                <div>
                    <h3 className={styles.adoptionTitle}>Historia de adopción</h3>
                    <p className={styles.adoptionSubtitle}>
                        ¿Tu mascota encontró un hogar contigo?
                    </p>
                </div>
            </div>
            
            <div className={styles.adoptionCheckboxWrapper}>
                <label className={`${styles.adoptionCheckbox} ${readOnly ? styles.readOnly : ''}`}>
                    <input
                        type="checkbox"
                        checked={isAdopted}
                        onChange={(e) => !readOnly && onAdoptedChange(e.target.checked)}
                        disabled={readOnly}
                    />
                    <span className={styles.adoptionCheckboxText}>
                        Sí, fue adoptado/a
                    </span>
                </label>
            </div>

            {isAdopted && (
                <div className={styles.adoptionStoryWrapper}>
                    <label className={styles.adoptionStoryLabel}>
                        Cuéntanos su historia
                    </label>
                    <textarea
                        value={adoptionStory}
                        onChange={(e) => !readOnly && onStoryChange(e.target.value)}
                        placeholder="¿Cómo llegó a tu vida? Cuéntanos esa historia especial..."
                        className={styles.adoptionTextarea}
                        rows={4}
                        maxLength={500}
                        disabled={readOnly}
                        readOnly={readOnly}
                    />
                    <div className={styles.adoptionCharCount}>
                        <strong>{adoptionStory.length}</strong> / 500 caracteres
                    </div>
                </div>
            )}
        </div>
    );
}
