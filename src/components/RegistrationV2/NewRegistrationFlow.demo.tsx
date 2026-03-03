/**
 * Nuevo Flujo de Registro - MODO DEMO/TEST
 * 
 * Este modo funciona completamente en local sin dependencias externas:
 * - Usa localStorage en lugar de Supabase
 * - Simula Memberstack con datos locales
 * - Permite probar todo el flujo sin configuración
 * 
 * Para usar en producción, cambiar a NewRegistrationFlow.tsx
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Componentes de pasos
import Step1Account from './steps/Step1Account.demo';
import Step2PetBasic from './steps/Step2PetBasic.demo';
import Step3PlanSelection from './steps/Step3PlanSelection.demo';
import Step4CompleteProfile from './steps/Step4CompleteProfile.demo';
import Step5CompletePet from './steps/Step5CompletePet.demo';
import StepIndicator from './StepIndicator';
import BenefitsBanner from './BenefitsBanner';
import Toast from '@/components/UI/Toast';

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

// Simulación de usuario de Memberstack
const createMockMember = (email: string) => ({
    id: `demo_${Date.now()}`,
    auth: { email },
    customFields: {
        'registration-step': 1,
        'payment-status': 'pending',
    }
});

export default function NewRegistrationFlowDemo() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [member, setMember] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Datos del registro (solo localStorage, no Supabase)
    const [registrationData, setRegistrationData] = useState<RegistrationData>({});

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning'; isVisible: boolean }>({ message: '', type: 'error', isVisible: false });

    // Cargar estado guardado al montar
    useEffect(() => {
        const loadSavedState = () => {
            try {
                // Cargar desde localStorage
                const savedData = localStorage.getItem('registration_demo_data');
                const savedStep = localStorage.getItem('registration_demo_step');
                const savedMember = localStorage.getItem('registration_demo_member');

                if (savedData) {
                    setRegistrationData(JSON.parse(savedData));
                }

                if (savedStep) {
                    setCurrentStep(Number(savedStep));
                }

                if (savedMember) {
                    setMember(JSON.parse(savedMember));
                }
            } catch (error) {
                console.error('Error cargando estado:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSavedState();
    }, []);

    // Guardar datos cuando cambian
    useEffect(() => {
        if (Object.keys(registrationData).length > 0) {
            localStorage.setItem('registration_demo_data', JSON.stringify(registrationData));
        }
    }, [registrationData]);

    // Guardar paso actual
    useEffect(() => {
        localStorage.setItem('registration_demo_step', currentStep.toString());
    }, [currentStep]);

    // Guardar member
    useEffect(() => {
        if (member) {
            localStorage.setItem('registration_demo_member', JSON.stringify(member));
        }
    }, [member]);

    const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setToast({ message, type, isVisible: true });
    };

    // ===== HANDLERS DE PASOS =====

    // Paso 1: Crear cuenta (simulado)
    const handleStep1Complete = async (data: { email: string; password: string }) => {
        setIsLoading(true);

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verificar si el email ya existe en el demo
        const existingUsers = JSON.parse(localStorage.getItem('registration_demo_users') || '[]');
        const emailExists = existingUsers.some((u: any) => u.email === data.email);

        if (emailExists) {
            setIsLoading(false);
            throw {
                code: 'email-already-in-use',
                message: 'Este correo ya está registrado'
            };
        }

        // Crear usuario demo
        const newMember = createMockMember(data.email);
        setMember(newMember);

        // Guardar en "base de datos" local
        existingUsers.push({ email: data.email, id: newMember.id });
        localStorage.setItem('registration_demo_users', JSON.stringify(existingUsers));

        setRegistrationData(prev => ({ ...prev, account: data }));
        setCurrentStep(2);
        showToast('¡Cuenta creada exitosamente! (Modo Demo)', 'success');

        setIsLoading(false);
    };

    // Paso 2: Guardar datos básicos de mascota
    const handleStep2Complete = async (data: { petType: 'perro' | 'gato'; petName: string; petAge: number; petAgeUnit: 'years' | 'months' }) => {
        const newData = { ...registrationData, petBasic: data };
        setRegistrationData(newData);

        // Actualizar member simulado
        if (member) {
            const updatedMember = {
                ...member,
                customFields: {
                    ...member.customFields,
                    'registration-step': 3,
                    'pet-name': data.petName,
                    'pet-type': data.petType,
                }
            };
            setMember(updatedMember);
        }

        setCurrentStep(3);
        showToast('Datos de mascota guardados', 'success');
    };

    // Paso 3: Seleccionar plan y "pagar"
    const handleStep3Complete = async (planId: string) => {
        const newData = { ...registrationData, planId };
        setRegistrationData(newData);

        // Simular checkout exitoso
        await new Promise(resolve => setTimeout(resolve, 800));

        const completedData = { ...newData, paymentCompleted: true };
        setRegistrationData(completedData);

        // Actualizar member
        if (member) {
            const updatedMember = {
                ...member,
                customFields: {
                    ...member.customFields,
                    'payment-status': 'completed',
                    'registration-step': 4,
                }
            };
            setMember(updatedMember);
        }

        setCurrentStep(4);
        showToast('¡Pago exitoso! (Simulado) Completa tu perfil.', 'success');
    };

    // Paso 4: Completar datos del contratante
    const handleStep4Complete = async (profileData: any) => {
        setIsLoading(true);

        await new Promise(resolve => setTimeout(resolve, 500));

        const newData = { ...registrationData, profile: profileData };
        setRegistrationData(newData);

        // Actualizar member
        if (member) {
            const updatedMember = {
                ...member,
                customFields: {
                    ...member.customFields,
                    'registration-step': 5,
                    'first-name': profileData.firstName,
                }
            };
            setMember(updatedMember);
        }

        setCurrentStep(5);
        showToast('Perfil completado', 'success');
        setIsLoading(false);
    };

    // Paso 5: Completar datos de mascota
    const handleStep5Complete = async (petData: any) => {
        setIsLoading(true);

        await new Promise(resolve => setTimeout(resolve, 600));

        // Marcar registro como completo
        if (member) {
            const updatedMember = {
                ...member,
                customFields: {
                    ...member.customFields,
                    'registration-step': 6,
                    'registration-completed': true,
                    'approval-status': 'waiting_approval',
                }
            };
            setMember(updatedMember);
        }

        // Guardar datos finales
        localStorage.setItem('registration_demo_completed', 'true');
        localStorage.setItem('registration_demo_completed_at', new Date().toISOString());

        showToast('¡Registro completado! (Modo Demo)', 'success');

        // Redirigir a confirmación
        setTimeout(() => {
            router.push('/registro/confirmacion');
        }, 1500);

        setIsLoading(false);
    };

    // Navegación entre pasos
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Cerrar sesión (limpiar demo)
    const handleLogout = async () => {
        localStorage.removeItem('registration_demo_data');
        localStorage.removeItem('registration_demo_step');
        localStorage.removeItem('registration_demo_member');
        localStorage.removeItem('registration_demo_completed');
        setMember(null);
        setRegistrationData({});
        setCurrentStep(1);
        showToast('Sesión de demo cerrada', 'success');
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
            {/* Banner de MODO DEMO */}
            <div style={{
                background: '#FE8F15',
                color: 'white',
                padding: '0.5rem',
                textAlign: 'center',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.85rem',
                fontWeight: 600,
            }}>
                🧪 MODO DEMO - Datos guardados localmente
            </div>

            {/* Banner de beneficios (visible en pasos pre-pago) */}
            {currentStep <= 3 && <BenefitsBanner />}

            <div className={styles.content}>
                {/* Indicador de pasos */}
                <StepIndicator
                    currentStep={currentStep}
                    totalSteps={5}
                    stepLabels={STEPS.map(s => s.label)}
                />

                {/* Contenedor del paso */}
                <div className={styles.stepContainer}>
                    {CurrentStepComponent && (
                        <CurrentStepComponent
                            data={registrationData}
                            member={member}
                            onNext={
                                currentStep === 1 ? handleStep1Complete :
                                    currentStep === 2 ? handleStep2Complete :
                                        currentStep === 3 ? handleStep3Complete :
                                            currentStep === 4 ? handleStep4Complete :
                                                handleStep5Complete
                            }
                            onBack={handleBack}
                            showToast={showToast}
                            onLogout={handleLogout}
                        />
                    )}
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
