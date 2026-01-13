'use client';

import React from 'react';
import { AmbassadorStep2Data } from '@/types/ambassador.types';
import styles from './AmbassadorForm.module.css';

interface Step2Props {
    data: AmbassadorStep2Data;
    onChange: (field: keyof AmbassadorStep2Data, value: string) => void;
    errors: Partial<Record<keyof AmbassadorStep2Data, string>>;
}

export default function Step2AdditionalInfo({ data, onChange, errors }: Step2Props) {
    return (
        <div>
            <div className={styles['ambassador-form-title']}>
                <h2>📋 Información adicional</h2>
            </div>

            {/* Redes Sociales */}
            <div className={styles['ambassador-field']}>
                <label>Comparte tus redes sociales <span style={{ color: '#999' }}>(Opcional)</span></label>
                <p className={styles['helper-text']} style={{ marginBottom: '15px' }}>
                    Aunque no es obligatorio, nos ayuda a entender como te gusta compartir y cómo podemos apoyarte mejor
                </p>

                <div className={styles['ambassador-social-grid']}>
                    {/* Instagram */}
                    <div className={styles['ambassador-social-input']}>
                        <span className="icon">📸</span>
                        <input
                            type="text"
                            value={data.instagram}
                            onChange={(e) => onChange('instagram', e.target.value)}
                            placeholder="@instagram"
                        />
                    </div>

                    {/* Facebook */}
                    <div className={styles['ambassador-social-input']}>
                        <span className="icon">👤</span>
                        <input
                            type="text"
                            value={data.facebook}
                            onChange={(e) => onChange('facebook', e.target.value)}
                            placeholder="@facebook"
                        />
                    </div>

                    {/* TikTok */}
                    <div className={styles['ambassador-social-input']}>
                        <span className="icon">🎵</span>
                        <input
                            type="text"
                            value={data.tiktok}
                            onChange={(e) => onChange('tiktok', e.target.value)}
                            placeholder="@TikTok"
                        />
                    </div>

                    {/* Otra red */}
                    <div className={styles['ambassador-social-input']}>
                        <span className="icon">➕</span>
                        <input
                            type="text"
                            value={data.other_social}
                            onChange={(e) => onChange('other_social', e.target.value)}
                            placeholder="Agregar otra red social"
                        />
                    </div>
                </div>
            </div>

            {/* Motivación */}
            <div className={styles['ambassador-field']} style={{ marginTop: '30px' }}>
                <label>¿Por qué quieres ser embajador de Pata Amiga? *</label>
                <textarea
                    value={data.motivation}
                    onChange={(e) => onChange('motivation', e.target.value)}
                    placeholder="Cuéntanos tu historia, ¿por qué te conecta esta causa?"
                    rows={6}
                    style={{ resize: 'vertical', minHeight: '150px' }}
                    className={errors.motivation ? styles.error : ''}
                />
                {errors.motivation && (
                    <span className={styles['error-message']}>{errors.motivation}</span>
                )}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    fontSize: '0.85rem',
                    color: '#999'
                }}>
                    <span>Mínimo 50 caracteres</span>
                    <span>{data.motivation.length} / 500</span>
                </div>
            </div>
        </div>
    );
}
