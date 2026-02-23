'use client';

import React, { useState, useCallback, useEffect } from 'react';
import styles from './ReferralCodeSelector.module.css';

interface ValidationResult {
    code: string;
    isAvailable: boolean;
    isValid: boolean;
    error: string | null;
    suggestions: string[];
}

interface ReferralCodeSelectorProps {
    ambassadorId: string;
    initialCode?: string;
    onSuccess?: (code: string) => void;
    onCancel?: () => void;
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    
    return debouncedValue;
}

export default function ReferralCodeSelector({
    ambassadorId,
    initialCode = '',
    onSuccess,
    onCancel
}: ReferralCodeSelectorProps) {
    const [code, setCode] = useState(initialCode.toUpperCase());
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const debouncedCode = useDebounce(code, 500);

    // Validar código cuando cambia (con debounce)
    useEffect(() => {
        const validateCode = async () => {
            if (!debouncedCode || debouncedCode.length < 2) {
                setValidationResult(null);
                return;
            }

            setIsValidating(true);
            setSaveError(null);

            try {
                const response = await fetch(
                    `/api/ambassadors/referral-code/validate?code=${encodeURIComponent(debouncedCode)}`
                );
                const data = await response.json();

                if (data.success) {
                    setValidationResult(data.data);
                }
            } catch (error) {
                console.error('Error validando código:', error);
            } finally {
                setIsValidating(false);
            }
        };

        validateCode();
    }, [debouncedCode]);

    // Manejar cambio de input
    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toUpperCase();
        // Remover espacios y caracteres no permitidos
        value = value.replace(/[^A-Z0-9]/g, '').slice(0, 8);
        setCode(value);
        setSaveError(null);
    }, []);

    // Seleccionar sugerencia
    const handleSelectSuggestion = (suggestion: string) => {
        setCode(suggestion);
        setValidationResult(null);
    };

    // Abrir modal de confirmación
    const handleOpenConfirm = () => {
        if (!validationResult?.isAvailable) return;
        setShowConfirmModal(true);
    };

    // Cerrar modal de confirmación
    const handleCloseConfirm = () => {
        setShowConfirmModal(false);
    };

    // Guardar código
    const handleSave = async () => {
        if (!validationResult?.isAvailable) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            const response = await fetch('/api/ambassadors/referral-code/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ambassadorId,
                    code: validationResult.code,
                    confirmed: true
                })
            });

            const data = await response.json();

            if (data.success) {
                onSuccess?.(validationResult.code);
            } else {
                setSaveError(data.error || 'Error al guardar el código');
            }
        } catch (error) {
            console.error('Error guardando código:', error);
            setSaveError('Error de conexión. Intenta de nuevo.');
        } finally {
            setIsSaving(false);
            setShowConfirmModal(false);
        }
    };

    // Renderizar estado de validación
    const renderValidationStatus = () => {
        if (code.length < 2) {
            return (
                <div className={styles.hint}>
                    💡 Mínimo 2 caracteres, máximo 8. Solo letras (A-Z) y números (0-9).
                </div>
            );
        }

        if (isValidating) {
            return (
                <div className={styles.validating}>
                    <span className={styles.spinnerSmall}></span>
                    Verificando disponibilidad...
                </div>
            );
        }

        if (!validationResult) return null;

        if (validationResult.isAvailable) {
            return (
                <div className={styles.success}>
                    ✅ ¡Código disponible!
                </div>
            );
        }

        return (
            <div className={styles.error}>
                ❌ {validationResult.error}
            </div>
        );
    };

    // Renderizar preview del código
    const renderPreview = () => {
        if (code.length < 2) return null;

        const isValid = validationResult?.isAvailable;

        return (
            <div className={`${styles.preview} ${isValid ? styles.previewValid : styles.previewInvalid}`}>
                <div className={styles.previewLabel}>Así se verá tu código:</div>
                <div className={styles.previewCode}>
                    clubpataamiga.com?ref={code}
                </div>
            </div>
        );
    };

    // Renderizar sugerencias
    const renderSuggestions = () => {
        if (!validationResult?.suggestions?.length) return null;

        return (
            <div className={styles.suggestions}>
                <div className={styles.suggestionsTitle}>Sugerencias disponibles:</div>
                <div className={styles.suggestionsList}>
                    {validationResult.suggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            className={styles.suggestionChip}
                            onClick={() => handleSelectSuggestion(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>🎯 Elige tu código de embajador</h2>
                
                <p className={styles.description}>
                    Este código te identificará como embajador de Club Pata Amiga. 
                    Tus referidos lo usarán para obtener beneficios especiales.
                </p>

                <div className={styles.rules}>
                    <div className={styles.rule}>✓ 2-8 caracteres</div>
                    <div className={styles.rule}>✓ Letras A-Z</div>
                    <div className={styles.rule}>✓ Números 0-9</div>
                    <div className={styles.rule}>✗ Sin O, I, L</div>
                    <div className={styles.rule}>✗ Sin espacios o símbolos</div>
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="referral-code" className={styles.label}>
                        Tu código único
                    </label>
                    <input
                        id="referral-code"
                        type="text"
                        value={code}
                        onChange={handleCodeChange}
                        placeholder="Ej: MARIA25"
                        className={`${styles.input} ${
                            validationResult?.isAvailable ? styles.inputValid : 
                            validationResult && !validationResult.isAvailable ? styles.inputInvalid : ''
                        }`}
                        maxLength={8}
                        disabled={isSaving}
                    />
                    <div className={styles.charCount}>
                        {code.length}/8
                    </div>
                </div>

                {renderValidationStatus()}
                {renderPreview()}
                {renderSuggestions()}

                {saveError && (
                    <div className={styles.saveError}>
                        ❌ {saveError}
                    </div>
                )}

                <div className={styles.actions}>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className={styles.cancelButton}
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleOpenConfirm}
                        disabled={!validationResult?.isAvailable || isSaving}
                        className={styles.continueButton}
                    >
                        {isSaving ? (
                            <>
                                <span className={styles.spinnerSmall}></span>
                                Guardando...
                            </>
                        ) : (
                            'Continuar'
                        )}
                    </button>
                </div>
            </div>

            {/* Modal de Confirmación */}
            {showConfirmModal && (
                <div className={styles.modalOverlay} onClick={handleCloseConfirm}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>⚠️ ¿Estás seguro?</h3>
                        </div>
                        
                        <div className={styles.modalBody}>
                            <p className={styles.modalText}>
                                Estás a punto de elegir el código:
                            </p>
                            
                            <div className={styles.modalCode}>
                                {validationResult?.code}
                            </div>
                            
                            <div className={styles.modalWarning}>
                                <strong>Importante:</strong>
                                <ul>
                                    <li>Una vez guardado, el código <strong>NO puede cambiarse</strong></li>
                                    <li>Este código te identificará permanentemente como embajador</li>
                                    <li>Tus referidos lo usarán para registrarse</li>
                                </ul>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                onClick={handleCloseConfirm}
                                className={styles.cancelButton}
                                disabled={isSaving}
                            >
                                Volver a editar
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className={styles.confirmButton}
                            >
                                {isSaving ? (
                                    <>
                                        <span className={styles.spinnerSmall}></span>
                                        Guardando...
                                    </>
                                ) : (
                                    'Sí, estoy seguro'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
