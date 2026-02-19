'use client';

import React, { useState } from 'react';
import { AmbassadorStep1Data } from '@/types/ambassador.types';
import HelpSection from '@/components/UI/HelpSection';
import styles from './Step1PersonalInfo.module.css';

interface Step1Props {
    data: AmbassadorStep1Data;
    onChange: (field: keyof AmbassadorStep1Data, value: string | File | null) => void;
    errors: Partial<Record<keyof AmbassadorStep1Data, string>>;
    onFileUpload: (field: 'ine_front' | 'ine_back', file: File) => void;
    onBlur?: (field: keyof AmbassadorStep1Data) => void;
    onNext?: () => void;
    onBack?: () => void;
}

// Estados de Mexico
const ESTADOS_MEXICO = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de Mexico', 'Coahuila', 'Colima',
    'Durango', 'Estado de Mexico', 'Guanajuato', 'Guerrero', 'Hidalgo',
    'Jalisco', 'Michoacan', 'Morelos', 'Nayarit', 'Nuevo Leon', 'Oaxaca',
    'Puebla', 'Queretaro', 'Quintana Roo', 'San Luis Potosi', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatan', 'Zacatecas'
];

export default function Step1PersonalInfo({ data, onChange, errors, onFileUpload, onBlur, onNext, onBack }: Step1Props) {
    const [showPassword, setShowPassword] = useState(false);

    const handleFileChange = (field: 'ine_front' | 'ine_back') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(field, file);
        }
    };

    // Calc max date for 18 years old
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    const maxDateString = maxDate.toISOString().split('T')[0];

    return (
        <div className={styles.pageContainer}>
            {/* Subtitulo */}
            <div className={styles.landingSubtitle}>
                <h2>¡cuentanos sobre ti! futuro embajador 😉</h2>
                <p>Para formar parte de esta manada, necesitamos conocerte un poquito</p>
                <span className={styles.privacyNote}>Toda tu informacion es privada y se usa solo para fines de verificacion.</span>
            </div>

            {/* Formulario naranja */}
            <div className={styles.orangeFormBox}>
                {/* Badge icono verde */}
                <div className={styles.formBadge}>
                    <img 
                        src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1771516837/identification_logo_green_uppgsy.svg"
                        alt=""
                        width="85"
                        height="85"
                    />
                </div>

                {/* Grid del formulario */}
                <div className={styles.formGrid}>
                    {/* Columna izquierda */}
                    <div className={styles.formColumnInner}>
                        <input 
                            type="text" 
                            placeholder="Nombre(s)" 
                            className={`${styles.orangeInput} ${errors.first_name ? styles.error : ''}`}
                            value={data.first_name}
                            onChange={(e) => onChange('first_name', e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Apellido paterno" 
                            className={`${styles.orangeInput} ${errors.paternal_surname ? styles.error : ''}`}
                            value={data.paternal_surname}
                            onChange={(e) => onChange('paternal_surname', e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Apellido materno" 
                            className={styles.orangeInput}
                            value={data.maternal_surname}
                            onChange={(e) => onChange('maternal_surname', e.target.value)}
                        />
                        <span className={styles.inputHint}>Como aparece en tu identificacion oficial</span>

                        {/* Genero */}
                        <div className={styles.genderGroup}>
                            <label className={styles.groupLabel}>Como te identificas?</label>
                            <label className={styles.radioLabel}>
                                <input 
                                    type="radio" 
                                    name="gender" 
                                    value="male" 
                                    checked={data.gender === 'male'}
                                    onChange={(e) => onChange('gender', e.target.value)}
                                />
                                <span>Hombre</span>
                            </label>
                            <label className={styles.radioLabel}>
                                <input 
                                    type="radio" 
                                    name="gender" 
                                    value="female"
                                    checked={data.gender === 'female'}
                                    onChange={(e) => onChange('gender', e.target.value)}
                                />
                                <span>Mujer</span>
                            </label>
                            <label className={styles.radioLabel}>
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

                        {/* Fecha de nacimiento */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.groupLabel}>Fecha de nacimiento</label>
                            <input 
                                type="date" 
                                max={maxDateString}
                                className={`${styles.orangeInput} ${errors.birth_date ? styles.error : ''}`}
                                value={data.birth_date}
                                onChange={(e) => onChange('birth_date', e.target.value)}
                            />
                            <span className={styles.inputHint}>Debes ser mayor de 18 años para ser embajador</span>
                        </div>

                        {/* CURP */}
                        <div className={styles.fieldGroup}>
                            <input 
                                type="text" 
                                placeholder="CURP" 
                                maxLength={18}
                                className={`${styles.orangeInput} ${errors.curp ? styles.error : ''}`}
                                value={data.curp}
                                onChange={(e) => onChange('curp', e.target.value.toUpperCase())}
                                onBlur={() => onBlur?.('curp')}
                            />
                            <span className={styles.inputHint}>Lo necesitamos para cumplir con requisitos fiscales</span>
                        </div>
                    </div>

                    {/* Columna derecha */}
                    <div className={styles.formColumnInner}>
                        <div className={styles.fieldGroup}>
                            <input 
                                type="text" 
                                placeholder="Codigo postal" 
                                maxLength={5}
                                className={`${styles.orangeInput} ${errors.postal_code ? styles.error : ''}`}
                                value={data.postal_code}
                                onChange={(e) => onChange('postal_code', e.target.value)}
                            />
                            {errors.postal_code && <span className={styles.errorMessage}>{errors.postal_code}</span>}
                        </div>
                        <div className={styles.fieldGroup}>
                            <select 
                                className={`${styles.orangeSelect} ${errors.state ? styles.error : ''}`}
                                value={data.state}
                                onChange={(e) => onChange('state', e.target.value)}
                            >
                                <option value="">Estado</option>
                                {ESTADOS_MEXICO.map(estado => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </select>
                            {errors.state && <span className={styles.errorMessage}>{errors.state}</span>}
                        </div>
                        <div className={styles.fieldGroup}>
                            <input 
                                type="text" 
                                placeholder="Ciudad" 
                                className={`${styles.orangeInput} ${errors.city ? styles.error : ''}`}
                                value={data.city}
                                onChange={(e) => onChange('city', e.target.value)}
                            />
                            {errors.city && <span className={styles.errorMessage}>{errors.city}</span>}
                        </div>
                        <div className={styles.fieldGroup}>
                            <input 
                                type="text" 
                                placeholder="Colonia" 
                                className={`${styles.orangeInput} ${errors.neighborhood ? styles.error : ''}`}
                                value={data.neighborhood}
                                onChange={(e) => onChange('neighborhood', e.target.value)}
                            />
                            {errors.neighborhood && <span className={styles.errorMessage}>{errors.neighborhood}</span>}
                        </div>
                        <div className={styles.fieldGroup}>
                            <input 
                                type="text" 
                                placeholder="Calle y numero (int y ext)" 
                                className={styles.orangeInput}
                                value={data.address}
                                onChange={(e) => onChange('address', e.target.value)}
                            />
                            <span className={styles.inputHint}>Queremos conocer de donde vienes</span>
                        </div>

                        {/* Email */}
                        <div className={styles.fieldGroup}>
                            <input 
                                type="email" 
                                placeholder="Correo electronico" 
                                className={`${styles.orangeInput} ${errors.email ? styles.error : ''}`}
                                value={data.email}
                                onChange={(e) => onChange('email', e.target.value)}
                                onBlur={() => onBlur?.('email')}
                            />
                            <span className={styles.inputHint}>Aqui te enviaremos noticias de tu peludo y de la comunidad</span>
                        </div>

                        {/* Contrasena */}
                        <div className={styles.fieldGroup}>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Contrasena" 
                                    className={`${styles.orangeInput} ${errors.password ? styles.error : ''}`}
                                    value={data.password}
                                    onChange={(e) => onChange('password', e.target.value)}
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.eyeButton}
                                    title={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                                >
                                    {showPassword ? '👁️' : '🙈'}
                                </button>
                            </div>
                            {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                            <span className={styles.inputHint}>Minimo 8 caracteres</span>
                        </div>

                        {/* Confirmar Contrasena */}
                        <div className={styles.fieldGroup}>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Confirmar contrasena" 
                                    className={`${styles.orangeInput} ${errors.confirm_password ? styles.error : ''}`}
                                    value={data.confirm_password}
                                    onChange={(e) => onChange('confirm_password', e.target.value)}
                                    style={{ paddingRight: '40px' }}
                                />
                            </div>
                            {errors.confirm_password && <span className={styles.errorMessage}>{errors.confirm_password}</span>}
                        </div>

                        {/* Telefono */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.groupLabel}>Numero de telefono</label>
                            <div className={styles.phoneWrapper}>
                                <span className={styles.countryCode}>MX 52</span>
                                <input 
                                    type="tel" 
                                    placeholder="123 123 1234" 
                                    maxLength={10}
                                    className={`${styles.orangeInput} ${errors.phone ? styles.error : ''}`}
                                    value={data.phone}
                                    onChange={(e) => onChange('phone', e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                            <span className={styles.inputHint}>Para comunicarnos cuando tengas dudas o buenas noticias sobre tus comisiones</span>
                        </div>
                    </div>
                </div>

                {/* Upload INE */}
                <div className={styles.uploadSection}>
                    <label className={styles.uploadLabel}>Sube tu INE por ambos lados</label>
                    <span className={styles.uploadHint}>Asegurate de que se vea claro y completa</span>
                    
                    <div className={styles.uploadGrid}>
                        {/* INE Frente */}
                        <div className={styles.uploadBox}>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange('ine_front')}
                                style={{ display: 'none' }}
                                id="ine-front"
                            />
                            <label htmlFor="ine-front" className={styles.uploadLabelArea}>
                                {data.ine_front ? (
                                    <div className={styles.fileSelected}>
                                        <div className={styles.uploadIcon}>✓</div>
                                        <div className={styles.uploadText}>
                                            <p className={styles.fileName}>{data.ine_front.name}</p>
                                            <span className={styles.fileStatus}>Frente seleccionado</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.uploadIcon}>⬆️</div>
                                        <div className={styles.uploadText}>
                                            <p><strong>Frente:</strong> Arrastra o <span>explora</span></p>
                                            <span>PDF, JPG o PNG - Max. 5MB</span>
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>

                        {/* INE Reverso */}
                        <div className={styles.uploadBox}>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange('ine_back')}
                                style={{ display: 'none' }}
                                id="ine-back"
                            />
                            <label htmlFor="ine-back" className={styles.uploadLabelArea}>
                                {data.ine_back ? (
                                    <div className={styles.fileSelected}>
                                        <div className={styles.uploadIcon}>✓</div>
                                        <div className={styles.uploadText}>
                                            <p className={styles.fileName}>{data.ine_back.name}</p>
                                            <span className={styles.fileStatus}>Reverso seleccionado</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.uploadIcon}>⬆️</div>
                                        <div className={styles.uploadText}>
                                            <p><strong>Reverso:</strong> Arrastra o <span>explora</span></p>
                                            <span>PDF, JPG o PNG - Max. 5MB</span>
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                    
                    {errors.ine_front && <span className={styles.uploadError}>{errors.ine_front}</span>}
                    {errors.ine_back && <span className={styles.uploadError}>{errors.ine_back}</span>}
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
                    <span className={styles.cancelIcon}>✕</span>
                </button>
                <button 
                    type="button" 
                    className={styles.nextButton}
                    onClick={onNext}
                >
                    Siguiente
                    <span className={styles.nextIcon}>→</span>
                </button>
            </div>

            {/* Help Section */}
            <HelpSection email="contacto@pataamiga.mx" />
        </div>
    );
}
