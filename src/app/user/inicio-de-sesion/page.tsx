'use client';

import { Suspense } from 'react';
import styles from './login.module.css';

function SuccessPageContent() {
    return (
        <section className={styles.section}>
            {/* Logo */}
            <img
                src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6930687c8f64d3b129a9cece_PATA_AMIGA_LOGOTIPO_EDITABLE-02.png"
                alt="Pata Amiga"
                className={styles.logo}
            />

            <div className={styles.card}>
                <h1 className={styles.title}>Únete a la manada</h1>

                {/* Stepper */}
                <div className={styles.stepper}>
                    <div className={styles.step}>
                        <div className={styles.stepIcon}>✔</div>
                        <span>Completa tu perfil</span>
                    </div>
                    <div className={styles.stepArrow}>→</div>
                    <div className={styles.step}>
                        <div className={styles.stepIcon}>✔</div>
                        <span>Registra a tus peludos</span>
                    </div>
                    <div className={styles.stepArrow}>→</div>
                    <div className={`${styles.step} ${styles.stepActive}`}>
                        <div className={styles.stepIcon}>👍</div>
                        <span>Finaliza tu solicitud</span>
                    </div>
                </div>

                {/* Success Box */}
                <div className={styles.successBox}>
                    <h2 className={styles.successTitle}>¡Tu solicitud fue enviada con éxito!</h2>
                    <span className={styles.successSubtitle}>Queremos que todo sea claro, justo y con amor por la comunidad.</span>

                    <p className={styles.successText}>
                        Tu solicitud ha sido recibida y el pago se procesó correctamente. <br />
                        Nuestro Comité revisará tu registro con empatía y responsabilidad. <br />
                        En un máximo de 24-48 horas recibirás una notificación con el estatus de tu solicitud por correo electrónico, y también podrás consultarlo desde tu cuenta en Pata Amiga.
                    </p>

                    <div className={styles.successDetail}>
                        Si eres aceptado, tu membresía se activará automáticamente. <br />
                        Si no, te devolveremos tu pago íntegro. <br />
                        Gracias por formar parte de una comunidad que cuida con el corazón.
                    </div>

                    <div className={styles.successIcon}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM12 6L10.59 7.41L14.17 11H7V13H14.17L10.59 16.59L12 18L18 12L12 6Z" fill="white" />
                        </svg>
                    </div>
                </div>

                {/* Login Button */}
                <a href="https://www.pataamiga.mx/user/inicio-de-sesion" className={styles.loginButton}>
                    Iniciar sesión
                    <div className={styles.buttonArrow}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor" />
                        </svg>
                    </div>
                </a>
            </div>
        </section>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ backgroundColor: '#15beb2', minHeight: '100vh' }} />}>
            <SuccessPageContent />
        </Suspense>
    );
}
