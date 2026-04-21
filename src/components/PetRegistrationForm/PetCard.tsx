/**
 * Componente de Tarjeta Individual de Mascota
 * Formulario para una sola mascota con todos sus campos
 */

'use client';

import React, { useState, useEffect } from 'react';
import TextInput from '@/components/FormFields/TextInput';
import RadioGroup from '@/components/FormFields/RadioGroup';
import FileUpload from '@/components/FormFields/FileUpload';
import BreedAutocomplete from '@/components/FormFields/BreedAutocomplete';
import SelectWithInfo from '@/components/FormFields/SelectWithInfo';
import TextArea from '@/components/FormFields/TextArea';
import ColorAutocomplete from '@/components/FormFields/ColorAutocomplete';
import type { PetFormData } from '@/types/pet.types';
import styles from './PetCard.module.css';

interface PetCardProps {
    petIndex: number;
    petData: Partial<PetFormData>;
    onUpdate: (data: Partial<PetFormData>) => void;
    onRemove?: () => void;
    errors: Record<string, string>;
    canRemove: boolean;
}

export default function PetCard({
    petIndex,
    petData,
    onUpdate,
    onRemove,
    errors,
    canRemove,
}: PetCardProps) {
    const petNum = petIndex + 1;
    const [breedMaxAge, setBreedMaxAge] = useState<number | null>(null);
    const [showVetCertificate, setShowVetCertificate] = useState(false);

    // Opciones de edad (mínimo 4 meses)
    const ageOptions = [
        { value: '4-6-meses', label: '4-6 meses', numericAge: 0 },
        { value: '6-12-meses', label: '6-12 meses', numericAge: 0 },
        { value: '1-año', label: '1 año', numericAge: 1 },
        { value: '2-años', label: '2 años', numericAge: 2 },
        { value: '3-años', label: '3 años', numericAge: 3 },
        { value: '4-años', label: '4 años', numericAge: 4 },
        { value: '5-años', label: '5 años', numericAge: 5 },
        { value: '6-años', label: '6 años', numericAge: 6 },
        { value: '7-años', label: '7 años', numericAge: 7 },
        { value: '8-años', label: '8 años', numericAge: 8 },
        { value: '9-años', label: '9 años', numericAge: 9 },
        { value: '10-años', label: '10 años', numericAge: 10 },
        { value: '11-años', label: '11 años', numericAge: 11 },
        { value: '12-años', label: '12 años', numericAge: 12 },
        { value: '13-años', label: '13 años', numericAge: 13 },
        { value: '14-años', label: '14 años', numericAge: 14 },
        { value: '15+-años', label: '15+ años', numericAge: 15 },
    ];

    // Validar edad senior (Unificado a 10 años para todos)
    useEffect(() => {
        const ageNum = ageOptions.find(opt => opt.value === petData.age)?.numericAge || 0;
        const seniorThreshold = 10;
        const isSenior = ageNum >= seniorThreshold;

        if (isSenior && !petData.exceedsMaxAge) {
            setShowVetCertificate(true);
            onUpdate({ ...petData, exceedsMaxAge: true });
        } else if (!isSenior && petData.exceedsMaxAge) {
            setShowVetCertificate(false);
            onUpdate({ ...petData, exceedsMaxAge: false, vetCertificate: null });
        }
    }, [petData.age]);

    // Manejar cambio de raza
    const handleBreedChange = (
        value: string,
        hasWarning: boolean,
        warningMessage?: string,
        maxAge?: number
    ) => {
        setBreedMaxAge(maxAge || null);
        onUpdate({ ...petData, breed: value });
    };

    // Manejar cambio de edad
    const handleAgeChange = (value: string) => {
        onUpdate({ ...petData, age: value });
    };

    const petType = petData.petType === 'gato' ? 'gato' : 'perro';

    return (
        <div className={styles.petCard}>
            {/* Header con número de mascota */}
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Mascota {petNum}</h3>
                {canRemove && onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className={styles.removeButton}
                        aria-label="Eliminar mascota"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className={styles.columnsWrapper}>
                {/* Columna Izquierda */}
                <div className={styles.column}>
                    <TextInput
                        label={petType === 'gato' ? '¿Cómo se llama tu michi?' : '¿Cómo se llama tu peludo?'}
                        name={`pet-${petNum}-name`}
                        value={petData.name || ''}
                        onChange={(value) => onUpdate({ ...petData, name: value })}
                        placeholder="Max"
                        helpText="El nombre con el que le hablas cuando llega corriendo a saludarte"
                        error={errors[`pet-${petNum}-name`]}
                        required
                    />

                    <RadioGroup
                        label="¿Cuál es su sexo?"
                        name={`pet-${petNum}-gender`}
                        options={[
                            { value: 'macho', label: 'Macho ♂️' },
                            { value: 'hembra', label: 'Hembra ♀️' },
                        ]}
                        value={petData.gender || ''}
                        onChange={(value) => onUpdate({ ...petData, gender: value })}
                        error={errors[`pet-${petNum}-gender`]}
                        required
                    />

                    <RadioGroup
                        label="¿Qué tipo de peludo es?"
                        name={`pet-${petNum}-type`}
                        options={[
                            { value: 'perro', label: 'Perro' },
                            { value: 'gato', label: 'Gato' },
                        ]}
                        value={petData.petType || ''}
                        onChange={(value) => onUpdate({ ...petData, petType: value as 'perro' | 'gato' })}
                        error={errors[`pet-${petNum}-type`]}
                        required
                    />

                    <RadioGroup
                        label="¿De qué raza es tu peludo?"
                        name={`pet-${petNum}-mixed`}
                        options={[
                            { value: 'true', label: petData.petType === 'gato' ? 'Doméstico' : 'Mestizo' },
                            { value: 'false', label: 'Raza' },
                        ]}
                        value={petData.isMixedBreed?.toString() || ''}
                        onChange={(value) => {
                            const isMixed = value === 'true';
                            onUpdate({ 
                                ...petData, 
                                isMixedBreed: isMixed, 
                                breed: isMixed ? (petData.petType === 'gato' ? 'Doméstico' : 'Mestizo') : '' 
                            });
                        }}
                        helpText={petData.petType === 'gato' 
                            ? "El amor no tiene raza. Los domésticos son bienvenidos con los brazos abiertos"
                            : "El amor no tiene raza. Los mestizos son bienvenidos con los brazos abiertos"
                        }
                        error={errors[`pet-${petNum}-mixed`]}
                        required
                    />

                    {petData.petType && !petData.isMixedBreed && (
                        <BreedAutocomplete
                            label="🐕 Raza de tu peludo"
                            name={`pet-${petNum}-breed`}
                            petType={petType}
                            value={petData.breed || ''}
                            onChange={handleBreedChange}
                            error={errors[`pet-${petNum}-breed`]}
                            required
                        />
                    )}

                    <div className={styles.physicalAttributes}>
                        <ColorAutocomplete
                            label="Color de pelo"
                            name={`pet-${petNum}-coatColor`}
                            category="coat"
                            petType={petType}
                            value={petData.coatColor || ''}
                            onChange={(value) => onUpdate({ ...petData, coatColor: value })}
                            error={errors[`pet-${petNum}-coatColor`]}
                            required
                        />

                        <ColorAutocomplete
                            label="Color de nariz"
                            name={`pet-${petNum}-noseColor`}
                            category="nose"
                            petType={petType}
                            value={petData.noseColor || ''}
                            onChange={(value) => onUpdate({ ...petData, noseColor: value })}
                        />

                        <ColorAutocomplete
                            label="Color de ojos"
                            name={`pet-${petNum}-eyeColor`}
                            category="eye"
                            petType={petType}
                            value={petData.eyeColor || ''}
                            onChange={(value) => onUpdate({ ...petData, eyeColor: value })}
                        />
                    </div>

                    <RadioGroup
                        label="¿Tu peludo fue adoptado o rescatado?"
                        name={`pet-${petNum}-adopted`}
                        options={[
                            { value: 'true', label: 'Sí, lo adopté o rescaté' },
                            { value: 'false', label: 'No' },
                        ]}
                        value={petData.isAdopted?.toString() || ''}
                        onChange={(value) => onUpdate({ ...petData, isAdopted: value === 'true' })}
                        error={errors[`pet-${petNum}-adopted`]}
                        required
                    />

                    {petData.isAdopted && (
                        <div className={styles.adoptionStorySection}>
                            <TextArea
                                label="Cuéntanos su historia de adopción (opcional)"
                                name={`pet-${petNum}-adoption-story`}
                                value={petData.adoptionStory || ''}
                                onChange={(value) => onUpdate({ ...petData, adoptionStory: value })}
                                placeholder="Era un día lluvioso cuando lo encontramos..."
                                helpText="Tu historia puede inspirar a otros a adoptar."
                                error={errors[`pet-${petNum}-adoption-story`]}
                            />
                            <p className={styles.legalNotice} style={{ fontSize: '0.75rem', color: '#666', marginTop: '-1rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                                Al llenar la historia de adopción nos autorizas a incluirla en la página web y redes sociales de Club Pata Amiga.
                            </p>
                        </div>
                    )}
                </div>

                {/* Columna Derecha */}
                <div className={styles.column}>
                    <SelectWithInfo
                        label="¿Qué edad tiene?"
                        name={`pet-${petNum}-age`}
                        value={petData.age || ''}
                        onChange={handleAgeChange}
                        options={ageOptions}
                        error={errors[`pet-${petNum}-age`]}
                        required
                    />

                    {/* Campo condicional: Certificado veterinario */}
                    {showVetCertificate && (
                        <div className={styles.vetCertificateSection}>
                                <p className={styles.warningText}>
                                    Como es un peludito senior (10+ años), necesitamos conocer un poco más sobre su estado de salud actual para completar su registro. 🐾💙
                                </p>

                            <FileUpload
                                label="📋 Certificado Veterinario"
                                name={`pet-${petNum}-vet-certificate`}
                                accept=".pdf,.jpg,.jpeg,.png"
                                maxSize={5}
                                maxFiles={1}
                                instruction="Sube el certificado de salud de tu veterinario (PDF o imagen)"
                                onChange={(files) => onUpdate({ ...petData, vetCertificate: files[0] || null })}
                                error={errors[`pet-${petNum}-vet-certificate`]}
                                required
                            />
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <FileUpload
                            label="Muéstranos a tu peludo* ❤️"
                            name={`pet-${petNum}-photos`}
                            accept=".jpg,.jpeg,.png"
                            maxSize={5}
                            maxFiles={2}
                            instruction={petData.photo1Url && petData.photo2Url ? "Ya tienes fotos guardadas. Sube nuevas si deseas reemplazarlas." : "Es obligatorio subir una foto de Selfie contigo y tu mascota. Tienes hasta 15 días posteriores para subirla si no la tienes a la mano."}
                            onChange={(files) => onUpdate({ ...petData, photos: files })}
                            error={errors[`pet-${petNum}-photos`]}
                            required={!(petData.photo1Url || petData.photo1Url)}
                        />
                        {(petData.photo1Url || petData.photo2Url) && (
                            <div style={{ marginTop: '12px', padding: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px' }}>
                                <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                                    ✅ Fotos subidas previamente:
                                </p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {petData.photo1Url && <img src={petData.photo1Url} alt="Foto previa 1" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />}
                                    {petData.photo2Url && <img src={petData.photo2Url} alt="Foto previa 2" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
