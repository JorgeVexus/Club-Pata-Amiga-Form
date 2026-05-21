import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import DatePicker from '@/components/FormFields/DatePicker';
import NationalitySelect from '../NationalitySelect';
import ColonyAutocomplete from '@/components/FormFields/ColonyAutocomplete';
import { checkCurpAvailability } from '@/app/actions/user.actions';
import { validateCURP, validateCurpMatchesData } from '@/utils/curp-validator';
import styles from './Step4CompleteProfile.module.css';
import { getCDMXAlcaldia } from '@/utils/postalCodeUtils';

interface Step4CompleteProfileProps {
    data: any;
    member: any;
    onNext: (data: any) => void;
    onBack?: () => void;
    showToast: (message: string, type?: 'error' | 'success' | 'warning') => void;
}

export default function Step4CompleteProfile({ data, member, onNext, showToast }: Step4CompleteProfileProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        paternalLastName: '',
        maternalLastName: '',
        birthDate: '',
        nationality: '',
        nationalityCode: '',
        phone: data?.account?.phone || '',
        email: member?.auth?.email || data?.account?.email || '',
        curp: '',
        postalCode: '',
        state: '',
        city: '',
        colony: '',
        ine_front_url: ''
    });
    const [passportFile, setPassportFile] = useState<File | null>(null);
    const [passportPreview, setPassportPreview] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCP, setIsLoadingCP] = useState(false);
    const [isCheckingCurp, setIsCheckingCurp] = useState(false);
    const [curpAvailable, setCurpAvailable] = useState<boolean | null>(null);
    const [curpCount, setCurpCount] = useState<number>(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [colonySuggestions, setColonySuggestions] = useState<string[]>([]);

    const verifyCurp = async (curp: string) => {
        const formatValidation = validateCURP(curp);
        if (!formatValidation.isValid) {
            setErrors(prev => ({ ...prev, curp: formatValidation.error || 'CURP inválida' }));
            setCurpAvailable(false);
            return;
        }

        const consistencyValidation = validateCurpMatchesData(curp, {
            firstName: formData.firstName,
            paternalLastName: formData.paternalLastName,
            maternalLastName: formData.maternalLastName,
            birthDate: formData.birthDate
        });

        if (!consistencyValidation.isConsistent) {
            setErrors(prev => ({ ...prev, curp: consistencyValidation.message || 'La CURP no coincide con tus datos' }));
            setCurpAvailable(false);
            showToast(consistencyValidation.message || 'La CURP no coincide con tus datos', 'warning');
            return;
        }

        setIsCheckingCurp(true);
        try {
            const currentMsId = member?.id || member?.memberId;
            const result = await checkCurpAvailability(curp, currentMsId);

            if (result.error) {
                console.error('Error verificando CURP:', result.error);
                return;
            }

            setCurpAvailable(result.available);
            setCurpCount(result.count || 0);

            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.curp;
                return newErrors;
            });
        } catch (error) {
            console.error('Catch verifyCurp:', error);
        } finally {
            setIsCheckingCurp(false);
        }
    };

    const handleCurpBlur = () => {
        if (formData.curp.length === 18) {
            verifyCurp(formData.curp);
        }
    };

    const fetchFromGoogle = async (cp: string) => {
        if (!window.google || !window.google.maps) return null;
        const geocoder = new window.google.maps.Geocoder();
        try {
            const response = await geocoder.geocode({
                address: cp,
                componentRestrictions: { country: 'MX' },
                language: 'es',
                region: 'mx'
            });

            if (response.results && response.results.length > 0) {
                const result = response.results[0];
                let state = '';
                let city = '';
                let colony = '';

                result.address_components.forEach((component: any) => {
                    if (component.types.includes('administrative_area_level_1')) {
                        state = component.long_name;
                    }
                });

                const isCDMXState =
                    state.toLowerCase().includes('ciudad de méxico') ||
                    state.toLowerCase().includes('mexico city') ||
                    state.toLowerCase() === 'distrito federal';

                if (isCDMXState) state = 'Ciudad de México';

                const components = result.address_components;
                const sublocality1 = components.find((c: any) => c.types.includes('sublocality_level_1'))?.long_name;
                const adminArea2 = components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name;
                const locality = components.find((c: any) => c.types.includes('locality'))?.long_name;

                if (isCDMXState) {
                    city = sublocality1 || adminArea2 || locality || '';
                    if (city.toLowerCase().includes('ciudad de méxico') ||
                        city.toLowerCase().includes('mexico city') ||
                        city.toLowerCase().includes('cdmx')) {
                        city = sublocality1 || adminArea2 || '';
                    }
                } else {
                    city = adminArea2 || locality || sublocality1 || '';
                }

                colony = components.find((c: any) =>
                    c.types.includes('neighborhood') ||
                    c.types.includes('sublocality') ||
                    c.types.includes('sublocality_level_2')
                )?.long_name || '';

                return { state, city, colony };
            }
        } catch (error) {
            console.error('Google Geocoding error:', error);
        }
        return null;
    };

    const fetchColoniesFromSepomex = async (cp: string) => {
        if (!cp || cp.length !== 5) return null;
        setIsLoadingCP(true);
        try {
            const response = await fetch(`/api/sepomex?cp=${cp}`);
            const result = await response.json();
            if (result.success) {
                setColonySuggestions(result.data.colonies || []);
                if (result.data.colonies?.length === 1) {
                    setFormData(prev => ({ ...prev, colony: result.data.colonies[0] }));
                }
                return result.data;
            }
        } catch (error) {
            console.error('Error SEPOMEX:', error);
        } finally {
            setIsLoadingCP(false);
        }
        return null;
    };

    useEffect(() => {
        if (data?.profile && !isLoaded) {
            const profile = data.profile;
            setFormData(prev => ({
                ...prev,
                firstName: profile.firstName || '',
                paternalLastName: profile.paternalLastName || '',
                maternalLastName: profile.maternalLastName || '',
                birthDate: profile.birthDate || '',
                nationality: profile.nationality || '',
                nationalityCode: profile.nationalityCode || '',
                email: profile.email || prev.email,
                curp: profile.curp || '',
                postalCode: profile.postalCode || '',
                state: profile.state || '',
                city: profile.city || '',
                colony: profile.colony || '',
                ine_front_url: profile.ine_front_url || '',
            }));
            setIsLoaded(true);

            if (profile.ine_front_url) {
                setPassportPreview(profile.ine_front_url);
            }

            if (profile.curp && profile.curp.length === 18) {
                verifyCurp(profile.curp);
            }
        }
    }, [data, isLoaded]);

    const handlePostalCodeQuery = async (cpValue?: string) => {
        const cp = cpValue || formData.postalCode;
        if (cp.length !== 5) return;

        setIsLoadingCP(true);
        try {
            const [googleData, sepomexData] = await Promise.all([
                fetchFromGoogle(cp),
                fetchColoniesFromSepomex(cp)
            ]);

            if (googleData || sepomexData) {
                setFormData(current => {
                    const finalState = googleData?.state || sepomexData?.state || current.state;
                    const localAlcaldia = getCDMXAlcaldia(cp);
                    const isCDMX = localAlcaldia || 
                                  finalState.toLowerCase().includes('ciudad de méxico') || 
                                  finalState.toLowerCase().includes('mexico city');
                    
                    let finalCity = localAlcaldia || googleData?.city;
                    
                    if (!finalCity || (isCDMX && !localAlcaldia && (
                        finalCity.toLowerCase().includes('ciudad de méxico') || 
                        finalCity.toLowerCase().includes('mexico city')
                    ))) {
                        finalCity = sepomexData?.municipality || finalCity || current.city;
                    }

                    return {
                        ...current,
                        state: finalState || '',
                        city: finalCity || '',
                        postalCode: cp,
                    };
                });
                showToast('Dirección encontrada', 'success');
            } else {
                showToast('No se encontró información para este CP', 'warning');
            }
        } catch (error) {
            console.error('Error consultando CP:', error);
            showToast('Error al consultar dirección', 'error');
        } finally {
            setIsLoadingCP(false);
        }
    };

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'Requerido';
        if (!formData.paternalLastName.trim()) newErrors.paternalLastName = 'Requerido';
        if (!formData.maternalLastName.trim()) newErrors.maternalLastName = 'Requerido';

        if (!formData.birthDate) {
            newErrors.birthDate = 'Requerido';
        } else {
            const age = calculateAge(formData.birthDate);
            if (age < 18) {
                newErrors.birthDate = 'Debes ser mayor de 18 años';
            }
        }

        if (!formData.nationality) newErrors.nationality = 'Requerido';

        if (formData.nationality === 'Mexicana' || formData.nationality === 'México' || formData.nationality === 'Mexico') {
            if (!formData.curp || formData.curp.length !== 18) newErrors.curp = 'CURP inválida';
        } else if (formData.nationality) {
            if (!passportFile && !formData.ine_front_url) {
                newErrors.passport = 'Debes subir tu pasaporte';
            }
        }

        if (!formData.postalCode || formData.postalCode.length !== 5) newErrors.postalCode = 'CP inválido';
        if (!formData.city.trim()) newErrors.city = 'Requerido';
        if (!formData.colony.trim()) newErrors.colony = 'Requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Completa todos los campos requeridos', 'error');
            return;
        }

        setIsLoading(true);

        try {
            let passportUrl = formData.ine_front_url;

            if (passportFile && formData.nationality !== 'Mexicana' && formData.nationality !== 'México' && formData.nationality !== 'Mexico') {
                const msId = member?.id || member?.memberId;
                const uploadFormData = new FormData();
                uploadFormData.append('file', passportFile);
                uploadFormData.append('userId', msId);

                const response = await fetch('/api/upload/pet-photo', {
                    method: 'POST',
                    body: uploadFormData
                });
                const result = await response.json();
                if (result.success) {
                    passportUrl = result.url;
                } else {
                    throw new Error('Error al subir el pasaporte');
                }
            }

            const dataToSubmit = {
                ...formData,
                phone: formData.phone,
                ine_front_url: passportUrl
            };

            await onNext(dataToSubmit);
        } catch (error: any) {
            console.error('Error in Step 4 handleSubmit:', error);
            showToast(error.message || 'Error al guardar los datos', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.containerCenter}>
            <div className={styles.pageBackground} />
            
            <div className={styles.formCard}>
                {/* Barra superior de progreso técnica */}
                <div className={styles.topProgressBar}>
                    <div className={styles.topProgressBarFill} style={{ width: '50%' }} />
                </div>

                {/* Badge de paso */}
                <div className={styles.stepBadge}>
                    <img
                        src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777695917/logo_pata_amiga_amarillo_i762ow.png"
                        alt="Club Pata Amiga Logo"
                        className={styles.stepBadgeLogo}
                    />
                    <div className={styles.stepBadgeText}>PASO 1 DE 2 (FINALIZA TU REGISTRO)</div>
                    <div className={styles.stepBadgeIcon} aria-hidden="true" />
                </div>

                <div className={styles.formHeader}>
                    <h2 className={styles.formTitle}>Completa tu perfil</h2>
                    <p className={styles.formSubtitle}>
                        Necesitamos estos datos para activar tu membresía
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.formBody}>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Datos personales</h3>

                        <TextInput
                            label="Nombre"
                            name="firstName"
                            value={formData.firstName}
                            onChange={(value) => setFormData({ ...formData, firstName: value })}
                            error={errors.firstName}
                            required
                        />

                        <TextInput
                            label="Apellido paterno"
                            name="paternalLastName"
                            value={formData.paternalLastName}
                            onChange={(value) => setFormData({ ...formData, paternalLastName: value })}
                            error={errors.paternalLastName}
                            required
                        />

                        <TextInput
                            label="Apellido materno"
                            name="maternalLastName"
                            value={formData.maternalLastName}
                            onChange={(value) => setFormData({ ...formData, maternalLastName: value })}
                            error={errors.maternalLastName}
                            required
                        />

                        <DatePicker
                            label="Fecha de nacimiento"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={(value) => {
                                setFormData({ ...formData, birthDate: value });
                                if (value) {
                                    const age = calculateAge(value);
                                    if (age < 18) {
                                        setErrors(prev => ({ ...prev, birthDate: 'Debes ser mayor de 18 años' }));
                                        showToast('Debes ser mayor de 18 años para registrarte', 'error');
                                    } else {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.birthDate;
                                            return newErrors;
                                        });
                                    }
                                }
                            }}
                            error={errors.birthDate}
                            required
                        />

                        <NationalitySelect
                            value={formData.nationality}
                            onChange={(value, code) => setFormData({
                                ...formData,
                                nationality: value,
                                nationalityCode: code
                            })}
                            error={errors.nationality}
                            required
                        />

                        {formData.nationality === 'Mexicana' || formData.nationality === 'México' || formData.nationality === 'Mexico' ? (
                            <div className={styles.curpRow}>
                                <TextInput
                                    label="CURP"
                                    name="curp"
                                    value={formData.curp}
                                    onChange={(value) => {
                                        const sanitized = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 18);
                                        setFormData({ ...formData, curp: sanitized });
                                        if (sanitized.length === 18) {
                                            verifyCurp(sanitized);
                                        } else {
                                            setCurpAvailable(null);
                                            setCurpCount(0);
                                            if (errors.curp) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.curp;
                                                    return newErrors;
                                                });
                                            }
                                        }
                                    }}
                                    onBlur={handleCurpBlur}
                                    placeholder="ABCD123456HDFRNN09"
                                    error={errors.curp}
                                    required
                                    maxLength={18}
                                    disabled={isCheckingCurp}
                                />
                                {isCheckingCurp && (
                                    <span className={styles.inputIndicator}>Verificando...</span>
                                )}
                                {curpAvailable && formData.curp.length === 18 && !isCheckingCurp && (
                                    <span className={styles.inputIndicatorSuccess}>✓ Disponible</span>
                                )}
                                {!curpAvailable && curpCount > 0 && formData.curp.length === 18 && !isCheckingCurp && (
                                    <div className={styles.curpWarningMessage}>
                                        ⚠️ CURP ya registrada en {curpCount === 1 ? 'otra cuenta' : `${curpCount} cuentas`}. 
                                        Si es tuya, puedes continuar sin problemas.
                                    </div>
                                )}
                            </div>
                        ) : formData.nationality ? (
                            <div className={styles.passportUploadSection}>
                                <label className={styles.fieldLabel}>
                                    Pasaporte (Requerido para extranjeros) <span className={styles.required}>*</span>
                                </label>
                                <label className={styles.fileUploadLabel}>
                                    <input
                                        type="file"
                                        className={styles.fileInput}
                                        accept="image/*,application/pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setPassportFile(file);
                                                if (file.type.startsWith('image/')) {
                                                    setPassportPreview(URL.createObjectURL(file));
                                                } else {
                                                    setPassportPreview('');
                                                }
                                            }
                                        }}
                                    />
                                    <div className={`${styles.fileUploadBox} ${errors.passport ? styles.errorBorder : ''}`}>
                                        {passportPreview ? (
                                            <div className={styles.previewContainer}>
                                                <img src={passportPreview} alt="Passport Preview" className={styles.previewImage} />
                                                <span className={styles.changeLabel}>Cambiar pasaporte</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className={styles.fileIcon}>📄</span>
                                                <span className={styles.uploadText}>
                                                    {passportFile ? passportFile.name : 'Haz clic para subir tu pasaporte'}
                                                </span>
                                                <span className={styles.helpText}>JPG, PNG o PDF (Máx. 5MB)</span>
                                            </>
                                        )}
                                    </div>
                                </label>
                                {errors.passport && <span className={styles.errorText}>{errors.passport}</span>}
                            </div>
                        ) : null}
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Contacto</h3>

