'use client';

import React from 'react';
import { AmbassadorStep3Data, PaymentMethod } from '@/types/ambassador.types';
import styles from './AmbassadorForm.module.css';

interface Step3Props {
    data: AmbassadorStep3Data;
    onChange: (field: keyof AmbassadorStep3Data, value: string | boolean) => void;
    errors: Partial<Record<keyof AmbassadorStep3Data, string>>;
    onBlur?: (field: keyof AmbassadorStep3Data) => void;
}

export default function Step3BankingInfo({ data, onChange, errors, onBlur }: Step3Props) {

    const handlePaymentMethod = (method: PaymentMethod) => {
        onChange('payment_method', method);
    };

    return (
        <div>
            <div className={styles['ambassador-form-title']}>
                <h2>🏦 Datos bancarios y RFC</h2>
            </div>

            {/* RFC */}
            <div className={styles['ambassador-field']}>
                <label>Ingrese su RFC *</label>
                <input
                    type="text"
                    value={data.rfc}
                    onChange={(e) => onChange('rfc', e.target.value.toUpperCase())}
                    placeholder="Ejem. ABCD123456EFG"
                    maxLength={13}
                    className={errors.rfc ? styles.error : ''}
                    onBlur={() => onBlur?.('rfc')}
                />
                <span className={styles['helper-text']}>Requerido para emitir tus comprobantes fiscales</span>
                {errors.rfc && <span className={styles['error-message']}>{errors.rfc}</span>}
            </div>

            {/* Datos bancarios */}
            <div className={styles['ambassador-field']} style={{ marginTop: '30px' }}>
                <label>💰 Datos bancarios</label>
                <p className={styles['helper-text']}>Elige dónde quieres recibir tus comisiones</p>

                <div className={styles['ambassador-payment-options']}>
                    {/* Tarjeta de débito */}
                    <div
                        className={`${styles['ambassador-payment-card']} ${data.payment_method === 'card' ? styles.selected : ''}`}
                        onClick={() => handlePaymentMethod('card')}
                    >
                        <div className="icon">💳</div>
                        <div className="title">Agregar tarjeta</div>
                        <div className="subtitle">Tarjeta de débito</div>
                    </div>

                    {/* CLABE */}
                    <div
                        className={`${styles['ambassador-payment-card']} ${data.payment_method === 'clabe' ? styles.selected : ''}`}
                        onClick={() => handlePaymentMethod('clabe')}
                    >
                        <div className="icon">🏦</div>
                        <div className="title">Ingresar cuenta</div>
                        <div className="subtitle">CLABE o tarjeta nueva</div>
                    </div>

                    {/* Agregar después */}
                    <div
                        className={`${styles['ambassador-payment-card']} ${data.payment_method === 'pending' ? styles.selected : ''}`}
                        onClick={() => handlePaymentMethod('pending')}
                    >
                        <div className="icon">⏰</div>
                        <div className="title">Agregar después</div>
                        <div className="subtitle">Completar al ser aprobado</div>
                    </div>
                </div>
            </div>

            {/* Campos adicionales según método de pago */}
            {data.payment_method === 'card' && (
                <div className={styles['ambassador-form-grid']} style={{ marginTop: '20px' }}>
                    <div className={styles['ambassador-field']}>
                        <label>Banco</label>
                        <select
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
                    <div className={styles['ambassador-field']}>
                        <label>Número de tarjeta (últimos 4 dígitos)</label>
                        <input
                            type="text"
                            value={data.card_number}
                            onChange={(e) => onChange('card_number', e.target.value.replace(/\D/g, ''))}
                            placeholder="**** **** **** 1234"
                            maxLength={4}
                        />
                        <span className={styles['helper-text']}>Solo guardamos los últimos 4 dígitos por seguridad</span>
                    </div>
                </div>
            )}

            {data.payment_method === 'clabe' && (
                <div className={styles['ambassador-form-grid']} style={{ marginTop: '20px' }}>
                    <div className={styles['ambassador-field']}>
                        <label>Banco</label>
                        <select
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
                    <div className={styles['ambassador-field']}>
                        <label>CLABE interbancaria</label>
                        <input
                            type="text"
                            value={data.clabe}
                            onChange={(e) => onChange('clabe', e.target.value.replace(/\D/g, ''))}
                            placeholder="18 dígitos"
                            maxLength={18}
                            className={errors.clabe ? styles.error : ''}
                        />
                        {errors.clabe && <span className={styles['error-message']}>{errors.clabe}</span>}
                    </div>
                </div>
            )}

            {/* Términos y condiciones */}
            <div className={styles['ambassador-terms']}>
                <p>
                    Antes de continuar, es importante que sepas que como embajador recibirás un código personal único,
                    ganarás comisiones por cada miembro activo que se una con tu código y recibirás tus pagos de forma
                    mensual por depósito bancario; podrás promocionar libremente en redes, con tus conocidos o donde prefieras,
                    y contarás con materiales digitales y apoyo constante, siempre representando los valores de la manada:
                    amor, empatía y responsabilidad. No se permiten prácticas engañosas, información falsa, spam, promesas
                    que no podemos cumplir ni competencia desleal; esta comunidad se cuida y el no respetar estos principios
                    implica que no podrás continuar como embajador.
                </p>

                <p><strong>Para ser embajador, necesitas leer y aceptar:</strong></p>

                <label>
                    <input
                        type="checkbox"
                        checked={data.accept_terms}
                        onChange={(e) => onChange('accept_terms', e.target.checked)}
                    />
                    <span>
                        Acepto los <a href="/terminos" target="_blank">términos y condiciones</a>,
                        <a href="/anti-fraude" target="_blank"> política anti-fraude</a> y
                        <a href="/privacidad" target="_blank"> aviso de privacidad</a>
                    </span>
                </label>
                {errors.accept_terms && (
                    <span className={styles['error-message']} style={{ marginTop: '10px', display: 'block' }}>
                        {errors.accept_terms}
                    </span>
                )}
            </div>
        </div>
    );
}
