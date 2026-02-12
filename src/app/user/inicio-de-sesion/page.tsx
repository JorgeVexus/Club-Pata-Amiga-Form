'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        if (searchParams.get('payment') === 'success') {
            setShowBanner(true);
            window.history.replaceState({}, '', window.location.pathname);
            const timer = setTimeout(() => setShowBanner(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (!window.$memberstackDom) {
                throw new Error('Memberstack no está cargado. Intenta recargar la página.');
            }

            const result = await window.$memberstackDom.loginMemberEmailPassword({
                email,
                password,
            });

            if (result?.data) {
                // Redirect to dashboard after login
                window.location.href = '/';
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const msg = err?.message || '';
            if (msg.includes('Invalid') || msg.includes('password') || msg.includes('email')) {
                setError('Email o contraseña incorrectos. Intenta de nuevo.');
            } else if (msg.includes('Memberstack')) {
                setError(msg);
            } else {
                setError('Error al iniciar sesión. Verifica tus datos e intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [email, password]);

    const handleGoogleLogin = useCallback(async () => {
        try {
            if (!window.$memberstackDom) {
                alert('Memberstack no está cargado.');
                return;
            }
            await window.$memberstackDom.connectProvider({ provider: 'google' });
        } catch (err) {
            console.error('Google login error:', err);
        }
    }, []);

    const handleForgotPassword = useCallback(async () => {
        try {
            if (!window.$memberstackDom) return;
            await window.$memberstackDom.openModal('FORGOT_PASSWORD');
        } catch (err) {
            console.error('Forgot password error:', err);
        }
    }, []);

    return (
        <>
            {/* Payment Success Banner */}
            {showBanner && (
                <div className={styles.successBanner}>
                    <span>🎉 ¡Pago exitoso! Inicia sesión para acceder a tu cuenta.</span>
                    <button className={styles.bannerClose} onClick={() => setShowBanner(false)}>✕</button>
                </div>
            )}

            <section className={styles.section}>
                {/* Logo */}
                <img
                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6930687c8f64d3b129a9cece_PATA_AMIGA_LOGOTIPO_EDITABLE-02.png"
                    alt="Pata Amiga"
                    className={styles.logo}
                />

                <div className={styles.card}>
                    {/* Form Side */}
                    <div className={styles.formSide}>
                        <div className={styles.headerStyle}>
                            <h1 className={styles.title}>Iniciar sesión</h1>
                            <p className={styles.subtitle}>
                                Tu manada te extraña. Ingresa y sigamos cuidando juntos.
                            </p>
                        </div>

                        <form className={styles.form} onSubmit={handleLogin}>
                            <div className={styles.inputWrap}>
                                <label className={styles.fieldLabel} htmlFor="login-email">Email</label>
                                <input
                                    className={styles.fieldInput}
                                    type="email"
                                    id="login-email"
                                    placeholder="Correo electrónico"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.inputWrap}>
                                <label className={styles.fieldLabel} htmlFor="login-password">Password</label>
                                <div className={styles.passwordWrap}>
                                    <input
                                        className={styles.fieldInput}
                                        type={showPassword ? 'text' : 'password'}
                                        id="login-password"
                                        placeholder="Contraseña"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
                                                <path d="M0 0h24v24H0V0z" fill="none" />
                                                <path d="M12 6.5c2.76 0 5 2.24 5 5 0 .51-.1 1-.24 1.46l3.06 3.06c1.39-1.23 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l2.17 2.17c.47-.14.96-.24 1.47-.24zM2.71 3.16c-.39.39-.39 1.02 0 1.41l1.97 1.97C3.06 7.83 1.77 9.53 1 11.5 2.73 15.89 7 19 12 19c1.52 0 2.97-.3 4.31-.82l2.72 2.72c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L4.13 3.16c-.39-.39-1.03-.39-1.42 0zM12 16.5c-2.76 0-5-2.24-5-5 0-.77.18-1.5.49-2.14l1.57 1.57c-.03.18-.06.37-.06.57 0 1.66 1.34 3 3 3 .2 0 .38-.03.57-.07L14.14 16c-.65.32-1.37.5-2.14.5zm2.97-5.33c-.15-1.4-1.25-2.49-2.64-2.64l2.64 2.64z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
                                                <path fill="none" d="M0 0h24v24H0V0z" />
                                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className={styles.errorMessage}>{error}</div>
                            )}

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                            </button>

                            <div className={styles.bottomLinks}>
                                <button
                                    type="button"
                                    className={styles.forgotLink}
                                    onClick={handleForgotPassword}
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <div className={styles.dividerWrap}>
                                <span className={styles.dividerText}>O continúa con:</span>
                            </div>

                            <button
                                type="button"
                                className={styles.googleButton}
                                onClick={handleGoogleLogin}
                            >
                                <img
                                    src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698cd1da87067e1988e45b7f_google%20icon.svg"
                                    alt="Google"
                                    className={styles.googleIcon}
                                />
                            </button>

                            <div className={styles.registerText}>
                                ¿Aún no eres parte de la manada?{' '}
                                <a href="/usuarios/registro" className={styles.registerLink}>
                                    <strong>Crea una cuenta aquí</strong>
                                </a>
                            </div>
                        </form>
                    </div>

                    {/* Image Side */}
                    <div className={styles.imageSide}>
                        <img
                            src="https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/698cd2a169db7bc5127218e7_img%20login.png"
                            alt="Chico con gato"
                            className={styles.loginImage}
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
