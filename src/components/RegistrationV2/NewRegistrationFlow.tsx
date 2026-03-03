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
import { useRouter } from 'next/navigation';

// Componentes de pasos
import Step1Account from './steps/Step1Account';
import Step2PetBasic from './steps/Step2PetBasic';
import Step3PlanSelection from './steps/Step3PlanSelection';
import Step4CompleteProfile from './steps/Step4CompleteProfile';
import Step5CompletePet from './steps/Step5CompletePet';
import StepIndicator from './StepIndicator';
import BenefitsBanner from './BenefitsBanner';
import Toast from '@/components/UI/Toast';

// Servicios
import { registerUserInSupabase, getUserDataByMemberstackId } from '@/app/actions/user.actions';

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
    petBasic?: {
        petType: 'perro' | 'gato';
        petName: string;
        petAge: number;
        petAgeUnit: 'years' | 'months';
    };
    planId?: string;
    paymentCompleted?: boolean;
    profile?: any;
    petComplete?: any;
}

export default function NewRegistrationFlow() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [member, setMember] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Datos del registro
    const [registrationData, setRegistrationData] = useState<RegistrationData>({});

    // Configuración
    const [skipPaymentEnabled, setSkipPaymentEnabled] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning'; isVisible: boolean }>({ message: '', type: 'error', isVisible: false });

    // Cargar estado guardado al montar
    useEffect(() => {
        const loadSavedState = async () => {
            try {
                if (!window.$memberstackDom) {
                    // Esperar a que Memberstack cargue
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                if (window.$memberstackDom) {
                    const { data: currentMember } = await window.$memberstackDom.getCurrentMember();

                    if (currentMember) {
                        setMember(currentMember);

                        // Cargar datos de Supabase
                        console.log('📥 Cargando datos desde Supabase...');
                        const result = await getUserDataByMemberstackId(currentMember.id);

                        if (result.success && result.userData) {
                            const userData = result.userData;

                            // Reconstruir datos del registro desde Supabase
                            const loadedData: RegistrationData = {
                                account: {
                                    email: currentMember.auth?.email || userData.email,
                                },
                                petBasic: userData.pet_name ? {
                                    petType: userData.pet_type || 'perro',
                                    petName: userData.pet_name,
                                    petAge: userData.pet_age || 0,
                                    petAgeUnit: userData.pet_age_unit || 'years',
                                } : undefined,
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
                                } : undefined,
                            };

                            setRegistrationData(loadedData);
                            console.log('✅ Datos cargados desde Supabase:', loadedData);
                        }

                        // Verificar estado de registro en Memberstack
                        const registrationStep = currentMember.customFields?.['registration-step'];
                        const paymentStatus = currentMember.customFields?.['payment-status'];

                        if (registrationStep) {
                            const step = Number(registrationStep);
                            // Si ya pagó, ir al paso 4 o 5 según corresponda
                            if (paymentStatus === 'completed' && step < 4) {
                                setCurrentStep(4);
                            } else {
                                setCurrentStep(step);
                            }
                        }
                    }
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

    const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setToast({ message, type, isVisible: true });
    };

    // Guardar progreso en Supabase
    const saveProgress = useCallback(async (step: number, data: any) => {
        const memberId = member?.id || member?.memberId;
        if (!memberId) return;

        setIsSaving(true);
        try {
            // Mapear datos al formato de Supabase (Source of Truth)
            const userData: any = {
                email: data.account?.email || member.auth?.email,
                registration_step: step,
            };

            // Agregar datos de mascota (básicos)
            if (data.petBasic) {
                userData.pet_type = data.petBasic.petType;
                userData.pet_name = data.petBasic.petName;
                userData.pet_age = data.petBasic.petAge;
                userData.pet_age_unit = data.petBasic.petAgeUnit;
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
            }

            await registerUserInSupabase(userData, memberId);
            console.log('✅ Progreso guardado en Supabase (Source of Truth)', { step, memberId });
        } catch (error) {
            console.error('Error guardando progreso:', error);
        } finally {
            setIsSaving(false);
        }
    }, [member]);

    // ===== HANDLERS DE PASOS =====

    // Paso 1: Crear cuenta en Memberstack
    const handleStep1Complete = async (data: { email: string; password: string }) => {
        setIsLoading(true);
        try {
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

            if (!result.data) {
                throw new Error('Error creando cuenta');
            }

            const newMember = result.data;
            const msId = newMember?.id || newMember?.memberId;

            if (!msId) {
                console.error('❌ Memberstack Signup Result logic error:', newMember);
                throw new Error('Error de consistencia en Memberstack (ID no encontrado)');
            }

            setMember(newMember);

            // Guardar en Supabase (estado inicial)
            const supabaseResult = await registerUserInSupabase(
                { email: data.email, registration_step: 2 },
                msId
            );

            if (!supabaseResult.success) {
                console.warn('⚠️ Falló registro inicial en Supabase:', supabaseResult.error);
                // No lanzamos error para no bloquear al usuario si Memberstack sí funcionó
            }

            setRegistrationData(prev => ({ ...prev, account: data }));
            setCurrentStep(2);
            showToast('¡Cuenta creada exitosamente!', 'success');

        } catch (error: any) {
            console.error('Error:', error);
            // Propagar el error para que Step1Account lo maneje visualmente
            if (error?.code === 'email-already-in-use' ||
                error?.message?.includes('already taken') ||
                error?.message?.includes('email-already-in-use') ||
                error?.message?.includes('already exists')) {
                throw error; // Propagar
            } else {
                showToast(error.message || 'Error al crear cuenta', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Paso 2: Guardar datos básicos de mascota
    const handleStep2Complete = async (data: { petType: 'perro' | 'gato'; petName: string; petAge: number; petAgeUnit: 'years' | 'months' }) => {
        const newData = { ...registrationData, petBasic: data };
        setRegistrationData(newData);

        // Guardar en Supabase (Source of Truth)
        await saveProgress(2, newData);

        // Actualizar Memberstack (Solo lo esencial para el flujo/auth)
        if (member && window.$memberstackDom) {
            await window.$memberstackDom.updateMember({
                customFields: {
                    'registration-step': 3,
                },
            });
        }

        setCurrentStep(3);
    };

    // Paso 3: Seleccionar plan y proceder a pago
    const handleStep3Complete = async (planId: string) => {
        const newData = { ...registrationData, planId };
        setRegistrationData(newData);

        // Guardar en Supabase
        await saveProgress(3, newData);

        // Actualizar Memberstack
        if (member && window.$memberstackDom) {
            await window.$memberstackDom.updateMember({
                customFields: {
                    'registration-step': 4,
                    'selected-plan-id': planId,
                },
            });
        }

        // Iniciar checkout de Stripe
        try {
            const result = await window.$memberstackDom.purchasePlansWithCheckout({
                priceId: planId,
            });

            if (result) {
                // Pago exitoso
                const completedData = { ...newData, paymentCompleted: true };
                setRegistrationData(completedData);

                await window.$memberstackDom.updateMember({
                    customFields: {
                        'payment-status': 'completed',
                        'registration-step': 4,
                    },
                });

                // Guardar en Supabase
                await saveProgress(4, completedData);

                setCurrentStep(4);
                showToast('¡Pago exitoso! Completa tu perfil.', 'success');
            }
        } catch (error: any) {
            console.error('Error en checkout:', error);
            showToast(error.message || 'Error al procesar el pago', 'error');
        }
    };

    const handleSkipPayment = async (planId: string) => {
        setIsSaving(true);
        try {
            const newData = { ...registrationData, planId, paymentCompleted: true };
            setRegistrationData(newData);

            // Guardar en Supabase
            await saveProgress(4, newData);

            // Actualizar Memberstack
            if (member && window.$memberstackDom) {
                await window.$memberstackDom.updateMember({
                    customFields: {
                        'registration-step': 4,
                        'selected-plan-id': planId,
                        'payment-status': 'completed'
                    },
                });
            }

            setCurrentStep(4);
            showToast('Modo Test: Pago omitido con éxito.', 'success');
        } catch (error: any) {
            console.error('Error skipping payment:', error);
            showToast('Error al omitir el pago', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Paso 4: Completar datos del contratante
    const handleStep4Complete = async (profileData: any) => {
        setIsLoading(true);
        try {
            const newData = { ...registrationData, profile: profileData };
            setRegistrationData(newData);

            // Guardar en Supabase (Source of Truth)
            // Esto guardará todos los datos de perfil mapeados en saveProgress
            await saveProgress(4, newData);

            // Actualizar Memberstack (Solo lo esencial para el flujo y pagos)
            await window.$memberstackDom.updateMember({
                customFields: {
                    'registration-step': 5,
                    'first-name': profileData.firstName, // Necesario para personalizar el dashboard
                },
            });

            setCurrentStep(5);
            showToast('Perfil completado', 'success');
        } catch (error: any) {
            showToast(error.message || 'Error guardando perfil', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Paso 5: Completar datos de mascota
    const handleStep5Complete = async (petData: any) => {
        setIsLoading(true);
        try {
            console.log('🚀 Iniciando guardado final de mascota...');
            let primaryPhotoUrl = '';
            let vetCertificateUrl = '';

            // 1. Subir archivos si existen
            if (petData.primaryPhoto) {
                console.log('📸 Subiendo foto principal...');
                const formData = new FormData();
                formData.append('file', petData.primaryPhoto);
                formData.append('userId', member.id);

                const response = await fetch('/api/upload/pet-photo', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (result.success) primaryPhotoUrl = result.url;
            }

            if (petData.vetCertificate) {
                console.log('📄 Subiendo certificado veterinario...');
                const formData = new FormData();
                formData.append('file', petData.vetCertificate);
                formData.append('userId', member.id);

                const response = await fetch('/api/upload/pet-photo', { // Reusamos el endpoint de fotos por ahora
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (result.success) vetCertificateUrl = result.url;
            }

            // 2. Preparar el objeto completo de la mascota
            const completePet = {
                ...registrationData.petBasic,
                ...petData,
                primaryPhotoUrl,
                vetCertificateUrl,
                isComplete: true
            };

            // 3. Guardar en Supabase (Source of Truth)
            const { registerPetsInSupabase } = await import('@/app/actions/user.actions');
            const result = await registerPetsInSupabase(member.id, [completePet]);

            if (!result.success) throw new Error(result.error);

            // 4. Marcar registro como completo en Memberstack (Solo lo esencial)
            await window.$memberstackDom.updateMember({
                customFields: {
                    'registration-step': 6,
                    'registration-completed': true,
                },
            });

            // 5. Actualizar progreso final en Supabase
            await saveProgress(6, { ...registrationData, petComplete: completePet });

            showToast('¡Registro completado!', 'success');

            // Redirigir al dashboard o página de confirmación
            setTimeout(() => {
                router.push('/registro/confirmacion');
            }, 1500);
        } catch (error: any) {
            console.error('Error en Paso 5:', error);
            showToast(error.message || 'Error guardando mascota', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Navegación entre pasos
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Renderizar paso actual
    const CurrentStepComponent = STEPS[currentStep - 1]?.component;

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Banner de beneficios (visible en pasos pre-pago) */}
            {currentStep <= 3 && <BenefitsBanner />}

            <div className={styles.content}>
                {/* Indicador de pasos */}
                <StepIndicator
                    currentStep={currentStep}
                    totalSteps={5}
                    stepLabels={STEPS.map(s => s.label)}
                />

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
                                    />
                                );
                            case 4:
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
