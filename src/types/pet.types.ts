/**
 * Tipos TypeScript para el módulo de registro de mascotas
 */

// Datos de una mascota
export interface PetFormData {
    // Información básica
    name: string;
    lastName: string;
    petType: 'perro' | 'gato' | string;
    isMixed: boolean;
    breed: string;
    breedSize: 'pequeño' | 'mediano' | 'grande' | 'gigante' | string;

    // Edad
    age: string;
    exceedsMaxAge: boolean;
    vetCertificate?: File | null;

    // Adopción
    isAdopted: boolean;
    adoptionStory?: string;

    // Documentos
    photos?: File[];
    ruac: string;

    // URLs de archivos (cuando ya están subidos)
    photo1Url?: string;
    photo2Url?: string;
    vetCertificateUrl?: string;

    // Tracking (calculado automáticamente)
    isOriginal: boolean;
    waitingPeriodDays: number;
    waitingPeriodEnd: string;
    registrationDate: string;
    isActive: boolean;
    replacedDate: string;
}

// Datos del formulario completo (hasta 3 mascotas)
export interface PetRegistrationData {
    pets: PetFormData[];
    ambassadorCode: string;
    totalPets: number;
}

// Información de una raza
export interface Breed {
    id: string;
    name: string;
    type: 'perro' | 'gato';
    hasGeneticIssues: boolean;
    warningMessage?: string;
    maxAge: number;
}

// Respuesta del servicio de mascotas
export interface PetServiceResponse {
    success: boolean;
    error?: string;
    petIds?: string[];
}

// Cálculo de período de carencia
export interface WaitingPeriodCalculation {
    days: number;
    months: number;
    endDate: string;
    hasReduction: boolean;
    reductionReason?: 'adopted' | 'ruac' | 'both';
}

// Props para componentes
export interface PetCardProps {
    petIndex: number;
    petData: Partial<PetFormData>;
    onUpdate: (data: Partial<PetFormData>) => void;
    onRemove: () => void;
    errors: Record<string, string>;
    canRemove: boolean;
}

export interface BreedAutocompleteProps {
    label: string;
    name: string;
    petType: 'perro' | 'gato';
    value: string;
    onChange: (value: string, hasWarning: boolean, warningMessage?: string, maxAge?: number) => void;
    error?: string;
    required?: boolean;
}

export interface SelectWithInfoProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    infoText: string;
    error?: string;
    required?: boolean;
}

// ===== DASHBOARD TYPES =====

// Datos de mascota para el dashboard (extiende PetFormData)
export interface DashboardPetData extends PetFormData {
    position: 1 | 2 | 3; // Posición en el array (pet-1, pet-2, pet-3)
    daysUntilActive: number; // Días restantes de carencia
    canBeReplaced: boolean; // Si puede ser reemplazada
}

// Información del usuario para el dashboard
export interface UserInfo {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    registrationDate: string;
    waitingPeriodEnd: string;
}

// Datos completos del dashboard del usuario
export interface UserDashboardData {
    userInfo: UserInfo;
    activePets: DashboardPetData[];
    inactivePets: DashboardPetData[];
    canAddMorePets: boolean;
    maxPets: number;
}
