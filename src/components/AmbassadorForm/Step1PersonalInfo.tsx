'use client';

import React from 'react';
import { AmbassadorStep1Data } from '@/types/ambassador.types';
import styles from './AmbassadorForm.module.css';

interface Step1Props {
    data: AmbassadorStep1Data;
    onChange: (field: keyof AmbassadorStep1Data, value: string | File | null) => void;
    errors: Partial<Record<keyof AmbassadorStep1Data, string>>;
    onFileUpload: (field: 'ine_front' | 'ine_back', file: File) => void;
}

// Estados de México
const ESTADOS_MEXICO = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
    'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
    'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
    'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

export default function Step1PersonalInfo({ data, onChange, errors, onFileUpload }: Step1Props) {

    const handleFileChange = (field: 'ine_front' | 'ine_back') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(field, file);
        }
    };

    return (
        <div>
            <div className={styles['ambassador-form-title']}>
                <h2>¡Cuéntanos sobre ti! Futuro Embajador 🐾</h2>
                <p>Para formar parte de esta manada, necesitamos conocerte un poquito</p>
                <div className={styles['ambassador-form-subtitle']}>
                    <span>🔒</span>
                    <span>Toda tu información es privada y se usa solo para fines de verificación.</span>
                </div>
            </div>

            <div className={styles['ambassador-form-grid']}>
                {/* Nombre */}
                <div className={styles['ambassador-field']}>
                    <label>Nombre(s) *</label>
                    <input
                        type="text"
                        value={data.first_name}
                        onChange={(e) => onChange('first_name', e.target.value)}
                        placeholder="Nombre(s)"
                        className={errors.first_name ? styles.error : ''}
                    />
                    {errors.first_name && <span className={styles['error-message']}>{errors.first_name}</span>}
                </div>

                {/* Código Postal */}
                <div className={styles['ambassador-field']}>
                    <label>Código postal *</label>
                    <input
                        type="text"
                        value={data.postal_code}
                        onChange={(e) => onChange('postal_code', e.target.value)}
                        placeholder="Código postal"
                        maxLength={5}
                        className={errors.postal_code ? styles.error : ''}
                    />
                    {errors.postal_code && <span className={styles['error-message']}>{errors.postal_code}</span>}
                </div>

                {/* Apellido Paterno */}
                <div className={styles['ambassador-field']}>
                    <label>Apellido paterno *</label>
                    <input
                        type="text"
                        value={data.paternal_surname}
                        onChange={(e) => onChange('paternal_surname', e.target.value)}
                        placeholder="Apellido paterno"
                        className={errors.paternal_surname ? styles.error : ''}
                    />
                    {errors.paternal_surname && <span className={styles['error-message']}>{errors.paternal_surname}</span>}
                </div>

                {/* Estado */}
                <div className={styles['ambassador-field']}>
                    <label>Estado *</label>
                    <select
                        value={data.state}
                        onChange={(e) => onChange('state', e.target.value)}
                        className={errors.state ? styles.error : ''}
                    >
                        <option value="">Selecciona un estado</option>
                        {ESTADOS_MEXICO.map(estado => (
                            <option key={estado} value={estado}>{estado}</option>
                        ))}
                    </select>
                    {errors.state && <span className={styles['error-message']}>{errors.state}</span>}
                </div>

                {/* Apellido Materno */}
                <div className={styles['ambassador-field']}>
                    <label>Apellido materno</label>
                    <input
                        type="text"
                        value={data.maternal_surname}
                        onChange={(e) => onChange('maternal_surname', e.target.value)}
                        placeholder="Apellido materno"
                    />
                </div>

                {/* Ciudad */}
                <div className={styles['ambassador-field']}>
                    <label>Ciudad *</label>
                    <input
                        type="text"
                        value={data.city}
                        onChange={(e) => onChange('city', e.target.value)}
                        placeholder="Ciudad"
                        className={errors.city ? styles.error : ''}
                    />
                    {errors.city && <span className={styles['error-message']}>{errors.city}</span>}
                </div>

                {/* Género */}
                <div className={styles['ambassador-field']}>
                    <label>¿Cómo te identificas?</label>
                    <div className={styles['ambassador-radio-group']}>
                        <label className={styles['ambassador-radio-option']}>
                            <input
                                type="radio"
                                name="gender"
                                value="male"
                                checked={data.gender === 'male'}
                                onChange={(e) => onChange('gender', e.target.value)}
                            />
                            <span>Hombre</span>
                        </label>
                        <label className={styles['ambassador-radio-option']}>
                            <input
                                type="radio"
                                name="gender"
                                value="female"
                                checked={data.gender === 'female'}
                                onChange={(e) => onChange('gender', e.target.value)}
                            />
                            <span>Mujer</span>
                        </label>
                        <label className={styles['ambassador-radio-option']}>
                            <input
                                type="radio"
                                name="gender"
                                value="not_specified"
                                checked={data.gender === 'not_specified'}
                                onChange={(e) => onChange('gender', e.target.value)}
                            />
                            <span>Prefiero no especificar</span>
                        </label>
                    </div>
                </div>

                {/* Colonia */}
                <div className={styles['ambassador-field']}>
                    <label>Colonia *</label>
                    <input
                        type="text"
                        value={data.neighborhood}
                        onChange={(e) => onChange('neighborhood', e.target.value)}
                        placeholder="Colonia"
                        className={errors.neighborhood ? styles.error : ''}
                    />
                    {errors.neighborhood && <span className={styles['error-message']}>{errors.neighborhood}</span>}
                </div>

                {/* Fecha de nacimiento */}
                <div className={styles['ambassador-field']}>
                    <label>Fecha de nacimiento *</label>
                    <input
                        type="date"
                        value={data.birth_date}
                        onChange={(e) => onChange('birth_date', e.target.value)}
                        className={errors.birth_date ? styles.error : ''}
                    />
                    <span className={styles['helper-text']}>Debes ser mayor de 18 años para ser embajador</span>
                    {errors.birth_date && <span className={styles['error-message']}>{errors.birth_date}</span>}
                </div>

                {/* Dirección */}
                <div className={styles['ambassador-field']}>
                    <label>Dirección</label>
                    <input
                        type="text"
                        value={data.address}
                        onChange={(e) => onChange('address', e.target.value)}
                        placeholder="Calle y número"
                    />
                    <span className={styles['helper-text']}>Queremos saber de dónde vienes</span>
                </div>

                {/* CURP */}
                <div className={styles['ambassador-field']}>
                    <label>CURP *</label>
                    <input
                        type="text"
                        value={data.curp}
                        onChange={(e) => onChange('curp', e.target.value.toUpperCase())}
                        placeholder="CURP"
                        maxLength={18}
                        className={errors.curp ? styles.error : ''}
                    />
                    <span className={styles['helper-text']}>Lo necesitamos para cumplir requisitos fiscales</span>
                    {errors.curp && <span className={styles['error-message']}>{errors.curp}</span>}
                </div>

                {/* Email */}
                <div className={styles['ambassador-field']}>
                    <label>Correo electrónico *</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        placeholder="tu@email.com"
                        className={errors.email ? styles.error : ''}
                    />
                    <span className={styles['helper-text']}>Aquí te enviaremos noticias de tu patudo y de la comunidad</span>
                    {errors.email && <span className={styles['error-message']}>{errors.email}</span>}
                </div>

                {/* INE Upload */}
                <div className={`${styles['ambassador-field']} ${styles['ambassador-form-full']}`}>
                    <label>Sube tu INE por ambos lados *</label>
                    <span className={styles['helper-text']}>Asegúrate de que se vea claro y completo</span>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                        {/* INE Frente */}
                        <label className={`${styles['ambassador-file-upload']} ${data.ine_front ? styles['has-file'] : ''}`}>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange('ine_front')}
                                style={{ display: 'none' }}
                            />
                            <div className={styles['ambassador-file-upload-icon']}>
                                {data.ine_front ? '✅' : '📄'}
                            </div>
                            <div className={styles['ambassador-file-upload-text']}>
                                {data.ine_front
                                    ? (data.ine_front as File).name
                                    : <>Frente del INE - <a>explorar</a></>
                                }
                            </div>
                        </label>

                        {/* INE Reverso */}
                        <label className={`${styles['ambassador-file-upload']} ${data.ine_back ? styles['has-file'] : ''}`}>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange('ine_back')}
                                style={{ display: 'none' }}
                            />
                            <div className={styles['ambassador-file-upload-icon']}>
                                {data.ine_back ? '✅' : '📄'}
                            </div>
                            <div className={styles['ambassador-file-upload-text']}>
                                {data.ine_back
                                    ? (data.ine_back as File).name
                                    : <>Reverso del INE - <a>explorar</a></>
                                }
                            </div>
                        </label>
                    </div>
                    <div className={styles['ambassador-file-upload-formats']}>
                        PDF, JPG o PNG - Máx. 5MB
                    </div>
                    {errors.ine_front && <span className={styles['error-message']}>{errors.ine_front}</span>}
                </div>

                {/* Contraseña */}
                <div className={styles['ambassador-field']}>
                    <label>Contraseña *</label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => onChange('password', e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className={errors.password ? styles.error : ''}
                    />
                    {errors.password && <span className={styles['error-message']}>{errors.password}</span>}
                </div>

                {/* Teléfono */}
                <div className={styles['ambassador-field']}>
                    <label>Número de teléfono *</label>
                    <div className={styles['ambassador-phone-input']}>
                        <div className="country-code">
                            🇲🇽 +52
                        </div>
                        <input
                            type="tel"
                            value={data.phone}
                            onChange={(e) => onChange('phone', e.target.value.replace(/\D/g, ''))}
                            placeholder="123 123 1234"
                            maxLength={10}
                            className={errors.phone ? styles.error : ''}
                        />
                    </div>
                    <span className={styles['helper-text']}>Para comunicarnos cuando sea importante. Sin spam, lo prometemos</span>
                    {errors.phone && <span className={styles['error-message']}>{errors.phone}</span>}
                </div>

                {/* Confirmar contraseña */}
                <div className={styles['ambassador-field']}>
                    <label>Confirmar contraseña *</label>
                    <input
                        type="password"
                        value={data.confirm_password}
                        onChange={(e) => onChange('confirm_password', e.target.value)}
                        placeholder="Repite tu contraseña"
                        className={errors.confirm_password ? styles.error : ''}
                    />
                    {errors.confirm_password && <span className={styles['error-message']}>{errors.confirm_password}</span>}
                </div>
            </div>
        </div>
    );
}
