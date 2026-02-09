'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AmbassadorForm from '@/components/AmbassadorForm/AmbassadorForm';
import styles from './page.module.css';

interface MemberData {
    id: string;
    email: string;
    firstName: string;
    paternalLastName: string;
    maternalLastName?: string;
    phone?: string;
    customFields?: Record<string, string>;
}

// Componente de carga
function LoadingCard() {
    return (
        <div className={styles.container}>
            <div className={styles.loadingCard}>
                <div className={styles.spinner}></div>
                <p>Verificando tu cuenta...</p>
            </div>
        </div>
    );
}

// Componente principal que usa useSearchParams
function AmbassadorRegistrationContent() {
    const searchParams = useSearchParams();
    const memberIdFromUrl = searchParams.get('memberId');

    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [memberData, setMemberData] = useState<MemberData | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const checkMemberStatus = async () => {
            setIsLoading(true);

            // CASO 1: Viene con memberId desde Webflow
            if (memberIdFromUrl) {
                console.log('🔗 Member ID recibido desde Webflow:', memberIdFromUrl);
                try {
                    const response = await fetch(`/api/memberstack/member?id=${memberIdFromUrl}`);
                    const data = await response.json();

                    console.log('📨 Respuesta de API:', data);

                    if (data.success && data.member) {
                        console.log('✅ Miembro encontrado:', data.member);
                        setMemberData({
                            id: data.member.id,
                            email: data.member.auth?.email || '',
                            firstName: data.member.customFields?.['first-name'] || '',
                            paternalLastName: data.member.customFields?.['paternal-last-name'] || '',
                            maternalLastName: data.member.customFields?.['maternal-last-name'] || '',
                            phone: data.member.customFields?.['phone'] || '',
                            customFields: data.member.customFields
                        });
                        setIsLoggedIn(true);
                        console.log('✅ Datos del miembro cargados desde API');
                    } else {
                        console.log('⚠️ No se encontró el miembro:', data.error, data.details);
                        // setError(`No pudimos cargar tus datos: ${data.error || 'Error desconocido'}`);
                    }
                } catch (err) {
                    console.error('❌ Error cargando datos del miembro:', err);
                    // setError('Error de conexión al cargar tus datos');
                }
                setIsLoading(false);
                return;
            }

            // CASO 2: Verificar sesión de Memberstack en el navegador
            if (typeof window !== 'undefined' && window.$memberstackDom) {
                try {
                    const result = await window.$memberstackDom.getCurrentMember();
                    if (result?.data) {
                        const cf = result.data.customFields || {};
                        setMemberData({
                            id: result.data.id,
                            email: result.data.auth?.email || '',
                            firstName: cf['first-name'] || '',
                            paternalLastName: cf['paternal-last-name'] || '',
                            maternalLastName: cf['maternal-last-name'] || '',
                            phone: cf['phone'] || '',
                            customFields: cf
                        });
                        setIsLoggedIn(true);
                        console.log('✅ Sesión de Memberstack detectada:', result.data.auth?.email);
                    }
                } catch (err) {
                    console.log('ℹ️ No hay sesión de Memberstack activa');
                }
            }

            setIsLoading(false);
        };

        const timer = setTimeout(checkMemberStatus, 500);
        return () => clearTimeout(timer);
    }, [memberIdFromUrl]);

    const handleGoogleSignup = async () => {
        if (window.$memberstackDom) {
            try {
                await window.$memberstackDom.signupWithProvider({ provider: 'google' });
                window.location.reload();
            } catch (err) {
                console.error('Error en signup con Google:', err);
            }
        }
    };

    if (isLoading) {
        return <LoadingCard />;
    }

    // Usuario identificado O usuario que eligió registro por email → Mostrar formulario
    if ((isLoggedIn && memberData) || showForm) {
        return (
            <>
                {isLoggedIn && memberData && (
                    <div className={styles.container} style={{ minHeight: 'auto', padding: '20px 0 0' }}>
                        <div style={{
                            background: 'white',
                            padding: '10px 20px',
                            borderRadius: '50px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.9rem',
                            color: '#666'
                        }}>
                            <span>Hola, <strong>{memberData.firstName || memberData.email}</strong> 👋</span>
                            <span style={{ color: '#ccc' }}>|</span>
                            <button
                                onClick={async () => {
                                    if (window.$memberstackDom) {
                                        await window.$memberstackDom.logout();
                                        window.location.reload();
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#FF0055',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    padding: 0,
                                    textDecoration: 'underline'
                                }}
                            >
                                ¿No eres tú? Cerrar sesión
                            </button>
                        </div>
                    </div>
                )}
                <AmbassadorForm
                    linkedMemberstackId={memberData?.id}
                    preloadedData={memberData ? {
                        firstName: memberData.firstName,
                        paternalLastName: memberData.paternalLastName,
                        maternalLastName: memberData.maternalLastName,
                        email: memberData.email,
                        phone: memberData.phone,
                        customFields: memberData.customFields
                    } : undefined}
                    onSuccess={() => {
                        // Opcional: manejar éxito si es necesario, el form ya muestra modal
                    }}
                />
            </>
        );
    }

    // Usuario NO logueado → Mostrar pantalla de autenticación
    return (
        <div className={styles.container}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <img
                        src="/images/logo-pata-amiga.png"
                        alt="Pata Amiga"
                        className={styles.logo}
                    />
                    <h1 className={styles.title}>Sé Embajador Pata Amiga</h1>
                    <p className={styles.subtitle}>
                        Únete a nuestra manada y gana comisiones por cada familia que ayudes a proteger a sus peludos.
                    </p>
                </div>

                <div className={styles.benefits}>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>💰</span>
                        <span>Gana 10% de comisión por cada referido</span>
                    </div>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>🔗</span>
                        <span>Tu código único para compartir</span>
                    </div>
                    <div className={styles.benefit}>
                        <span className={styles.benefitIcon}>📊</span>
                        <span>Dashboard para ver tus ganancias</span>
                    </div>
                </div>

                <div className={styles.memberInfo}>
                    <p>
                        <strong>¿Ya eres miembro de Club Pata Amiga?</strong><br />
                        <a href="https://www.clubpataamiga.com/mi-cuenta" target="_blank" rel="noopener noreferrer">
                            Inicia sesión en tu cuenta
                        </a> y desde ahí podrás registrarte como embajador con tus datos ya cargados.
                    </p>
                </div>

                <div className={styles.authOptions}>
                    <p className={styles.authLabel}>¿Eres nuevo? Crea tu cuenta:</p>

                    <button
                        type="button"
                        className={styles.googleButton}
                        onClick={handleGoogleSignup}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar con Google
                    </button>

                    <div className={styles.divider}>
                        <span>o</span>
                    </div>

                    <button
                        className={styles.emailButton}
                        onClick={(e) => {
                            e.preventDefault();
                            setShowForm(true);
                        }}
                    >
                        ✉️ Registrarme con Email
                    </button>

                    <p className={styles.loginLink}>
                        ¿Ya tienes cuenta?{' '}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (window.$memberstackDom) {
                                    window.$memberstackDom.openModal("login").then(({ data, type }: any) => {
                                        console.log("Modal closed", data, type);
                                        if (data) {
                                            window.location.reload();
                                        }
                                    });
                                }
                            }}
                        >
                            Inicia sesión
                        </a>
                    </p>
                </div>

                <div className={styles.footer}>
                    <p>Al registrarte, aceptas nuestros <a href="/terminos">Términos y Condiciones</a></p>
                </div>
            </div>
        </div>
    );
}

// Página principal que envuelve el contenido con Suspense
export default function AmbassadorRegistrationPage() {
    return (
        <Suspense fallback={<LoadingCard />}>
            <AmbassadorRegistrationContent />
        </Suspense>
    );
}
