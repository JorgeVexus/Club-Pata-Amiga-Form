/**
 * Demo Page for Step Indicator
 * Shows how the stepper works before full integration
 */

'use client';

import React, { useState } from 'react';
import StepIndicator from '@/components/UI/StepIndicator';

export default function StepperDemo() {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const handleNext = () => {
        if (currentStep < 3) {
            setCompletedSteps(prev => [...prev, currentStep]);
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepClick = (step: number) => {
        // Cuando regresas a un paso anterior, quita ese paso y los siguientes de "completados"
        setCompletedSteps(prev => prev.filter(s => s < step));
        setCurrentStep(step);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                Demo: Indicador de Progreso
            </h1>

            <StepIndicator
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginTop: '2rem'
            }}>
                <h2 style={{ marginBottom: '1rem' }}>
                    {currentStep === 1 && '📝 Paso 1: Completa tu perfil'}
                    {currentStep === 2 && '🐾 Paso 2: Registra a tus peludos'}
                    {currentStep === 3 && '✅ Paso 3: Finaliza tu solicitud'}
                </h2>

                <p style={{ color: '#666', marginBottom: '2rem' }}>
                    {currentStep === 1 && 'Aquí irían los campos del formulario de perfil (nombre, CURP, dirección, etc.)'}
                    {currentStep === 2 && 'Aquí iría el formulario de registro de mascotas'}
                    {currentStep === 3 && 'Aquí iría la selección de plan y confirmación final'}
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                    <button
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '50px',
                            border: '2px solid #000000',
                            background: currentStep === 1 ? '#ccc' : '#00BBB4',
                            color: '#000000',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentStep === 1 ? 0.5 : 1
                        }}
                    >
                        ← Anterior
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentStep === 3}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '50px',
                            border: '2px solid #000000',
                            background: currentStep === 3 ? '#ccc' : '#FE8F15',
                            color: '#000000',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: currentStep === 3 ? 'not-allowed' : 'pointer',
                            boxShadow: currentStep === 3 ? 'none' : '0 4px 8px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        {currentStep === 3 ? 'Finalizado ✓' : 'Siguiente →'}
                    </button>
                </div>

                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                }}>
                    <strong>Estado actual:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                        <li>Paso actual: {currentStep}</li>
                        <li>Pasos completados: {completedSteps.length > 0 ? completedSteps.join(', ') : 'Ninguno'}</li>
                        <li>Puedes hacer click en los pasos completados para volver atrás</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
