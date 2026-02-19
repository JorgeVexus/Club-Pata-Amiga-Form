'use client';

import React from 'react';
import HelpSection from '@/components/UI/HelpSection';
import styles from './Step4Success.module.css';

export default function Step4Success() {
    return (
        <div className={styles.pageContainer}>
            {/* Subtítulo */}
            <div className={styles.landingSubtitle}>
                <h2>¡Ya casi! Tu solicitud fue enviada</h2>
                <p>¡Gracias por querer sumar tu voz a la manada! Tu registro como Embajador está en revisión y te responderemos en las próximas 24-48 horas.</p>
                <span className={styles.privacyNote}>Mientras tanto, siéntete tranquilo: ya diste el primer paso para que más peludos y sus familias estén protegidos.</span>
            </div>

            {/* Recuadro naranja - ¿Qué sigue? */}
            <div className={styles.orangeFormBox}>
                <div className={styles.successContent}>
                    <h3 className={styles.whatNextTitle}>¿Qué sigue?</h3>
                    
                    <ol className={styles.stepsList}>
                        <li>
                            <strong>Revisaremos tu solicitud en 24-48 horas</strong>
                            <span>Nuestro equipo verificará que todo esté en orden</span>
                        </li>
                        <li>
                            <strong>Te enviaremos tu código personal</strong>
                            <span>Si eres aprobado, recibirás un correo con tu código único y materiales para empezar</span>
                        </li>
                        <li>
                            <strong>¡Empieza a compartir!</strong>
                            <span>Usa tu código, comparte en redes, habla con amigos y empieza a generar comisiones</span>
                        </li>
                        <li>
                            <strong>Recibe tus pagos mensuales</strong>
                            <span>Cada mes depositaremos tus comisiones en la cuenta que registraste</span>
                        </li>
                    </ol>
                </div>
            </div>

            {/* Recuadro verde de contacto */}
            <div className={styles.contactBox}>
                <div className={styles.contactContent}>
                    <h3>¿Tienes dudas? Comunícate con nosotros</h3>
                    <p className={styles.contactEmail}>embajadores@clubpataamiga.mx</p>
                    <p className={styles.contactNote}>Respondemos tus dudas en menos de 48h</p>
                </div>
            </div>

            {/* Botones */}
            <div className={styles.buttonsRow}>
                <a 
                    href="https://www.pataamiga.mx/user/inicio-de-sesion"
                    className={styles.loginButton}
                >
                    Iniciar sesión
                    <span className={styles.btnIconCircleWhite}>→</span>
                </a>
            </div>

            {/* Help Section */}
            <HelpSection email="contacto@pataamiga.mx" />
        </div>
    );
}
