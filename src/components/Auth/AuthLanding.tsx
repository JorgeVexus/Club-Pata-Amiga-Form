'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackLead, trackCompleteRegistration } from '@/components/Analytics/MetaPixel';
import styles from './AuthLanding.module.css';

export default function AuthLanding() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [existingSession, setExistingSession] = useState<{ email: string; role: string; redirectUrl: string } | null>(null);

    // Email Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailMode, setIsEmailMode] = useState(false);

    // Verificación de sesión (SIN redirección automática)
    React.useEffect(() => {
        const checkSession = async () => {
            // Esperar que Memberstack cargue (máximo 4 segundos, intentos más agresivos)
            let attempts = 0;
            while (!window.$memberstackDom && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (!window.$memberstackDom) {
                console.log('⚠️ Memberstack no cargó después de esperar. Posible bloqueo o red lenta.');
                setIsCheckingSession(false);
                return;
            }

            try {
                const { data: member } = await window.$memberstackDom.getCurrentMember();

                // Si no hay member o no tiene ID válido, mostrar formulario
                if (!member || !member.id) {
                    console.log('ℹ️ AuthLanding: No hay sesión activa, mostrando formulario de registro');
                    setIsCheckingSession(false);
                    return;
                }

                console.log('✅ Usuario detectado con sesión activa:', member.auth?.email);
                console.log('📝 Memberstack member data:', JSON.stringify({
                    id: member.id,
                    email: member.auth?.email,
                    customFields: member.customFields,
                    hasPostalCode: !!member.customFields?.['postal-code'],
                    postalCodeValue: member.customFields?.['postal-code']
                }, null, 2));

                // Verificar si el usuario ya completó su perfil (tiene postal-code con valor real)
                // Nota: Usamos postal-code porque Google NO lo proporciona, a diferencia de first-name
                const postalCodeValue = member.customFields?.['postal-code'];
                const hasCompletedProfile = !!(postalCodeValue && postalCodeValue.trim() !== '');
                
                console.log(`🔍 Verificación de perfil: hasCompletedProfile=${hasCompletedProfile}, postalCodeValue="${postalCodeValue}"`);
                
                // Si el usuario NO ha completado su perfil, redirigir a completar-perfil
                // Esto pasa cuando se registra con Google por primera vez
                if (!hasCompletedProfile) {
                    console.log('📝 Usuario con sesión pero sin perfil completo, redirigiendo a /registro');
                    window.location.href = '/registro';
                    return;
                }

                try {
                    const res = await fetch('/api/auth/check-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberstackId: member.id })
                    });

                    // Si el API retorna error, la sesión es inválida
                    if (!res.ok) {
                        console.log('❌ Sesión inválida según servidor, limpiando...');
                        try {
                            await window.$memberstackDom.logout();
                        } catch { }
                        setIsCheckingSession(false);
                        return;
                    }

                    const data = await res.json();
                    const redirectUrl = data.role === 'ambassador'
                        ? 'https://www.pataamiga.mx/embajadores/dashboard'
                        : 'https://www.pataamiga.mx/pets/pet-waiting-period';

                    // Guardar info de sesión para mostrar opciones (NO redirigir automáticamente)
                    setExistingSession({
                        email: member.auth?.email || 'Usuario',
                        role: data.role || 'member',
                        redirectUrl
                    });
                    setIsCheckingSession(false);

                } catch (err) {
                    console.error('Error checando rol:', err);
                    setIsCheckingSession(false);
                }
            } catch (e) {
                console.log('❌ Error obteniendo sesión, posiblemente expirada');
                try {
                    await window.$memberstackDom.logout();
                } catch { }
                setIsCheckingSession(false);
            }
        };
        checkSession();
    }, [router]);

    // Función para cerrar sesión y permitir nuevo registro
    const handleLogoutAndRegister = async () => {
        setIsLoading(true);
        try {
            await window.$memberstackDom.logout();
            setExistingSession(null);
            
            // Abrir logout de Google en una ventana emergente para limpiar la sesión de Google
            // Esto permite que al volver a intentar registrar con Google, se muestre el selector de cuentas
            const googleLogoutWindow = window.open('https://accounts.google.com/logout', 'google_logout', 'width=500,height=500');
            
            // Cerrar la ventana de logout después de 2 segundos y recargar
            setTimeout(() => {
                if (googleLogoutWindow && !googleLogoutWindow.closed) {
                    googleLogoutWindow.close();
                }
                window.location.reload();
            }, 2000);
            
        } catch (e) {
            console.error('Error cerrando sesión:', e);
            setIsLoading(false);
        }
    };

    // Nota: Usamos loginWithProvider explícitamente ya que los data-attributes no estaban respondiendo
    // y authenticateWithProvider no existe en esta versión del script.

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            console.log('🔐 Iniciando registro con Google...');
            
            // Intentar forzar el selector de cuentas con prompt
            // Nota: Esto depende de si Memberstack pasa estos parámetros a Google
            await window.$memberstackDom.signupWithProvider({
                provider: 'google',
                options: {
                    prompt: 'select_account consent',
                    access_type: 'offline'
                }
            });
            
            // Trackear registro exitoso con Google
            trackLead({ content_name: 'User Registration - Google', content_category: 'signup' });
            trackCompleteRegistration({ content_name: 'User Registration - Google', content_category: 'signup' });
            
            // Al regresar de Google, la página recarga
            window.location.reload();
        } catch (error) {
            console.error('❌ Signup error:', error);
            setError('Error al iniciar sesión con Google. Intenta de nuevo.');
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
                // Trackear registro exitoso con Email
                trackLead({ content_name: 'User Registration - Email', content_category: 'signup', email: email });
                trackCompleteRegistration({ content_name: 'User Registration - Email', content_category: 'signup', email: email });
                // Éxito, redirigir
                router.push('/registro');
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
                {/* Estado de carga mientras verifica sesión */}
                {isCheckingSession && (
                    <div className={styles.header}>
                        <h1 className={styles.title}>Verificando sesión... 🔄</h1>
                        <p className={styles.subtitle}>Un momento por favor.</p>
                    </div>
                )}

                {/* Si hay sesión existente, mostrar opciones */}
                {!isCheckingSession && existingSession && (
                    <>
                        <div className={styles.header}>
                            <h1 className={styles.title}>¡Hola de nuevo! 👋</h1>
                            <p className={styles.subtitle}>
                                Ya tienes una sesión activa como <strong>{existingSession.email}</strong>
                            </p>
                        </div>

                        <button
                            className={styles.googleButton}
                            onClick={() => window.location.href = existingSession.redirectUrl}
                            disabled={isLoading}
                            type="button"
                        >
                            🐾 Ir a mi Dashboard
                        </button>

                        <div className={styles.divider}>
                            <span>O</span>
                        </div>

                        <button
                            className={styles.emailButton}
                            onClick={handleLogoutAndRegister}
                            disabled={isLoading}
                            type="button"
                        >
                            {isLoading ? 'Cerrando sesión...' : '🔄 Cerrar sesión y registrar otra cuenta'}
                        </button>
                    </>
                )}

                {/* Formulario de registro normal */}
                {!isCheckingSession && !existingSession && (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
}

