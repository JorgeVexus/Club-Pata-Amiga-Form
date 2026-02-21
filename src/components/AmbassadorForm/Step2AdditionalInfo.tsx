'use client';

import React from 'react';
import { AmbassadorStep2Data } from '@/types/ambassador.types';
import HelpSection from '@/components/UI/HelpSection';
import styles from './Step2AdditionalInfo.module.css';

interface Step2Props {
    data: AmbassadorStep2Data;
    onChange: (field: keyof AmbassadorStep2Data, value: string) => void;
    errors: Partial<Record<keyof AmbassadorStep2Data, string>>;
    onBack?: () => void;
    onNext?: () => void;
}

export default function Step2AdditionalInfo({ data, onChange, errors, onBack, onNext }: Step2Props) {
    return (
        <div className={styles.pageContainer}>
            {/* Subtítulo -- La imagen de la niña se maneja desde page.tsx -- */}
            <div className={styles.landingSubtitle}>
                <h2>información adicional</h2>
                <p>Comparte tus redes sociales <span className={styles.requiredTag}>(Al menos una es obligatoria)</span></p>
                <span className={styles.privacyNote}>Nos ayuda a entender como te gusta compartir y cómo podemos apoyarte mejor</span>
            </div>

            {/* Formulario naranja */}
            <div className={styles.orangeFormBox}>
                {/* Badge icono verde */}
                <div className={styles.formBadge}>
                    <img 
                        src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1771518105/embajadores_step_2_icon_od544d.svg"
                        alt=""
                        width="85"
                        height="85"
                    />
                </div>

                {/* Redes sociales */}
                <div className={styles.sectionTitle}>Redes sociales</div>
                {errors.social_networks && (
                    <div className={styles.errorBanner}>{errors.social_networks}</div>
                )}

                <div className={styles.socialInputs}>
                    {/* Instagram */}
                    <div className={styles.socialInputWrapper}>
                        <div className={styles.socialIcon} style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                            📸
                        </div>
                        <input
                            type="text"
                            value={data.instagram}
                            onChange={(e) => onChange('instagram', e.target.value)}
                            placeholder="@instagram"
                            className={styles.orangeInput}
                        />
                    </div>

                    {/* Facebook */}
                    <div className={styles.socialInputWrapper}>
                        <div className={styles.socialIcon} style={{ background: '#1877F2' }}>
                            👤
                        </div>
                        <input
                            type="text"
                            value={data.facebook}
                            onChange={(e) => onChange('facebook', e.target.value)}
                            placeholder="@facebook"
                            className={styles.orangeInput}
                        />
                    </div>

                    {/* TikTok */}
                    <div className={styles.socialInputWrapper}>
                        <div className={styles.socialIcon} style={{ background: '#000000' }}>
                            🎵
                        </div>
                        <input
                            type="text"
                            value={data.tiktok}
                            onChange={(e) => onChange('tiktok', e.target.value)}
                            placeholder="@Tiktok"
                            className={styles.orangeInput}
                        />
                    </div>

                    {/* Otra red */}
                    <div className={styles.socialInputWrapper}>
                        <div className={styles.socialIcon} style={{ background: '#FE8F15' }}>
                            ➕
                        </div>
                        <input
                            type="text"
                            value={data.other_social}
                            onChange={(e) => onChange('other_social', e.target.value)}
                            placeholder="Agregar otra red social"
                            className={styles.orangeInput}
                        />
                    </div>
                </div>

                {/* Separador */}
                <div className={styles.separator}></div>

                {/* Motivación */}
                <div className={styles.motivationSection}>
                    <label className={styles.motivationLabel}>¿Por qué quieres ser embajador de Pata Amiga?</label>
                    <textarea
                        value={data.motivation}
                        onChange={(e) => onChange('motivation', e.target.value)}
                        placeholder="Cuéntanos tu historia, ¿por qué te conecta esta causa?"
                        rows={5}
                        className={`${styles.orangeTextarea} ${errors.motivation ? styles.error : ''}`}
                    />
                    {errors.motivation && (
                        <span className={styles.errorMessage}>{errors.motivation}</span>
                    )}
                    <div className={styles.charCount}>
                        <span>Mínimo 50 caracteres</span>
                        <span>{data.motivation.length} / 500</span>
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div className={styles.buttonsRow}>
                <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={onBack}
                >
                    Cancelar
                </button>
                <div className={styles.navButtons}>
                    <button 
                        type="button" 
                        className={styles.backButton}
                        onClick={onBack}
                    >
                        <span className={styles.btnIconCircle}>←</span>
                        Anterior
                    </button>
                    <button 
                        type="button" 
                        className={styles.nextButton}
                        onClick={onNext}
                    >
                        Siguiente
                        <span className={styles.btnIconCircleWhite}>→</span>
                    </button>
                </div>
            </div>

            {/* Help Section */}
            <HelpSection email="contacto@pataamiga.mx" />
        </div>
    );
}
