/**
 * Nuevo Flujo de Registro Integrado con Persistencia Completa
 * 
 * Características:
 * - Persistencia en Supabase al navegar entre pasos
 * - Carga de datos guardados al regresar
 * - Integración completa con Memberstack
 * - Modal de términos mejorado
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Componentes de pasos
import Step1Account from './steps/Step1Account';
// Step1AccountRedesign ya no es necesario ya que se integró en Step1Account
import Step2PetBasic from './steps/Step2PetBasic';
import Step3PlanSelection from './steps/Step3PlanSelection';
import Step3_5PaymentSuccess from './steps/Step3_5PaymentSuccess';
import Step4CompleteProfile from './steps/Step4CompleteProfile';
import Step5CompletePet from './steps/Step5CompletePet';
import Step6Success from './steps/Step6Success';
import StepIndicator from './StepIndicator';
import BenefitsBanner from './BenefitsBanner';
import NavbarRedesign from './NavbarRedesign';
import Toast from '@/components/UI/Toast';

// Servicios
import { registerUserInSupabase, getUserDataByMemberstackId } from '@/app/actions/user.actions';
import { trackLead, trackCompleteRegistration, trackEvent } from '@/components/Analytics/MetaPixel';
import { calculateWaitingPeriod } from '@/services/pet.service';

// Tipos
import type { RegistrationProgress } from '@/types/registration.types';

import styles from './NewRegistrationFlow.module.css';

// Pasos del flujo
const STEPS = [
    { id: 1, label: 'Cuenta', component: Step1Account },
    { id: 2, label: 'Mascota', component: Step2PetBasic },
    { id: 3, label: 'Plan', component: Step3PlanSelection },
    { id: 4, label: 'Perfil', component: Step4CompleteProfile },
    { id: 5, label: 'Mascota', component: Step5CompletePet },
];

// Tipo para los datos del registro
interface RegistrationData {
    account?: {
        email: string;
        password?: string;
    };
    petBasic?: Array<{
        petType: 'perro' | 'gato';
        petName: string;
        petAge: number;
        petAgeUnit: 'years' | 'months';
        isAdopted?: boolean;
        isMixed?: boolean;
        waitingPeriodDays?: number;
        waitingPeriodEnd?: string;
    }>;
    planId?: string;
    paymentCompleted?: boolean;
    profile?: any;
    petComplete?: any;
    termsAcceptance?: any;
    referralCode?: string;
}

export default function NewRegistrationFlow() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<number | null>(null); // null mientras carga inicial
    const searchParams = useSearchParams();
    // isRecovery se setea dentro del useEffect usando window.location.search
    // para garantizar compatibilidad con iOS Safari (useSearchParams puede ser vacío antes de hidratación)
    const [isRecovery, setIsRecovery] = useState(false);
    // Email pre-llenado desde URL (?email=) — viene del widget en iOS
    const [urlEmail, setUrlEmail] = useState('');
    const [member, setMember] = useState<any>(null);
    const [registrationData, setRegistrationData] = useState<RegistrationData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPaymentSuccessTransition, setIsPaymentSuccessTransition] = useState(false);
    const [skipPaymentEnabled, setSkipPaymentEnabled] = useState(false);

    // Función para cambiar de paso sincronizando con la URL
    const goToStep = (step: number, replace: boolean = false) => {
        setCurrentStep(step);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('step', step.toString());
            if (replace) {
                window.history.replaceState({ step }, '', url.toString());
            } else {
                window.history.pushState({ step }, '', url.toString());
            }
        }
    };

    /**
     * Maneja la redirección de miembros que ya tienen un plan pagado
     */
    const handlePaidMemberRedirect = () => {
        console.log('💰 Redirigiendo a miembro pagado...');
        setIsRedirecting(true);
        setTimeout(() => {
            // Verificamos si aún estamos redirigiendo (por si el usuario canceló dándole a logout)
            if (document.getElementById('redirect-screen')) {
                window.location.href = 'https://www.pataamiga.mx/user/inicio-de-sesion';
            }
        }, 4500); // Un poco más de tiempo para que alcancen a ver el botón de logout si quieren
    };

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning'; isVisible: boolean }>({ message: '', type: 'error', isVisible: false });

    // Cargar estado guardado al montar
    useEffect(() => {
        const loadSavedState = async () => {
            try {
                // ────────────────────────────────────────────────────────────
                // 🔮 MAGIC TOKEN: Validar ANTES de esperar Memberstack.
                // El widget pasa ?mt=TOKEN cuando el usuario tiene sesión en
                // Webflow. Si el token es válido, tenemos los datos del member
                // listos para pre-cargar el flujo sin fricción.
                // ────────────────────────────────────────────────────────────
                const nativeParams = new URLSearchParams(window.location.search);
                const magicToken = nativeParams.get('mt');
                let magicData: {
                    memberstackId: string;
                    email: string;
                    customFields: Record<string, any>;
                    intent: string;
                } | null = null;

                if (magicToken) {
                    try {
                        console.log('🔮 Magic token detectado, validando...');
                        const tokenRes = await fetch(
                            `/api/auth/magic-token?token=${encodeURIComponent(magicToken)}`
                        );
                        const tokenJson = await tokenRes.json();
                        if (tokenJson.success) {
                            magicData = tokenJson;
                            console.log('✅ Magic token válido para:', tokenJson.email);
                            // Limpiar ?mt= de la URL (single-use, previene reutilización con "Atrás")
                            const cleanUrl = new URL(window.location.href);
                            cleanUrl.searchParams.delete('mt');
                            window.history.replaceState({}, '', cleanUrl.toString());
                        } else {
                            console.warn('⚠️ Magic token inválido o expirado:', tokenJson.error);
                        }
                    } catch (e) {
                        console.warn('⚠️ Error al validar magic token (no bloqueante):', e);
                    }
                }
                // ────────────────────────────────────────────────────────────

                if (!window.$memberstackDom) {
                    // Esperar a que Memberstack cargue
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                if (window.$memberstackDom) {
                    console.log('🔍 Inicializando Memberstack...');
                    const { data: currentMember } = await window.$memberstackDom.getCurrentMember();

                    if (currentMember) {
                        // 💰 REDIRECCIÓN PARA MIEMBROS YA PAGADOS
                        // Si el usuario ya tiene un plan activo y NO viene de un éxito de pago reciente,
                        // lo mandamos al inicio de sesión oficial para evitar errores en el flujo de registro.
                        const activePlans = currentMember.planConnections?.filter((pc: any) => 
                            pc.status?.toLowerCase() === 'active' || pc.status?.toLowerCase() === 'trialing'
                        ) || [];
                        
                        const hasActivePlan = activePlans.length > 0;
                        const isPaymentSuccess = searchParams.get('payment') === 'success';
                        
                        console.log('🔍 [loadSavedState] Miembro logueado:', { 
                            email: currentMember.auth?.email, 
                            hasActivePlan, 
                            plans: activePlans.map((p: any) => ({ id: p.planId, status: p.status })),
                            isPaymentSuccess 
                        });

                        if (hasActivePlan && !isPaymentSuccess) {
                            console.log('🔍 [loadSavedState] Miembro con plan activo detectado, redirigiendo...');
                            handlePaidMemberRedirect();
                            return;
                        }

                        setMember(currentMember);
                        const msId = currentMember.id || (currentMember as any).memberId;
                        console.log('📥 Cargando datos desde Supabase para ID:', msId);
                        const result = await getUserDataByMemberstackId(msId);

                        let userData: any = null;
                        let loadedData: RegistrationData = {
                            account: {
                                email: currentMember.auth?.email,
                            }
                        };

                        if (result.success && result.userData) {
                            userData = result.userData;
                            console.log('✅ Datos de usuario encontrados en DB');

                            // Reconstruir datos del registro desde Supabase
                            loadedData = {
                                account: {
                                    email: currentMember.auth?.email || userData.email,
                                },
                                // Intentar cargar petBasic desde DB, fallback a Memberstack custom fields
                                petBasic: (() => {
                                    const pets: any[] = [];
                                    const cf = currentMember.customFields || {};

                                    for (let i = 1; i <= 3; i++) {
                                        const name = cf[`pet-${i}-name`];
                                        if (name) {
                                            pets.push({
                                                petName: name,
                                                petType: (cf[`pet-${i}-type`] || 'perro') as 'perro' | 'gato',
                                                petAge: Number(cf[`pet-${i}-age`] || 0),
                                                petAgeUnit: (cf[`pet-${i}-age-unit`] || 'years') as 'years' | 'months'
                                            });
                                        }
                                    }

                                    if (pets.length === 0) {
                                        const dbPetName = userData?.pet_name || userData?.petName;
                                        const msPetName = cf['pet-name'];
                                        const petName = dbPetName || msPetName;
                                        if (petName) {
                                            pets.push({
                                                petType: (userData?.pet_type || userData?.petType || cf['pet-type'] || 'perro') as 'perro' | 'gato',
                                                petName: petName,
                                                petAge: Number(userData?.pet_age || userData?.petAge || cf['pet-age'] || 0),
                                                petAgeUnit: (userData?.pet_age_unit || userData?.petAgeUnit || cf['pet-age-unit'] || 'years') as 'years' | 'months',
                                            });
                                        }
                                    }

                                    return pets.length > 0 ? pets : undefined;
                                })(),
                                profile: userData.first_name ? {
                                    firstName: userData.first_name,
                                    paternalLastName: userData.last_name,
                                    maternalLastName: userData.mother_last_name,
                                    birthDate: userData.birth_date,
                                    nationality: userData.nationality,
                                    nationalityCode: userData.nationality_code,
                                    phone: userData.phone,
                                    email: userData.email,
                                    curp: userData.curp,
                                    postalCode: userData.postal_code,
                                    state: userData.state,
                                    city: userData.city,
                                    colony: userData.colony,
                                    address: userData.address,
                                    ine_front_url: userData.ine_front_url,
                                } : (currentMember.customFields?.['first-name'] ? {
                                    firstName: currentMember.customFields['first-name'],
                                    paternalLastName: currentMember.customFields['last-name'] || '',
                                    email: currentMember.auth?.email,
                                } : undefined),
                            };
                        } else if (result.success && !result.userData) {
                            // Usuario nuevo logueado con social (Google/FB)
                            console.log('🆕 Usuario social nuevo, sincronizando con Supabase...');

                            // Pre-llenar datos de perfil desde Memberstack (social auth)
                            if (currentMember.customFields?.['first-name']) {
                                loadedData.profile = {
                                    firstName: currentMember.customFields['first-name'],
                                    paternalLastName: currentMember.customFields['last-name'] || '',
                                    email: currentMember.auth?.email,
                                };
                            }

                            await registerUserInSupabase({
                                email: currentMember.auth?.email,
                                registration_step: 1,
                                membership_status: 'pending'
                            }, msId);
                        }

                        // Si petBasic no se recuperó de DB/MS, intentar desde localStorage
                        if (!loadedData.petBasic) {
                            try {
                                const backup = localStorage.getItem('petBasicBackup');
                                if (backup) {
                                    const parsedBackup = JSON.parse(backup);
                                    loadedData.petBasic = Array.isArray(parsedBackup) ? parsedBackup : [parsedBackup];
                                    console.log('💾 [loadSavedState] petBasic recuperado de localStorage:', loadedData.petBasic.length, 'mascotas');
                                }
                            } catch (e) { /* localStorage no disponible */ }
                        }

                        setRegistrationData(loadedData);

                        // Verificar estado de registro (Comparar Memberstack vs Supabase)
                        const msStep = Number(currentMember.customFields?.['registration-step'] || 1);
                        const dbStep = Number(userData?.registration_step || 1);
                        const urlStep = parseInt(searchParams.get('step') || '0', 10);
                        let finalStep = Math.max(msStep, dbStep);

                        // Si ya tiene sesión activa (ya tiene cuenta), saltamos directo al paso 2 mínimo
                        if (finalStep <= 1) {
                            finalStep = 2;
                        }

                        // Si la URL especifica un paso, lo respetamos siempre que no sea superior al progreso real
                        // o si es una recuperación de pago
                        if (urlStep > 0 && urlStep <= 5) {
                            finalStep = urlStep;
                        }

                        // Caso especial: Recuperación de pago (desde email o Stripe back)
                        const paymentStatus = currentMember.customFields?.['payment-status'];
                        // isPaymentSuccess ya está definido arriba
                        const isCheckoutPending = currentMember.customFields?.['checkout-pending'] === 'true' || currentMember.customFields?.['checkout-pending'] === true;

                        // 🍎 iOS FIX: useSearchParams() puede ser vacío en iOS Safari (pre-hidratación).
                        // Leemos 'reason' directamente desde window.location.search para garantizar
                        // que el parámetro sea detectado en TODOS los navegadores (incluyendo iOS Safari).
                        const nativeParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
                        const isRecoveryFlag = nativeParams.get('reason') === 'complete_payment';
                        setIsRecovery(isRecoveryFlag);

                        console.log('💳 Verificación de pago:', { paymentStatus, isPaymentSuccess, isCheckoutPending, isRecovery: isRecoveryFlag, finalStep, msStep, dbStep });

                        // Si el pago está pendiente de checkout, forzamos que no baje del paso 3
                        if (isCheckoutPending && finalStep < 3 && paymentStatus !== 'completed') {
                            console.log('🕒 Checkout pendiente detectado, manteniendo en paso 3');
                            finalStep = 3;
                        }

                        // Si viene del widget con reason=complete_payment (cualquier navegador),
                        // forzar paso 3 aunque el progreso guardado sea menor.
                        if (isRecoveryFlag && finalStep < 3) {
                            console.log('🔁 Recovery detectado (reason=complete_payment), forzando paso 3');
                            finalStep = 3;
                        }

                        // 🍎 iOS EXTRA: Si el usuario no ha pagado y su step guardado es <= 2,
                        // pero viene de complete_payment O checkout-pending es true → paso 3.
                        // Esto cubre el caso donde isRecovery falló por el bug de iOS.
                        if (finalStep <= 2 && paymentStatus !== 'completed' &&
                            (isCheckoutPending || isRecoveryFlag)) {
                            console.log('🍎 iOS fallback: forcing step 3 via checkout-pending/isRecovery guard');
                            finalStep = 3;
                        }

                        // Si hay éxito en el pago (por URL o por Memberstack), forzar paso 4
                        if ((isPaymentSuccess || paymentStatus === 'completed') && finalStep < 4) {
                            console.log('💰 Pago detectado, avanzando al paso 4');
                            finalStep = 4;

                            // Si venimos específicamente de la URL de éxito, activamos la animación de confeti/éxito
                            if (isPaymentSuccess) {
                                setIsPaymentSuccessTransition(true);
                            }

                            // Sincronización preventiva: si la URL dice éxito pero Memberstack no, actualizamos Memberstack
                            if (isPaymentSuccess && paymentStatus !== 'completed') {
                                console.log('🔄 Sincronizando estado de pago (URL success -> MS/DB)');
                                window.$memberstackDom.updateMember({
                                    customFields: {
                                        'payment-status': 'completed',
                                        'registration-step': 4,
                                        'checkout-pending': false
                                    }
                                });
                                saveProgress(4, loadedData);
                            }
                        }

                        console.log(`📊 Progreso final: MS(${msStep}), DB(${dbStep}), URL(${urlStep}), Pending(${isCheckoutPending}) -> Paso Actual(${finalStep})`);
                        goToStep(finalStep, true); // replaceState para el paso inicial
                    } else {
                        // 👤 No hay sesión activa en Memberstack.
                        // 🔎 PRIORIDAD: magic token > URL params > fallback plano
                        if (magicData) {
                            // 🔮 Magic token válido: datos del member pre-cargados desde el servidor
                            setUrlEmail(magicData.email);
                            sessionStorage.setItem('pata_login_intent', magicData.intent || 'complete_payment');
                            console.log('🔮 Magic token: email pre-llenado, activando modo login ->', magicData.email);
                        } else {
                            // 🍎 iOS ITP fallback: leer desde URL params
                            const reason = nativeParams.get('reason');
                            const emailFromUrl = nativeParams.get('email') || '';
                            if (reason) {
                                sessionStorage.setItem('pata_login_intent', reason);
                                console.log('🍎 iOS: intent guardado en sessionStorage:', reason);
                            }
                            if (emailFromUrl) {
                                setUrlEmail(emailFromUrl);
                                console.log('🍎 iOS: email pre-llenado desde URL:', emailFromUrl);
                            }
                        }
                        console.log('👤 No hay sesión activa de Memberstack, iniciando en paso 1');
                        goToStep(1, true);
                    }
                } else {
                    console.warn('⚠️ Memberstack no se cargó correctamente, iniciando en paso 1');
                    goToStep(1, true);
                }
            } catch (error) {
                console.error('Error loading saved state:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/admin/settings/skip-payment');
                const data = await response.json();
                setSkipPaymentEnabled(data.enabled);
            } catch (error) {
                console.error('Error fetching skip-payment setting:', error);
            }
        };

        loadSavedState();
        fetchSettings();
    }, []);

    const handleLogout = async () => {
        try {
            if (window.$memberstackDom) {
                console.log('🚪 Cerrando sesión...');
                await window.$memberstackDom.logout();
                // Limpiar cualquier backup local si existe
                localStorage.removeItem('petBasicBackup');
                showToast('Sesión cerrada correctamente', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } catch (error) {
            console.error('❌ Error logging out:', error);
            window.location.reload();
        }
    };

    // Escuchar cambios en el historial (botón atrás/adelante del navegador)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state && typeof event.state.step === 'number') {
                setCurrentStep(event.state.step);
            } else {
                // Fallback: leer de la URL
                const params = new URLSearchParams(window.location.search);
                const step = parseInt(params.get('step') || '', 10);
                if (!isNaN(step)) {
                    setCurrentStep(step);
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setToast({ message, type, isVisible: true });
    };

    // Guardar progreso en Supabase
    const saveProgress = useCallback(async (step: number, data: any) => {
        const memberId = member?.id || member?.memberId;
        if (!memberId) {
            console.warn(`⚠️ [saveProgress] member es null, no se puede guardar step ${step}. Datos NO guardados en Supabase.`);
            return;
        }

        setIsSaving(true);
        try {
            // Mapear datos al formato de Supabase (Source of Truth)
            const userData: any = {
                email: data.account?.email || member.auth?.email,
                registration_step: step,
            };

            // Agregar datos de mascota (básicos) - Solo la primera para la tabla users principal
            if (data.petBasic && data.petBasic.length > 0) {
                const firstPet = data.petBasic[0];
                userData.pet_type = firstPet.petType;
                userData.pet_name = firstPet.petName;
                userData.pet_age = firstPet.petAge;
                userData.pet_age_unit = firstPet.petAgeUnit;
            }

            // Agregar datos de perfil
            if (data.profile) {
                // Sincronizar nombres con lo que espera la base de datos y la acción
                userData.firstName = data.profile.firstName;
                userData.paternalLastName = data.profile.paternalLastName;
                userData.maternalLastName = data.profile.maternalLastName;
                userData.birthDate = data.profile.birthDate;
                userData.nationality = data.profile.nationality;
                userData.nationalityCode = data.profile.nationalityCode;
                userData.phone = data.profile.phone;
                userData.curp = data.profile.curp;
                userData.postalCode = data.profile.postalCode;
                userData.state = data.profile.state;
                userData.city = data.profile.city;
                userData.colony = data.profile.colony;
                userData.address = data.profile.address;
                userData.ine_front_url = data.profile.ine_front_url;
            }

            // Agregar datos de aceptación de términos
            if (data.termsAcceptance) {
                userData.termsAcceptedAt = data.termsAcceptance.timestamp || new Date().toISOString();
                userData.termsVersion = '1.0';
            }

            console.log('📝 [saveProgress] Datos que se enviarán:', {
                step,
                hasProfile: !!data.profile,
                hasPetBasic: !!data.petBasic && data.petBasic.length > 0,
                petBasicCount: data.petBasic?.length || 0,
                profileFirstName: data.profile?.firstName,
                profileCurp: data.profile?.curp,
                petBasicName: data.petBasic?.[0]?.petName,
                userDataKeys: Object.keys(userData).filter(k => userData[k] !== undefined && userData[k] !== null)
            });

            await registerUserInSupabase(userData, memberId);
            console.log('✅ Progreso guardado en Supabase (Source of Truth)', { step, memberId });
        } catch (error) {
            console.error('Error guardando progreso:', error);
        } finally {
            setIsSaving(false);
        }
    }, [member]);

    // ===== HANDLERS DE PASOS =====

    // Paso 1: Crear cuenta en Memberstack (o hacer login si el email ya existe)
    const handleStep1Complete = async (data: { email: string; password: string; mode?: 'register' | 'login' }) => {
        setIsLoading(true);
        try {
            // 🍎 Leer intent guardado en sessionStorage (por iOS ITP o magic token)
            const savedIntent = typeof sessionStorage !== 'undefined'
                ? sessionStorage.getItem('pata_login_intent')
                : null;
            const hasRecoveryIntent = savedIntent === 'complete_payment';

            // Si ya hay usuario logueado con ese email, simplemente avanzar
            if (member && member.auth?.email === data.email) {
                console.log('🔄 Usuario ya logueado, reanudando registro...');

                // Si hay intent de recuperación de pago, ir al paso 3
                const targetStep = hasRecoveryIntent ? 3 : ((currentStep && currentStep > 1) ? currentStep : 2);
                if (hasRecoveryIntent) {
                    sessionStorage.removeItem('pata_login_intent');
                    console.log('🍎 iOS: intent recuperado, enviando al paso 3');
                }

                // Asegurarnos de que el paso esté sincronizado
                await registerUserInSupabase({
                    email: data.email,
                    registration_step: targetStep
                }, member.id);

                goToStep(targetStep);
                setIsLoading(false);
                return;
            }

            // 🔮 MODO LOGIN DIRECTO — viene del magic token fallback o del toggle de login.
            // Saltamos el signup para ir directo al login y evitar el error innecesario.
            if (data.mode === 'login') {
                console.log('🔑 Modo login directo (magic token / toggle)...');
                const loginResult = await window.$memberstackDom.loginMemberEmailPassword({
                    email: data.email,
                    password: data.password,
                });

                if (loginResult.data) {
                    const loggedMember = loginResult.data;
                    setMember(loggedMember);
                    const msId = loggedMember.id || (loggedMember as any).memberId;

                    const msStep = Number(loggedMember.customFields?.['registration-step'] || 1);
                    const paymentStatus = loggedMember.customFields?.['payment-status'];
                    const isCheckoutPending = loggedMember.customFields?.['checkout-pending'] === 'true' ||
                        loggedMember.customFields?.['checkout-pending'] === true;

                    let loginTargetStep = Math.max(msStep, 2);
                    
                    // 💰 REDIRECCIÓN PARA MIEMBROS YA PAGADOS (Login Manual)
                    // Forzamos un refresco para obtener planes actualizados
                    const { data: freshMember } = await window.$memberstackDom.getCurrentMember();
                    const memberToVerify = freshMember || loggedMember;
                    
                    const activePlansLogin = memberToVerify.planConnections?.filter((pc: any) => 
                        pc.status?.toLowerCase() === 'active' || pc.status?.toLowerCase() === 'trialing'
                    ) || [];
                    
                    const hasActivePlanIds = (memberToVerify.planIds || []).length > 0;
                    const paymentStatusField = memberToVerify.customFields?.['payment-status'];
                    const hasActivePlan = activePlansLogin.length > 0 || hasActivePlanIds || paymentStatusField === 'completed';
                    
                    console.log('🔍 [handleStep1Complete] Verificación de pago:', { 
                        email: memberToVerify.auth?.email, 
                        hasActivePlan,
                        plans: activePlansLogin.map((p: any) => ({ id: p.planId, status: p.status })),
                        planIds: memberToVerify.planIds,
                        paymentStatusField
                    });

                    if (hasActivePlan) {
                        handlePaidMemberRedirect();
                        return;
                    }

                    if (hasRecoveryIntent || isCheckoutPending) {
                        if (paymentStatus !== 'completed') loginTargetStep = 3;
                    }
                    if (paymentStatus === 'completed' && loginTargetStep < 4) loginTargetStep = 4;

                    if (hasRecoveryIntent) sessionStorage.removeItem('pata_login_intent');

                    console.log(`✅ Login directo exitoso. Paso final: ${loginTargetStep}`);

                    // Sync Supabase para mantener consistencia
                    await registerUserInSupabase({ email: data.email, registration_step: loginTargetStep }, msId);

                    goToStep(loginTargetStep, true);
                    showToast('¡Hola de nuevo! 👋', 'success');
                    return;
                }

                throw new Error('Login fallido: no se recibieron datos del member');
            }

            // Crear usuario en Memberstack
            const result = await window.$memberstackDom.signupMemberEmailPassword({
                email: data.email,
                password: data.password,
                customFields: {
                    'registration-step': 2,
                    'pre-payment-completed': false,
                    'payment-status': 'pending',
                },
            });

            // Tracking Pixel
            trackLead({ content_name: 'User Registration - Email', content_category: 'signup', email: data.email });
            trackCompleteRegistration({ content_name: 'User Registration - Email', content_category: 'signup', email: data.email });

            if (!result.data) {
                throw new Error('Error creando cuenta');
            }

            // Intentar extraer el ID de todas las formas posibles que usa Memberstack en diferentes versiones/wrappers
            // Extracción robusta del ID
            const signupData = result.data;
            let msId =
                signupData?.id ||
                signupData?.memberId ||
                signupData?.member?.id ||
                result?.id ||
                result?.member?.id;

            console.log('🔍 Memberstack Signup Response:', {
                success: !!signupData,
                extractedId: msId,
                rawResponse: result
            });

            // Si no hay ID en la respuesta, intentar recuperarlo de la sesión actual (Memberstack suele loguear auto)
            if (!msId && typeof window !== 'undefined' && window.$memberstackDom) {
                console.warn('⚠️ ID no encontrado en respuesta, consultando sesión actual...');
                try {
                    const session = await window.$memberstackDom.getCurrentMember();
                    msId = session?.data?.id;
                    if (msId) console.log('✅ ID recuperado de la sesión:', msId);
                } catch (e) {
                    console.error('❌ Error recuperando sesión:', e);
                }
            }

            if (!msId) {
                console.error('❌ Error crítico: Memberstack no devolvió ID y no hay sesión activa.', result);
                throw new Error('No se pudo establecer el ID de usuario. Por favor, intenta recargar la página.');
            }

            setMember(signupData || { id: msId });

            // Guardar en Supabase (estado inicial)
            // IMPORTANTE: Ahora el servidor se encarga de todo, enviamos el ID correcto
            const supabaseResult = await registerUserInSupabase(
                {
                    email: data.email,
                    registration_step: 2,
                    membership_status: 'pending'
                },
                msId
            );

            if (!supabaseResult.success) {
                console.warn('⚠️ Supabase sync warning:', supabaseResult.error);
                // Si es un error de notificación_preferences, es un bug de DB que no debería bloquear el flujo UI
            }

            // Sincronizar con CRM Lynsales - Paso 1
            const { syncCRMAction } = await import('@/app/actions/user.actions');
            syncCRMAction(msId, 'step1', { email: data.email }).catch(err =>
                console.error('⚠️ Error sincronizando con CRM (No crítico):', err)
            );

            // 🍎 Intent de recuperación de pago: ir al paso 3 en lugar del 2
            const finalTargetStep = hasRecoveryIntent ? 3 : 2;
            if (hasRecoveryIntent) {
                sessionStorage.removeItem('pata_login_intent');
                console.log('🍎 iOS: intent recuperado post-signup, enviando al paso 3');
            }

            setRegistrationData(prev => ({ ...prev, account: data }));
            goToStep(finalTargetStep);
            showToast('¡Cuenta creada!', 'success');

        } catch (error: any) {
            console.error('❌ Error en Step 1:', error);

            // Caso especial: El correo ya existe → intentar LOGIN directamente
            const errorMsg = error.message || '';
            if (errorMsg.includes('already taken') ||
                errorMsg.includes('already exists') ||
                error?.code === 'email-already-in-use') {

                // 🍎 Intentar login con las credenciales proporcionadas
                console.log('🔑 Email ya existe, intentando login con credenciales...');
                try {
                    const loginResult = await window.$memberstackDom.loginMemberEmailPassword({
                        email: data.email,
                        password: data.password,
                    });

                    if (loginResult.data) {
                        const loggedMember = loginResult.data;
                        setMember(loggedMember);
                        const msId = loggedMember.id || (loggedMember as any).memberId;

                        // 🍎 Leer intent guardado + campos de Memberstack para determinar paso
                        const savedIntent2 = typeof sessionStorage !== 'undefined'
                            ? sessionStorage.getItem('pata_login_intent')
                            : null;
                        const hasRecoveryIntent2 = savedIntent2 === 'complete_payment';

                        const msStep = Number(loggedMember.customFields?.['registration-step'] || 1);
                        const paymentStatus = loggedMember.customFields?.['payment-status'];
                        const isCheckoutPending = loggedMember.customFields?.['checkout-pending'] === 'true' ||
                            loggedMember.customFields?.['checkout-pending'] === true;

                        let loginTargetStep = Math.max(msStep, 2);

                        // 💰 REDIRECCIÓN PARA MIEMBROS YA PAGADOS (Login Manual - Email existente)
                        // Forzamos un refresco para obtener planes actualizados
                        const { data: freshMember2 } = await window.$memberstackDom.getCurrentMember();
                        const memberToVerify2 = freshMember2 || loggedMember;

                        const activePlansRecovery = memberToVerify2.planConnections?.filter((pc: any) => 
                            pc.status?.toLowerCase() === 'active' || pc.status?.toLowerCase() === 'trialing'
                        ) || [];
                        
                        const hasActivePlanIds2 = (memberToVerify2.planIds || []).length > 0;
                        const paymentStatusField2 = memberToVerify2.customFields?.['payment-status'];
                        const hasActivePlan = activePlansRecovery.length > 0 || hasActivePlanIds2 || paymentStatusField2 === 'completed';

                        console.log('🔍 [handleStep1Complete - Recovery] Verificación de pago:', { 
                            email: memberToVerify2.auth?.email, 
                            hasActivePlan,
                            plans: activePlansRecovery.map((p: any) => ({ id: p.planId, status: p.status })),
                            planIds: memberToVerify2.planIds,
                            paymentStatusField2
                        });

                        if (hasActivePlan) {
                            handlePaidMemberRedirect();
                            return;
                        }

                        if (hasRecoveryIntent2 || isCheckoutPending) {
                            if (paymentStatus !== 'completed') {
                                loginTargetStep = 3;
                            }
                        }
                        if (paymentStatus === 'completed' && loginTargetStep < 4) {
                            loginTargetStep = 4;
                        }

                        if (hasRecoveryIntent2) {
                            sessionStorage.removeItem('pata_login_intent');
                        }

                        console.log(`🔑 Login exitoso. Intent: ${hasRecoveryIntent2}, paso final: ${loginTargetStep}`);
                        goToStep(loginTargetStep, true);
                        showToast('¡Sesión iniciada!', 'success');
                        return;
                    }
                } catch (loginError: any) {
                    console.error('❌ Error en login:', loginError);
                    // Si el login falla (contraseña incorrecta), mostrar error en el UI
                    throw loginError;
                }

                // Si el login también falló de alguna forma sin lanzar excepción
                throw error;
            } else {
                showToast(errorMsg || 'Error al crear cuenta', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep2Complete = async (pets: Array<{ petType: 'perro' | 'gato'; petName: string; petAge: number; petAgeUnit: 'years' | 'months' }>) => {
        const newData = { ...registrationData, petBasic: pets };
        setRegistrationData(newData);

        // Backup inmediato en localStorage (sobrevive redirect de Stripe)
        try {
            localStorage.setItem('petBasicBackup', JSON.stringify(pets));
            console.log('💾 [Step2] petBasic guardado en localStorage:', pets.length, 'mascotas');
        } catch (e) { /* localStorage no disponible */ }

        // Guardar en Supabase - Siguiente paso es el 3
        await saveProgress(3, newData);

        // Actualizar Memberstack (incluir datos de mascota como backup para sobrevivir el redirect de Stripe)
        if (member && window.$memberstackDom) {
            const customFields: Record<string, any> = {
                'registration-step': 3,
                'total-pets': String(pets.length)
            };

            // Mapear cada mascota a sus campos indexados
            pets.forEach((pet, index) => {
                const i = index + 1;
                customFields[`pet-${i}-name`] = pet.petName;
                customFields[`pet-${i}-type`] = pet.petType;
                customFields[`pet-${i}-age`] = String(pet.petAge);
                // Si es la primera, también llenar los campos legacy por si acaso
                if (index === 0) {
                    customFields['pet-name'] = pet.petName;
                    customFields['pet-type'] = pet.petType;
                    customFields['pet-age'] = String(pet.petAge);
                    customFields['pet-age-unit'] = pet.petAgeUnit;
                }
            });

            const { data: updatedMember } = await window.$memberstackDom.updateMember({
                customFields
            });
            if (updatedMember) setMember(updatedMember);
        }

        goToStep(3);
    };

        // Paso 3: Seleccionar plan y proceder a pago
    const handleStep3Complete = async (planId: string, termsAcceptance?: any, referralCode?: string) => {
        let updatedPetBasic = registrationData.petBasic;

        // Si hay código de referido, recalcular carencia de todas las mascotas
        if (referralCode && registrationData.petBasic && Array.isArray(registrationData.petBasic)) {
            updatedPetBasic = registrationData.petBasic.map((pet, index) => {
                const calculation = calculateWaitingPeriod(
                    index === 0, // isOriginal solo para la primera
                    !!pet.isAdopted,
                    !!pet.isMixed,
                    true // hasReferralCode
                );
                
                return {
                    ...pet,
                    waitingPeriodDays: calculation.days,
                    waitingPeriodEnd: calculation.endDate
                };
            });

            console.log('🎁 Beneficio de Embajador aplicado a todas las mascotas:', referralCode);
        }

        const newData = { 
            ...registrationData, 
            planId, 
            termsAcceptance, 
            referralCode,
            petBasic: updatedPetBasic
        };
        setRegistrationData(newData);

        // Ya no guardamos el progreso al paso 4 aquí, 
        // lo haremos SOLO si el pago es exitoso para evitar bypass

        // Iniciar checkout de Stripe
        try {
            console.log('💳 [handleStep3Complete] Iniciando checkout de Stripe...');
            
            // 🔥 Marcamos checkout como pendiente para asegurar que si regresa se mantenga en paso 3
            if (member && window.$memberstackDom) {
                await window.$memberstackDom.updateMember({
                    customFields: {
                        'checkout-pending': true,
                        'registration-step': 3
                    }
                });
            }

            const result = await window.$memberstackDom.purchasePlansWithCheckout({
                priceId: planId,
                successUrl: window.location.origin + '/payment-success',
                cancelUrl: window.location.href,
                allow_promotion_codes: false,
                allowPromotionCodes: false
            });

            if (result) {
                // 🔥 NUEVO: Verificación robusta de planes tras el checkout
                // Esto previene falsos positivos si el modal se cierra sin pagar
                const { data: memberData } = await window.$memberstackDom.getCurrentMember();
                const planConnections = memberData?.planConnections || [];
                const hasActivePlan = planConnections.some((p: any) => 
                    (p.planId === planId || p.priceId === planId) && 
                    (p.status?.toUpperCase() === 'ACTIVE' || p.status?.toLowerCase() === 'trialing')
                );

                if (!hasActivePlan) {
                    console.warn('⚠️ [Checkout] El usuario cerró el checkout o no completó el pago.');
                    setIsLoading(false);
                    return; // Detenemos el flujo si no hay plan activo
                }

                // Pago realmente exitoso y verificado
                const completedData = { ...newData, paymentCompleted: true };
                setRegistrationData(completedData);

                const { data: updatedMember } = await window.$memberstackDom.updateMember({
                    customFields: {
                        'payment-status': 'completed',
                        'registration-step': 4,
                        'approval-status': 'pending',
                        'ambassador-code': referralCode || '',
                        'checkout-pending': false
                    },
                });
                if (updatedMember) setMember(updatedMember);

                // Notificar a CRM de pago exitoso para remover carrito abandonado
                try {
                    const memberId = member?.id || member?.memberId;
                    if (memberId) {
                        const { notifyCheckoutCompletedToCRM } = await import('@/app/actions/user.actions');
                        notifyCheckoutCompletedToCRM(memberId).catch(err => {
                            console.error('⚠️ [CRM] Error al notificar pago exitoso:', err);
                        });
                    }
                } catch (e) {
                    console.warn('⚠️ No se pudo notificar éxito de pago al CRM', e);
                }

                // Tracking Pixel - Purchase
                const plan = planId.includes('anual') ? 'Anual' : 'Mensual';
                const price = plan === 'Anual' ? 1699 : 159;
                trackEvent('Purchase', { 
                    value: price, 
                    currency: 'MXN',
                    content_name: `Plan ${plan}`,
                    content_category: 'subscription'
                });

                // Guardar progreso del pago en Supabase
                await saveProgress(4, completedData);
                goToStep(4);
                setIsPaymentSuccessTransition(true);
            }
        } catch (error: any) {
            console.error('Error en checkout:', error);
            // Ignorar el "Network Error" que lanza Memberstack cuando la página se descarga para ir a Stripe
            if (error.message !== 'Network Error') {
                showToast(error.message || 'Error al procesar el pago', 'error');
            }
        }
    };

    const handleSkipPayment = async (planId: string, termsAcceptance?: any) => {
        setIsSaving(true);
        try {
            const newData = { ...registrationData, planId, termsAcceptance, paymentCompleted: true };
            setRegistrationData(newData);

            // Guardar en Supabase
            await saveProgress(4, newData);

            // Actualizar Memberstack
            if (member && window.$memberstackDom) {
                const { data: updatedMember } = await window.$memberstackDom.updateMember({
                    customFields: {
                        'registration-step': 4,
                        'selected-plan-id': planId,
                        'payment-status': 'completed',
                        'approval-status': 'pending'
                    },
                });
                if (updatedMember) setMember(updatedMember);
            }

            goToStep(4);
            setIsPaymentSuccessTransition(true);
        } catch (error: any) {
            console.error('Error skipping payment:', error);
            showToast('Error al omitir el pago', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStep4Complete = async (profileData: any) => {
        setIsLoading(true);
        try {
            const newData = { ...registrationData, profile: profileData };
            setRegistrationData(newData);

            // Guardar en Supabase - Siguiente paso es el 5
            await saveProgress(5, newData);

            // Actualizar Memberstack
            const msResult = await window.$memberstackDom.updateMember({
                customFields: {
                    'registration-step': 5,
                    'first-name': profileData.firstName,
                },
            });

            if (msResult.data) {
                setMember(msResult.data);
            }

            // Sincronizar con CRM Lynsales - Paso 4
            const { syncCRMAction } = await import('@/app/actions/user.actions');
            const memberId = member?.id || (member as any)?.memberId;
            if (memberId) {
                syncCRMAction(memberId, 'step4', profileData).catch(err =>
                    console.error('⚠️ Error sincronizando con CRM (No crítico):', err)
                );
            }

            goToStep(5);
            showToast('Perfil completado', 'success');
        } catch (error: any) {
            showToast(error.message || 'Error guardando perfil', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Paso 5: Completar datos de mascota (soporta múltiples mascotas)
    const handleStep5Complete = async (petsData: any[]) => {
        setIsLoading(true);
        try {
            console.log(`🚀 Iniciando guardado final de mascotas (total: ${petsData.length})...`);
            const memberId = member?.id || (member as any)?.memberId;
            const processedPets = [];

            for (let i = 0; i < petsData.length; i++) {
                const petData = petsData[i];
                let primaryPhotoUrl = '';
                let vetCertificateUrl = '';

                console.log(`🐾 Procesando mascota ${i + 1}: ${petData.name || 'Sin nombre'}`);

                // 1. Subir archivos si existen
                if (petData.primaryPhoto && petData.primaryPhoto instanceof File) {
                    console.log(`📸 Subiendo foto principal para ${petData.name}...`);
                    const formData = new FormData();
                    formData.append('file', petData.primaryPhoto);
                    formData.append('userId', memberId);

                    const response = await fetch('/api/upload/pet-photo', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    if (result.success) primaryPhotoUrl = result.url;
                }

                if (petData.vetCertificate && petData.vetCertificate instanceof File) {
                    console.log(`📄 Subiendo certificado veterinario para ${petData.name}...`);
                    const formData = new FormData();
                    formData.append('file', petData.vetCertificate);
                    formData.append('userId', memberId);

                    const response = await fetch('/api/upload/pet-photo', { // Reusamos el endpoint de fotos
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    if (result.success) vetCertificateUrl = result.url;
                }

                // 2. Preparar el objeto completo de la mascota
                const { primaryPhoto, vetCertificate, ...restPetData } = petData;

                // Recuperar petBasic desde registrationData para la mascota correspondiente
                // O intentar recuperarlo de localStorage como backup
                let petBasicSource: any = (registrationData.petBasic && registrationData.petBasic[i]) || {};
                
                if (!petBasicSource.petName) {
                    try {
                        const backup = localStorage.getItem('petBasicBackup');
                        if (backup) {
                            const parsedBackup = JSON.parse(backup);
                            if (Array.isArray(parsedBackup) && parsedBackup[i]) {
                                petBasicSource = parsedBackup[i];
                                console.log(`💾 [Step5] petBasic[${i}] recuperado de localStorage:`, petBasicSource?.petName);
                            } else if (i === 0 && !Array.isArray(parsedBackup)) {
                                // Fallback para backup viejo de una sola mascota
                                petBasicSource = parsedBackup;
                            }
                        }
                    } catch (e) { /* localStorage no disponible */ }
                }

                const petName = petData.name || petData.petName || petBasicSource.petName || 'Mascota';

                // 3. Recalcular carencia final
                const calculation = calculateWaitingPeriod(
                    i === 0, // isOriginal solo para la primera mascota del plan
                    !!restPetData.isAdopted,
                    !!restPetData.isMixedBreed,
                    !!registrationData.referralCode
                );

                processedPets.push({
                    ...petBasicSource,
                    ...restPetData,
                    name: petName,
                    petName: petName,
                    petAge: petData.age || petBasicSource.petAge,
                    petAgeUnit: petData.ageUnit || petBasicSource.petAgeUnit || 'years',
                    petType: petData.petType || petBasicSource.petType || 'perro',
                    primaryPhotoUrl: primaryPhotoUrl || petData.primaryPhotoUrl,
                    vetCertificateUrl: vetCertificateUrl || petData.vetCertificateUrl,
                    waitingPeriodDays: calculation.days,
                    waitingPeriodEnd: calculation.endDate,
                    isComplete: true
                });
            }

            console.log(`📦 Enviando ${processedPets.length} mascotas a Supabase...`);

            // 3. Guardar en Supabase (Array de mascotas)
            const { registerPetsInSupabase } = await import('@/app/actions/user.actions');
            const result = await registerPetsInSupabase(memberId, processedPets);

            if (!result.success) throw new Error(result.error);

            // 4. Sincronizar con Memberstack (Campos detallados pet-1-name, pet-1-type, etc.)
            try {
                const { savePetsToMemberstack } = await import('@/services/pet.service');
                await savePetsToMemberstack(processedPets as any, registrationData.referralCode);
                console.log('✅ Mascotas sincronizadas con Memberstack');
            } catch (msError) {
                console.error('⚠️ Error sincronizando con Memberstack:', msError);
            }

            // 5. Marcar registro como completo en Memberstack (Solo lo esencial)
            await window.$memberstackDom.updateMember({
                customFields: {
                    'registration-step': 6,
                    'registration-completed': true,
                    'approval-status': 'pending',
                },
            });

            // 5. Actualizar progreso final en Supabase
            await saveProgress(6, { ...registrationData, petsComplete: processedPets });

            // Limpiar backup de localStorage
            try { localStorage.removeItem('petBasicBackup'); } catch (e) { /* */ }

            showToast('¡Registro completado!', 'success');

            // En lugar de redirigir, mostramos la pantalla de éxito final
            goToStep(6);
        } catch (error: any) {
            console.error('Error en Paso 5:', error);
            showToast(error.message || 'Error guardando mascota', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Navegación entre pasos
    const handleBack = () => {
        if (currentStep && currentStep > 1) {
            goToStep(currentStep - 1);
        }
    };

    // Pantalla de redirección para miembros pagados
    if (isRedirecting) {
        return (
            <div id="redirect-screen" className={styles.redirectContainer}>
                <div className={styles.redirectCard}>
                    <div className={styles.redirectIcon}>🐾</div>
                    <h2 className={styles.redirectTitle}>¡YA ERES PARTE DE LA FAMILIA!</h2>
                    <p className={styles.redirectText}>
                        Detectamos que ya cuentas con un plan activo. <br />
                        Te estamos llevando a tu portal de socio para que <br />
                        puedas gestionar tus beneficios.
                    </p>
                    <div className={styles.redirectLoader}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                    </div>

                    <button 
                        onClick={handleLogout}
                        className={styles.logoutLinkInCard}
                    >
                        ¿No eres tú? Cerrar sesión
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading || currentStep === null) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <NavbarRedesign onLogout={handleLogout} member={member} showLogout={currentStep > 1} />

            {/* Banner de beneficios (visible en pasos pre-pago 1, 2 y 3) */}
            {currentStep >= 1 && currentStep <= 3 && <BenefitsBanner />}

            <div className={(currentStep === 1 || currentStep >= 4) ? styles.contentWide : styles.content}>
                {/* Botón de Logout si hay sesión (para testing) */}
                {member && !isRedirecting && (
                    <div className={styles.logoutWrapper}>
                        <button onClick={handleLogout} className={styles.logoutLink}>
                            🚪 Cerrar sesión ({member.auth?.email})
                        </button>
                    </div>
                )}

                {/* Indicador de pasos (Oculto en pasos 1 y 2 ya que tienen su propio indicador interno, y en éxito/transición) */}
                {/* Indicador de pasos ya no es necesario arriba pues cada paso tiene su propia barra interna */}


                {/* Indicador de guardado */}
                {isSaving && (
                    <div className={styles.savingIndicator}>
                        <span className={styles.savingDot} />
                        Guardando...
                    </div>
                )}

                {/* Contenedor del paso */}
                <div className={styles.stepContainer}>
                    {(() => {
                        switch (currentStep) {
                            case 1:
                                return (
                                    <Step1Account
                                        data={registrationData}
                                        member={member}
                                        onNext={handleStep1Complete}
                                        onBack={handleBack}
                                        showToast={showToast}
                                        defaultEmail={urlEmail || undefined}
                                        autoLoginMode={isRecovery || !!urlEmail}
                                    />
                                );
                            case 2:
                                return (
                                    <Step2PetBasic
                                        data={registrationData}
                                        member={member}
                                        onNext={handleStep2Complete}
                                        onBack={handleBack}
                                        showToast={showToast}
                                    />
                                );
                            case 3:
                                return (
                                    <Step3PlanSelection
                                        data={registrationData}
                                        member={member}
                                        onNext={handleStep3Complete}
                                        onBack={() => setCurrentStep(2)}
                                        showToast={showToast}
                                        skipPaymentEnabled={skipPaymentEnabled}
                                        onSkipPayment={handleSkipPayment}
                                        isRecovery={isRecovery}
                                    />
                                );
                            case 4:
                                if (isPaymentSuccessTransition) {
                                    return (
                                        <Step3_5PaymentSuccess
                                            onNext={() => {
                                                setIsPaymentSuccessTransition(false);
                                                goToStep(4);
                                                showToast('¡Pago exitoso! Completa tu perfil.', 'success');
                                            }}
                                        />
                                    );
                                }
                                return (
                                    <Step4CompleteProfile
                                        data={registrationData}
                                        member={member}
                                        onNext={handleStep4Complete}
                                        onBack={handleBack}
                                        showToast={showToast}
                                    />
                                );
                            case 5:
                                return (
                                    <Step5CompletePet
                                        data={registrationData}
                                        member={member}
                                        onNext={handleStep5Complete}
                                        onBack={handleBack}
                                        showToast={showToast}
                                    />
                                );
                            case 6:
                                return (
                                    <Step6Success
                                        petName={Array.isArray(registrationData.petBasic) ? (registrationData.petBasic[0]?.petName || '') : ''}
                                        member={member}
                                        userEmail={registrationData.account?.email}
                                    />
                                );
                            default:
                                return null;
                        }
                    })()}
                </div>
            </div>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}
