'use client';

import React from 'react';
import styles from './CommunicationsHub.module.css';

export default function MessageSender() {
    return (
        <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📤</span>
            <h3>Panel de Mensajería</h3>
            <p>Este módulo (Chunk 3 y 4) permitirá seleccionar miembros y enviarles mensajes usando tus plantillas.</p>
            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                Próximamente: Integración con Resend y WhatsApp Click-to-Chat.
            </p>
        </div>
    );
}