<TextInput
                            label="Correo electrónico"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={(value) => setFormData({ ...formData, email: value })}
                            error={errors.email}
                            required
                            readOnly
                        />
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Dirección</h3>

                        <div className={styles.postalCodeRow}>
                            <TextInput
                                label="Código Postal"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={(value) => {
                                    const cleaned = value.replace(/\D/g, '').slice(0, 5);
                                    setFormData({ ...formData, postalCode: cleaned });
                                    if (cleaned.length === 5) {
                                        handlePostalCodeQuery(cleaned);
                                    }
                                }}
                                onBlur={() => handlePostalCodeQuery()}
                                error={errors.postalCode}
                                required
                                maxLength={5}
                                disabled={isLoadingCP}
                            />
                            {isLoadingCP && (
                                <span className={styles.cpLoadingIndicator}>Consultando...</span>
                            )}
                        </div>

                        <TextInput
                            label="Estado"
                            name="state"
                            value={formData.state}
                            readOnly
                        />

                        <TextInput
                            label="Municipio/Alcaldía"
                            name="city"
                            value={formData.city}
                            onChange={(value) => setFormData({ ...formData, city: value })}
                            error={errors.city}
                            required
                        />

                        <ColonyAutocomplete
                            label="Colonia"
                            name="colony"
                            value={formData.colony}
                            suggestions={colonySuggestions}
                            onChange={(value) => setFormData({ ...formData, colony: value })}
                            error={errors.colony}
                            required
                            isLoading={isLoadingCP}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Guardando...' : 'Continuar →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
