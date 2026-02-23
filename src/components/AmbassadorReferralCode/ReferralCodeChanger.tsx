'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './ReferralCodeChanger.module.css';

interface ValidationResult {
    code: string;
    isAvailable: boolean;
    isValid: boolean;
    error: string | null;
    suggestions: string[];
}

interface CanChangeStatus {
    canChange: boolean;
    currentCode: string;
    reason: string | null;
}

interface ReferralCodeChangerProps {
    ambassadorId: string;
    onSuccess?: (oldCode: string, newCode: string) => void;
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

export default function ReferralCodeChanger({
    ambassadorId,
    onSuccess,
    onCancel
}: ReferralCodeChangerProps) {
    const [canChangeStatus, setCanChangeStatus] = useState<CanChangeStatus | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{ oldCode: string; newCode: string } | null>(null);

    const debouncedCode = useDebounce(code, 500);

    // Verificar si puede cambiar el código
    useEffect(() => {
        const checkCanChange = async () => {
            try {
                const response = await fetch(
                    `/api/ambassadors/referral-code/change?ambassadorId=${ambassadorId}`
                );
                const data = await response.json();

                if (data.success) {
                    setCanChangeStatus(data.data);
                }
            } catch (error) {
                console.error('Error verificando permisos:', error);
            } finally {
                setIsLoadingStatus(false);
            }
        };

        checkCanChange();
    }, [ambassadorId]);

    // Validar código cuando cambia (con debounce)
    useEffect(() => {
        const validateCode = async () => {
            if (!debouncedCode || debouncedCode.length < 2) {
                setValidationResult(null);
                return;
            }

            // No permitir el código actual
            if (debouncedCode === canChangeStatus?.currentCode) {
                setValidationResult({
                    code: debouncedCode,
                    isAvailable: false,
                    isValid: false,
                    error: 'El nuevo código debe ser diferente al actual',
                    suggestions: []
                });
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
    }, [debouncedCode, canChangeStatus?.currentCode]);

    // Manejar cambio de input
    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toUpperCase();
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

    // Cambiar código
    const handleChange = async () => {
        if (!validationResult?.isAvailable) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            const response = await fetch('/api/ambassadors/referral-code/change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ambassadorId,
                    newCode: validationResult.code,
                    confirmed: true
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccessData({
                    oldCode: data.data.old_code,
                    newCode: data.data.new_code
                });
                onSuccess?.(data.data.old_code, data.data.new_code);
            } else {
                setSaveError(data.error || 'Error al cambiar el código');
            }
        } catch (error) {
            console.error('Error cambiando código:', error);
            setSaveError('Error de conexión. Intenta de nuevo.');
        } finally {
            setIsSaving(false);
            setShowConfirmModal(false);
        }
    };

    // Renderizar estado de carga
    if (isLoadingStatus) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Verificando permisos...</p>
                </div>
            </div>
        );
    }

