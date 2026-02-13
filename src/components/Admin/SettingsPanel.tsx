'use client';

import React from 'react';
import styles from './AdminDashboard.module.css';

interface SettingsPanelProps {
    skipPaymentEnabled: boolean;
    onToggleSkipPayment: (enabled: boolean) => void;
}

export default function SettingsPanel({ skipPaymentEnabled, onToggleSkipPayment }: SettingsPanelProps) {
    return (
        <div style={{ maxWidth: 600 }}>
            <div className={styles.sectionCard} style={{
                background: '#fff',
                borderRadius: 16,
                padding: '2rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#333' }}>
                    ⚙️ Opciones de Prueba
                </h3>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: skipPaymentEnabled ? '#FFF3E0' : '#F5F5F7',
                    borderRadius: 12,
                    border: skipPaymentEnabled ? '1px solid #FFB74D' : '1px solid #E5E5E5',
                    transition: 'all 0.3s ease'
                }}>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#333' }}>
                            Modo Test (Skip Payment)
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                            {skipPaymentEnabled
                                ? '⚠️ Los usuarios pueden registrarse sin pagar'
                                : 'Los usuarios deben completar el pago para registrarse'}
                        </div>
                    </div>

                    <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: 52,
                        height: 28,
                        flexShrink: 0,
                        marginLeft: '1rem'
                    }}>
                        <input
                            type="checkbox"
                            checked={skipPaymentEnabled}
                            onChange={(e) => onToggleSkipPayment(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: skipPaymentEnabled ? '#FF9800' : '#ccc',
                            borderRadius: 28,
                            transition: '0.3s',
                        }}>
                            <span style={{
                                position: 'absolute',
                                content: '""',
                                height: 22,
                                width: 22,
                                left: skipPaymentEnabled ? 26 : 3,
                                bottom: 3,
                                background: '#fff',
                                borderRadius: '50%',
                                transition: '0.3s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                        </span>
                    </label>
                </div>

                {skipPaymentEnabled && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        background: '#FFF8E1',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        color: '#E65100',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        🚨 <strong>Recuerda desactivar esto antes del lanzamiento.</strong>
                    </div>
                )}
            </div>
        </div>
    );
}
