import React, { useState, useEffect, useRef } from 'react';
import BenefitsMarquee from '../BenefitsMarquee';
import styles from './Step1Account.module.css';
import TermsModalEnhanced from '../TermsModalEnhanced';
import { trackLead, trackCompleteRegistration } from '@/components/Analytics/MetaPixel';
import { checkEmailAvailability } from '@/app/actions/user.actions';
import { 
    BadgeCheckIcon, 
    MedicalEmergencyIcon, 
    VaccinationIcon, 
    DeceasedSupportIcon, 
    VetChatIcon,
    CommunityIcon 
} from '../RegistrationIcons';

interface Step1AccountProps {
    data: any;
    onNext: (data: any) => void;
    onBack: () => void;
    member: any;
    showToast: (message: string, type: 'success' | 'error') => void;
    defaultEmail?: string;
    autoLoginMode?: boolean;
}

export default function Step1Account({
    data,
    onNext,
    member,
    showToast,
    defaultEmail,
    autoLoginMode = false
}: Step1AccountProps) {
    const [formData, setFormData] = useState({
        email: defaultEmail || data?.account?.email || '',
        password: '',
        confirmPassword: ''
    });

    const [mode, setMode] = useState<'register' | 'login'>(autoLoginMode ? 'login' : 'register');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        if (member?.auth?.email) {
            setFormData(prev => ({ ...prev, email: member.auth.email }));
        } else if (defaultEmail) {
            setFormData(prev => ({ ...prev, email: defaultEmail }));
        }
    }, [member, defaultEmail]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev: Record<string, string>) => ({ ...prev, [name]: '' }));
        }
    };

    const verifyEmail = async (email: string) => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailAvailable(null);
            return;
        }
        setIsCheckingEmail(true);
        try {
            const result = await checkEmailAvailability(email);
            setEmailAvailable(result.available);
            if (!result.available) {
                setErrors(prev => ({ ...prev, email: 'Este correo ya está registrado' }));
            } else {
                setErrors(prev => { const e = { ...prev }; delete e.email; return e; });
            }
        } catch (error) {
            console.error('Error verificando email:', error);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleEmailBlur = () => {
        if (formData.email && mode === 'register') {
            verifyEmail(formData.email);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            if ((window as any).$memberstackDom) {
                await (window as any).$memberstackDom.logout();
                showToast('Sesión cerrada correctamente', 'success');
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Error cerrando sesión:', error);
            showToast('Error al cerrar sesión', 'error');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const validate = () => {
        if (isLoggedIn) return true;
        const newErrors: any = {};
        if (!formData.email) newErrors.email = 'Email es requerido';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';

        if (!formData.password) {
            newErrors.password = 'Contraseña es requerida';
        } else if (mode === 'register' && formData.password.length < 8) {
            newErrors.password = 'Mínimo 8 caracteres';
        }

        if (mode === 'register' && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        const cleanEmail = formData.email.trim();
        try {
            if (isLoggedIn) {
                onNext({ email: cleanEmail, mode: 'login' });
                return;
            }
            if (mode === 'login') {
                await onNext({
                    email: cleanEmail,
                    password: formData.password,
                    mode: 'login'
                });
            } else {
                // Registro
                await onNext({
                    email: cleanEmail,
                    password: formData.password,
                    mode: 'register'
                });
                trackLead({ content_name: 'User Registration', content_category: 'signup' });
            }
        } catch (error: any) {
            console.error('Error en auth:', error);
            if (error?.message?.includes('already registered') || error?.message?.includes('already taken') || error?.code === 'email-already-in-use') {
                setErrors({ email: 'Este correo ya está registrado. Inicia sesión.' });
                setMode('login');
            } else {
                showToast(error.message || 'Error en la autenticación', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await (window as any).$memberstackDom.authenticateWithProvider({
                provider: 'google'
            });
            trackLead({ content_name: 'User Registration - Google', content_category: 'signup' });
            trackCompleteRegistration({ content_name: 'User Registration - Google', content_category: 'signup' });
        } catch (error: any) {
            showToast('Error con Google Login', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const isLoggedIn = !!member?.auth?.email;
    const benefitsRef = useRef<HTMLDivElement>(null);

    const scrollToBenefits = () => {
        if (benefitsRef.current) {
            benefitsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            <BenefitsMarquee />
            <div className={styles.pageBackground} />
            <div className={styles.container}>
                {/* Top Section: Headline and Price */}
                <div className={styles.headerSection}>
                    <h1 className={styles.headline}>
                        Tu tranquilidad<br />empieza aquí
                    </h1>

                    <div className={styles.priceBox}>
                        <p className={styles.priceText}>
                            Accede a una membresía que respalda hasta 3 mascotas por solo <span className={styles.priceHighlight}>$159/mes</span>.
                        </p>
                    </div>

                    <button 
                        onClick={scrollToBenefits}
                        className={styles.mobileBenefitsLink}
                        aria-label="Ver todos los beneficios"
                    >
                        Descubre todos los beneficios
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                        </svg>
                    </button>
                </div>

                <div className={styles.mainContent}>
                    {/* Left Column: Benefits */}
                    <div className={styles.benefitsSection} ref={benefitsRef}>
                        {/* Badge - Hidden on mobile via CSS */}
                        <div className={styles.badge}>
                            <div className={styles.badgeIcon}>
                                <BadgeCheckIcon />
                            </div>
                            <span className={styles.badgeText}>100% Mexicano | Únete a la manada</span>
                        </div>

                        {/* Benefits Grid */}
                        <div className={styles.benefitsGrid}>
                            {/* Emergencias Médicas */}
                            <div className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>
                                    <MedicalEmergencyIcon />
                                </div>
                                <h2 className={styles.benefitTitle}>emergencias médicas</h2>
                                <p className={styles.benefitDescription}>Hasta $3,000 al año, porque los sustos no avisan y tu peludo no puede esperar.</p>
                            </div>

                            {/* Vacunación Anual */}
                            <div className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>
                                    <VaccinationIcon />
                                </div>
                                <h2 className={styles.benefitTitle}>vacunación anual</h2>
                                <p className={styles.benefitDescription}>Hasta $300 al año, cuidamos la prevención para mantener al día sus vacunas.</p>
                            </div>

                            {/* Apoyo Fallecimiento */}
                            <div className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>
                                    <DeceasedSupportIcon />
                                </div>
                                <h2 className={styles.benefitTitle}>apoyo fallecimiento</h2>
                                <p className={styles.benefitDescription}>Hasta $2,000 al año, cubrimos gastos cuando llega el momento de decir adiós.</p>
                            </div>

                            {/* Chat Veterinario */}
                            <div className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>
                                    <VetChatIcon />
                                </div>
                                <h2 className={styles.benefitTitle}>chat veterinario</h2>
                                <p className={styles.benefitDescription}>Siempre disponible, consejos y apoyo profesional para cuidar mejor a tu lomito.</p>
                            </div>

                            {/* Community Card */}
                            <div className={styles.communityCard}>
                                <div className={styles.communityIcon}>
                                    <CommunityIcon />
                                </div>
                                <div className={styles.communityContent}>
                                    <h2 className={styles.communityTitle}>comunidad pata amiga</h2>
                                    <p className={styles.communityDescription}>Cada 1000 miembros, destinamos parte del fondo para apoyar refugios y rescates en todo México.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                {/* Right Column: Form Column */}
                <div className={styles.formColumn}>
                    <div className={styles.formCard}>
                        {/* Barra superior de progreso técnica */}
                        <div className={styles.topProgressBar} role="progressbar" aria-valuenow={33} aria-valuemin={0} aria-valuemax={100}>
                            <div className={styles.topProgressBarFill} style={{ width: '33.33%' }} />
                        </div>

                        {/* Badge de paso */}
                        <div className={styles.stepBadge}>
                            <img
                                src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695917/logo_pata_amiga_amarillo_i762ow.png"
                                alt="Club Pata Amiga Logo"
                                className={styles.stepBadgeLogo}
                            />
                            <div className={styles.stepBadgeText}>PASO 1 DE 3</div>
                            <div className={styles.stepBadgeIcon} aria-hidden="true" />
                        </div>

                        {/* Header */}
                        <div className={styles.formHeader} key={`header-${mode}`}>
                            <h2 className={styles.formTitle}>
                                {isLoggedIn ? 'SESIÓN ACTIVA' : (mode === 'register' ? 'CREA TU CUENTA' : 'INICIA SESIÓN')}
                            </h2>
                        </div>

                        {/* Banner de sesión activa */}
                        {isLoggedIn && (
                            <div className={styles.loggedInBanner}>
                                <div className={styles.userInfo}>
                                    <div className={styles.userIcon}>👤</div>
                                    <div>
                                        <p className={styles.userLabel}>Has iniciado sesión como:</p>
                                        <p className={styles.userEmail}>{member.auth.email}</p>
                                    </div>
                                </div>
                                <div className={styles.bannerActions}>
                                    <button
                                        type="button"
                                        className={styles.logoutButtonSecondary}
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                    >
                                        {isLoggingOut ? 'CERRANDO...' : 'CERRAR SESIÓN'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className={styles.formBody} key={`form-${mode}`}>
                            {!isLoggedIn && (
                                <>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="email" className={styles.inputLabel}>CORREO ELECTRÓNICO</label>
                                        <div className={styles.inputWrapper}>
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                placeholder="hola@pataamiga.mx"
                                                value={formData.email}
                                                onChange={handleChange}
                                                onBlur={handleEmailBlur}
                                                className={styles.inputField}
                                                disabled={isLoading}
                                                required
                                                autoComplete="email"
                                            />
                                            {isCheckingEmail && (
                                                <span className={styles.inputIndicator}>...</span>
                                            )}
                                            {emailAvailable && formData.email.includes('@') && !isCheckingEmail && !errors.email && mode === 'register' && (
                                                <span className={styles.inputIndicatorSuccess}>✓</span>
                                            )}
                                        </div>
                                        {errors.email && <p className={styles.errorText} role="alert">{errors.email}</p>}
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label htmlFor="password" className={styles.inputLabel}>CONTRASEÑA</label>
                                        <div className={styles.inputWrapper}>
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className={styles.inputField}
                                                disabled={isLoading}
                                                required
                                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                            />
                                            <button
                                                type="button"
                                                className={styles.passwordToggle}
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                                aria-pressed={showPassword}
                                            >
                                                {showPassword ? '👁️‍🗨️' : '👁️'}
                                            </button>
                                        </div>
                                        {errors.password && <p className={styles.errorText} role="alert">{errors.password}</p>}
                                    </div>

                                    {mode === 'register' && (
                                        <div className={styles.inputGroup}>
                                            <label htmlFor="confirmPassword" className={styles.inputLabel}>CONFIRMAR CONTRASEÑA</label>
                                            <div className={styles.inputWrapper}>
                                                <input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    name="confirmPassword"
                                                    placeholder="••••••••"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className={styles.inputField}
                                                    disabled={isLoading}
                                                    required
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.passwordToggle}
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                                                    aria-pressed={showConfirmPassword}
                                                >
                                                    {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                                                </button>
                                            </div>
                                            {errors.confirmPassword && <p className={styles.errorText} role="alert">{errors.confirmPassword}</p>}
                                        </div>
                                    )}
                                </>
                            )}

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isLoading}
                            >
                                {isLoading ? 'PROCESANDO...' : (isLoggedIn ? 'CONTINUAR REGISTRO 🐾' : (mode === 'register' ? 'REGISTRARSE 🐾' : 'ENTRAR 🐾'))}
                            </button>

                            <div className={styles.privacyText}>
                                🔒 Tus datos están protegidos. Al continuar, aceptas nuestros{' '}
                                <button 
                                    type="button"
                                    className={styles.privacyLink} 
                                    onClick={() => setIsTermsOpen(true)}
                                >
                                    Términos y Condiciones y Aviso de Privacidad.
                                </button>
                            </div>

                            {!isLoggedIn && (
                                <div className={styles.separatorSection}>
                                    <div className={styles.separator}>
                                        <div className={styles.separatorLine} />
                                        <div className={styles.separatorText}>O ÚNETE CON</div>
                                        <div className={styles.separatorLine} />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        className={styles.googleButton}
                                        disabled={isLoading}
                                        aria-label="Registrarse con Google"
                                    >
                                        <img
                                            src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695353/2000px-Google_G_Logo.svg__wzddgf.webp"
                                            alt="Google Logo"
                                            className={styles.googleIcon}
                                        />
                                        GOOGLE
                                    </button>

                                    <div className={styles.footerText}>
                                        {mode === 'register' ? (
                                            <>
                                                ¿Ya tienes cuenta?{' '}
                                                <button
                                                    type="button"
                                                    className={styles.footerLink}
                                                    onClick={() => setMode('login')}
                                                >
                                                    Inicia sesión
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                ¿No tienes cuenta?{' '}
                                                <button
                                                    type="button"
                                                    className={styles.footerLink}
                                                    onClick={() => setMode('register')}
                                                >
                                                    Regístrate
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Bottom Image */}
                    <div className={styles.bottomImageWrapper}>
                        <img
                            src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695595/manada-min_uegzj6.webp"
                            alt="Ilustración de la manada Pata Amiga"
                            className={styles.bottomImage}
                        />
                    </div>
                </div>
            </div>

            <TermsModalEnhanced
                    isOpen={isTermsOpen}
                    onClose={() => setIsTermsOpen(false)}
                />
            </div>
        </>
    );
}
