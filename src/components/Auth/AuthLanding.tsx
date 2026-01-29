'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AuthLanding.module.css';

export default function AuthLanding() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Email Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailMode, setIsEmailMode] = useState(false);

    // Verificación de sesión y redirección dinámica
    React.useEffect(() => {
        const checkSession = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (window.$memberstackDom) {
                try {
                    const { data: member } = await window.$memberstackDom.getCurrentMember();
                    if (member) {
                        console.log('✅ Usuario detectado, verificando rol...');

                        try {
                            const res = await fetch('/api/auth/check-role', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ memberstackId: member.id })
                            });
                            const data = await res.json();

                            if (data.role === 'ambassador') {
                                console.log('👤 Es embajador, redirigiendo a su dashboard...');
                                window.location.href = 'https://club-pata-amiga-6d0e72.webflow.io/embajadores/embajadores';
                            } else {
                                console.log('🐾 Es miembro, redirigiendo a dashboard de usuario...');
                                window.location.href = 'https://club-pata-amiga-6d0e72.webflow.io/pets/pet-waiting-period';
                            }
                        } catch (err) {
                            console.error('Error checando rol, fallback a default');
                            window.location.href = 'https://club-pata-amiga-6d0e72.webflow.io/pets/pet-waiting-period';
                        }
                    }
                } catch (e) {
                    console.log('No hay sesión activa.');
                }
            }
        };
        checkSession();
    }, [router]);

    // Nota: Usamos loginWithProvider explícitamente ya que los data-attributes no estaban respondiendo
    // y authenticateWithProvider no existe en esta versión del script.

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await window.$memberstackDom.signupWithProvider({
                provider: 'google'
            });
            // Al regresar de Google, si es login, la página suele recargarse o el estado cambia.
            // Si es SPA, activamos la verificación de nuevo.
            window.location.reload();
        } catch (error) {
            console.error('Signup error', error);
            setIsLoading(false);
        }
    };

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data } = await window.$memberstackDom.signupMemberEmailPassword({
                email,
                password
            });

            if (data) {
                // Éxito, redirigir
                router.push('/completar-perfil');
            } else {
                throw new Error('No se pudo crear la cuenta');
            }
        } catch (err: any) {
            console.error('Email Auth Error:', err);
            if (err.message?.includes('exists')) {
                setError('Este correo ya está registrado. Intenta iniciar sesión.');
            } else {
                setError(err.message || 'Error al registrarse. Verifica tus datos.');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Bienvenido a la Manada 🐾</h1>
                    <p className={styles.subtitle}>
                        Crea tu cuenta para comenzar el registro de tu mascota seguro y respaldado.
                    </p>
                </div>

                {/* Social Login */}
                <button
                    className={styles.googleButton}
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    type="button"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className={styles.googleIcon} />
                    Continuar con Google
                </button>

                <div className={styles.divider}>
                    <span>O con tu correo</span>
                </div>

                {/* Email Form */}
                {!isEmailMode ? (
                    <button
                        className={styles.emailButton}
                        onClick={() => setIsEmailMode(true)}
                    >
                        Registrarse con Correo
                    </button>
                ) : (
                    <form onSubmit={handleEmailSignup} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Correo Electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                required
                                minLength={8}
                                className={styles.input}
                            />
                        </div>

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>

                        <button
                            type="button"
                            className={styles.backButton}
                            onClick={() => setIsEmailMode(false)}
                        >
                            Volver
                        </button>
                    </form>
                )}

                <p className={styles.loginLink}>
                    ¿Ya tienes cuenta? <a href="#" onClick={(e) => {
                        e.preventDefault();
                        window.$memberstackDom.openModal('LOGIN');
                    }}>Inicia Sesión</a>
                </p>
            </div>
        </div>
    );
}
