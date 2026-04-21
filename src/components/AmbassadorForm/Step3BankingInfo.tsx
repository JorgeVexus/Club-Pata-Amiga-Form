'use client';

import React, { useState } from 'react';
import { AmbassadorStep3Data, PaymentMethod } from '@/types/ambassador.types';
import { validateRFC } from '@/utils/rfc-validator';
import HelpSection from '@/components/UI/HelpSection';
import TermsModal from './TermsModal';
import styles from './Step3BankingInfo.module.css';

interface Step3Props {
    data: AmbassadorStep3Data;
    onChange: (field: keyof AmbassadorStep3Data, value: string | boolean) => void;
    errors: Partial<Record<keyof AmbassadorStep3Data, string>>;
    onBlur?: (field: keyof AmbassadorStep3Data) => void;
    onBack?: () => void;
    onNext?: () => void;
    isSubmitting?: boolean;
}

export default function Step3BankingInfo({ data, onChange, errors, onBlur, onBack, onNext, isSubmitting }: Step3Props) {
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handlePaymentMethod = (method: PaymentMethod) => {
        onChange('payment_method', method);
    };

    return (
        <div className={styles.pageContainer}>
            {/* Subtítulo */}
            <div className={styles.landingSubtitle}>
                <h2>datos bancarios y rfc</h2>
                <p>Ingresa tu información fiscal y bancaria para recibir tus comisiones</p>
                <span className={styles.privacyNote}>Tu información está protegida y solo se usa para fines de pago.</span>
            </div>

            {/* Formulario naranja */}
            <div className={styles.orangeFormBox}>
                {/* Badge icono verde */}
                <div className={styles.formBadge}>
                    <img 
                        src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1771530744/tarejta_1_gpk1vd.svg"
                        alt=""
                        width="85"
                        height="85"
                    />
                </div>

                {/* RFC */}
                <div className={styles.fieldGroup}>
                    <label className={styles.groupLabel}>
                        Ingrese su RFC *
                        {data.rfc && !errors.rfc && (
                            <span className={styles.rfcTypeBadge}>
                                {validateRFC(data.rfc).type === 'physical' ? '👤 Persona Física' : '🏢 Persona Moral'}
                            </span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={data.rfc}
                        onChange={(e) => onChange('rfc', e.target.value)}
                        placeholder="Ejem. ABCD123456EFG"
                        maxLength={13}
                        className={`${styles.orangeInput} ${errors.rfc ? styles.error : ''}`}
                        onBlur={() => onBlur?.('rfc')}
                        style={{ 
                            textTransform: 'uppercase',
                            borderColor: errors.rfc ? '#E53E3E' : (data.rfc && !errors.rfc ? '#38A169' : '')
                        }}
                    />
                    {errors.rfc && <span className={styles.errorMessage}>{errors.rfc}</span>}
                    <span className={styles.inputHint}>Requerido para emitir tus comprobantes fiscales</span>
                </div>

                {/* Datos bancarios - Tarjetas de selección */}
                <div className={styles.bankingSection}>
                    <h3 className={styles.sectionTitle}>💰 Datos bancarios</h3>
                    <p className={styles.sectionSubtitle}>Elige dónde quieres recibir tus comisiones</p>

                    <div className={styles.paymentCards}>
                        {/* CLABE o tarjeta */}
                        <div 
                            className={`${styles.paymentCard} ${data.payment_method === 'clabe' ? styles.selected : ''}`}
                            onClick={() => handlePaymentMethod('clabe')}
                        >
                            <div className={styles.cardIconGreen}>💳</div>
                            <div className={styles.cardContent}>
                                <h4>CLABE o tarjeta nueva</h4>
                            </div>
                        </div>

                        {/* Agregar después */}
                        <div 
                            className={`${styles.paymentCard} ${data.payment_method === 'pending' ? styles.selected : ''}`}
                            onClick={() => handlePaymentMethod('pending')}
                        >
                            <div className={styles.cardIconPink}>⏰</div>
                            <div className={styles.cardContent}>
                                <h4>Agregar después</h4>
                                <p>Completar al ser aprobado</p>
                            </div>
                        </div>
                    </div>
                    {errors.payment_method && <span className={styles.errorMessage}>{errors.payment_method}</span>}
                </div>

                {/* Campos adicionales según método de pago */}
                {data.payment_method === 'clabe' && (
                    <div className={styles.bankingFields}>
                        <div className={styles.formGrid}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.groupLabel}>Banco</label>
                                <select
                                    className={styles.orangeSelect}
                                    value={data.bank_name}
                                    onChange={(e) => onChange('bank_name', e.target.value)}
                                >
                                    <option value="">Selecciona tu banco</option>
                                    <option value="BBVA">BBVA</option>
                                    <option value="Santander">Santander</option>
                                    <option value="Banorte">Banorte</option>
                                    <option value="HSBC">HSBC</option>
                                    <option value="Citibanamex">Citibanamex</option>
                                    <option value="Scotiabank">Scotiabank</option>
                                    <option value="Inbursa">Inbursa</option>
                                    <option value="Azteca">Banco Azteca</option>
                                    <option value="Nu">Nu</option>
                                    <option value="Hey">Hey Banco</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.groupLabel}>CLABE interbancaria</label>
                                <input
                                    type="text"
                                    value={data.clabe}
                                    onChange={(e) => onChange('clabe', e.target.value.replace(/\D/g, ''))}
                                    placeholder="18 dígitos"
                                    maxLength={18}
                                    className={`${styles.orangeInput} ${errors.clabe ? styles.error : ''}`}
                                />
                                {errors.clabe && <span className={styles.errorMessage}>{errors.clabe}</span>}
                            </div>
                        </div>
                        <div className={styles.formGrid} style={{ marginTop: '1rem' }}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.groupLabel}>Número de tarjeta (últimos 4 dígitos)</label>
                                <input
                                    type="text"
                                    value={data.card_number}
                                    onChange={(e) => onChange('card_number', e.target.value.replace(/\D/g, ''))}
                                    placeholder="**** **** **** 1234"
                                    maxLength={4}
                                    className={`${styles.orangeInput} ${errors.card_number ? styles.error : ''}`}
                                />
                                <span className={styles.inputHint}>Solo guardamos los últimos 4 dígitos por seguridad</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Recuadro verde de términos - FUERA del formulario naranja */}
            <div className={styles.termsBox}>
                <div className={styles.termsContent}>
                    <p className={styles.termsText}>
                        Antes de continuar, es importante que sepas que como embajador recibirás un código personal único,
                        ganarás comisiones por cada miembro activo que se una con tu código y recibirás tus pagos de forma
                        mensual por depósito bancario; podrás promocionar libremente en redes, con tus conocidos o donde prefieras,
                        y contarás con materiales digitales y apoyo constante, siempre representando los valores de la manada:
                        amor, empatía y responsabilidad. No se permiten prácticas engañosas, información falsa, spam, promesas
                        que no podemos cumplir ni competencia desleal; esta comunidad se cuida y el no respetar estos principios
                        implica que no podrás continuar como embajador.
                    </p>

                    {/* Enlace para ver documentos legales */}
                    <div className={styles.legalDocumentsSection}>
                        <button
                            type="button"
                            className={styles.viewDocumentsBtn}
                            onClick={() => setShowTermsModal(true)}
                        >
                            📋 Ver documentos legales y términos
                        </button>
                        <p className={styles.legalHint}>
                            Revisa los términos y condiciones, política anti-fraude y aviso de privacidad
                        </p>
                    </div>

                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={data.accept_terms}
                                onChange={(e) => onChange('accept_terms', e.target.checked)}
                            />
                            <span>
                                He leído y acepto los{' '}
                                <button
                                    type="button"
                                    className={styles.inlineLink}
                                    onClick={() => setShowTermsModal(true)}
                                >
                                    términos y condiciones, política anti-fraude y aviso de privacidad
                                </button>
                            </span>
                        </label>
                        {errors.accept_terms && (
                            <span className={styles.errorMessage}>{errors.accept_terms}</span>
                        )}

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={data.accept_communications || false}
                                onChange={(e) => onChange('accept_communications', e.target.checked)}
                            />
                            <span>
                                Acepto recibir comunicaciones sobre el programa de embajadores. Capacitaciones, actualizaciones y tips para crecer tus comisiones
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div className={styles.buttonsRow}>
                <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={onBack}
                >
                    Cancelar
                </button>
                <div className={styles.navButtons}>
                    <button 
                        type="button" 
                        className={styles.backButton}
                        onClick={onBack}
                    >
                        <span className={styles.btnIconCircle}>←</span>
                        Anterior
                    </button>
                    <button 
                        type="button" 
                        className={styles.nextButton}
                        onClick={onNext}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className={styles.spinner}></span>
                                Enviando...
                            </>
                        ) : (
                            <>
                                Enviar solicitud
                                <span className={styles.btnIconCircleWhite}>→</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Help Section */}
            <HelpSection email="contacto@pataamiga.mx" />

            {/* Terms Modal */}
            <TermsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
            />
        </div>
    );
}