    // Renderizar si no puede cambiar
    if (!canChangeStatus?.canChange) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h2 className={styles.title}>No puedes cambiar tu código</h2>
                    <p className={styles.errorMessage}>
                        {canChangeStatus?.reason || 'No tienes permitido cambiar tu código de embajador.'}
                    </p>
                    {onCancel && (
                        <button onClick={onCancel} className={styles.cancelButton}>
                            Volver
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Renderizar estado de éxito
    if (successData) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.successIcon}>🎉</div>
                    <h2 className={styles.title}>¡Código cambiado!</h2>
                    
                    <div className={styles.codeComparison}>
                        <div className={styles.oldCode}>
                            <span className={styles.codeLabel}>Código anterior:</span>
                            <span className={styles.codeValue}>{successData.oldCode}</span>
                        </div>
                        <div className={styles.arrow}>→</div>
                        <div className={styles.newCode}>
                            <span className={styles.codeLabel}>Nuevo código:</span>
                            <span className={styles.codeValue}>{successData.newCode}</span>
                        </div>
                    </div>
                    
                    <div className={styles.warningBox}>
                        <strong>⚠️ Importante:</strong>
                        <p>Este cambio solo se puede hacer una vez. Tu nuevo código es permanente.</p>
                    </div>

                    <p className={styles.successMessage}>
                        Asegúrate de actualizar cualquier lugar donde hayas compartido tu código anterior.
                    </p>
                    
                    {onCancel && (
                        <button onClick={onCancel} className={styles.continueButton}>
                            Volver al dashboard
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Renderizar formulario de cambio
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h2 className={styles.title}>🔄 Cambiar tu código</h2>
                    <span className={styles.badge}>Solo una vez</span>
                </div>
                
                <div className={styles.currentCodeBox}>
                    <span className={styles.currentCodeLabel}>Código actual:</span>
                    <span className={styles.currentCodeValue}>{canChangeStatus.currentCode}</span>
                </div>

                <p className={styles.description}>
                    Puedes cambiar tu código de embajador <strong>una sola vez</strong>. 
                    Elige cuidadosamente, ya que no podrás modificarlo nuevamente.
                </p>

                <div className={styles.rules}>
                    <div className={styles.rule}>✓ 2-8 caracteres</div>
                    <div className={styles.rule}>✓ Letras A-Z</div>
                    <div className={styles.rule}>✓ Números 0-9</div>
                    <div className={styles.rule}>✗ Sin O, I, L</div>
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="new-referral-code" className={styles.label}>
                        Nuevo código
                    </label>
                    <input
                        id="new-referral-code"
                        type="text"
                        value={code}
                        onChange={handleCodeChange}
                        placeholder="Ej: NUEVO25"
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

                {/* Estado de validación */}
                {code.length < 2 ? (
                    <div className={styles.hint}>
                        💡 Ingresa un código de 2-8 caracteres
                    </div>
                ) : isValidating ? (
                    <div className={styles.validating}>
                        <span className={styles.spinnerSmall}></span>
                        Verificando...
                    </div>
                ) : validationResult?.isAvailable ? (
                    <div className={styles.success}>
                        ✅ ¡Código disponible!
                    </div>
                ) : validationResult ? (
                    <div className={styles.error}>
                        ❌ {validationResult.error}
                    </div>
                ) : null}

                {/* Preview */}
                {validationResult?.isAvailable && (
                    <div className={styles.preview}>
                        <div className={styles.previewLabel}>Tu nuevo enlace:</div>
                        <div className={styles.previewCode}>
                            clubpataamiga.com?ref={validationResult.code}
                        </div>
                    </div>
                )}

                {/* Sugerencias */}
                {validationResult?.suggestions && validationResult.suggestions.length > 0 && (
                    <div className={styles.suggestions}>
                        <div className={styles.suggestionsTitle}>Sugerencias:</div>
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
                )}

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
                                Cambiando...
                            </>
                        ) : (
                            'Cambiar código'
                        )}
                    </button>
                </div>
            </div>

            {/* Modal de Confirmación */}
            {showConfirmModal && (
                <div className={styles.modalOverlay} onClick={handleCloseConfirm}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>⚠️ ¿Estás absolutamente seguro?</h3>
                        </div>
                        
                        <div className={styles.modalBody}>
                            <p className={styles.modalText}>
                                Estás cambiando tu código de:
                            </p>
                            
                            <div className={styles.codeChangeDisplay}>
                                <div className={styles.oldCodeSmall}>{canChangeStatus.currentCode}</div>
                                <div className={styles.arrowSmall}>→</div>
                                <div className={styles.newCodeSmall}>{validationResult?.code}</div>
                            </div>
                            
                            <div className={styles.modalWarning}>
                                <strong>⚠️ Esto solo se puede hacer UNA VEZ</strong>
                                <ul>
                                    <li>Tu código actual dejará de funcionar inmediatamente</li>
                                    <li>Los enlaces antiguos con tu código ya no funcionarán</li>
                                    <li>Debes actualizar todos los lugares donde compartiste tu código</li>
                                    <li><strong>NO podrás cambiarlo nuevamente</strong></li>
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
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleChange}
                                disabled={isSaving}
                                className={styles.confirmButton}
                            >
                                {isSaving ? (
                                    <>
                                        <span className={styles.spinnerSmall}></span>
                                        Cambiando...
                                    </>
                                ) : (
                                    'Sí, cambiar mi código'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
