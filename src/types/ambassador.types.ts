/**
 * 🎯 Tipos para el Sistema de Embajadores
 * Club Pata Amiga
 */

// ============================================
// EMBAJADOR
// ============================================

export type AmbassadorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type Gender = 'male' | 'female' | 'not_specified';
export type PaymentMethod = 'card' | 'clabe' | 'pending';

export interface Ambassador {
    id: string;
    ambassador_code: string; // Ej: "EMB-2024-001"
    
    // Datos personales
    first_name: string;
    paternal_surname: string;
    maternal_surname?: string;
    gender?: Gender;
    birth_date: string;
    curp: string;
    
    // INE
    ine_front_url?: string;
    ine_back_url?: string;
    
    // Dirección
    postal_code?: string;
    state?: string;
    city?: string;
    neighborhood?: string;
    address?: string;
    
    // Contacto
    email: string;
    phone?: string;
    
    // Redes sociales
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    other_social?: string;
    motivation?: string;
    
    // Datos bancarios
    rfc?: string;
    payment_method?: PaymentMethod;
    bank_name?: string;
    card_last_digits?: string;
    clabe?: string;
    
    // Código de referido
    referral_code: string; // Ej: "PATA-MARIA-2024"
    
    // Estado
    status: AmbassadorStatus;
    rejection_reason?: string;
    approved_at?: string;
    approved_by?: string;
    
    // Comisiones
    commission_percentage: number;
    total_earnings: number;
    pending_payout: number;
    
    // Vínculo con Memberstack (opcional)
    linked_memberstack_id?: string;
    
    // Timestamps
    created_at: string;
    updated_at: string;
    last_login_at?: string;
}

// Para la lista en el admin
export interface AmbassadorListItem {
    id: string;
    ambassador_code: string;
    first_name: string;
    paternal_surname: string;
    email: string;
    phone?: string;
    referral_code: string;
    status: AmbassadorStatus;
    total_earnings: number;
    pending_payout: number;
    referrals_count?: number;
    created_at: string;
}

// ============================================
// REFERIDOS
// ============================================

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface Referral {
    id: string;
    ambassador_id: string;
    referral_code: string;
    
    // Usuario referido
    referred_user_id: string;
    referred_user_name?: string;
    referred_user_email?: string;
    
    // Membresía
    membership_plan?: string;
    membership_amount: number;
    
    // Comisión
    commission_percentage: number;
    commission_amount: number;
    commission_status: CommissionStatus;
    
    paid_at?: string;
    payout_id?: string;
    
    created_at: string;
}

// Con datos del embajador (para admin)
export interface ReferralWithAmbassador extends Referral {
    ambassador?: {
        first_name: string;
        paternal_surname: string;
        referral_code: string;
    };
}

// ============================================
// PAGOS
// ============================================

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AmbassadorPayout {
    id: string;
    ambassador_id: string;
    
    amount: number;
    referrals_count: number;
    
    payment_method?: string;
    payment_reference?: string;
    
    status: PayoutStatus;
    
    processed_at?: string;
    processed_by?: string;
    
    notes?: string;
    
    period_start?: string;
    period_end?: string;
    
    created_at: string;
}

// Con datos del embajador
export interface PayoutWithAmbassador extends AmbassadorPayout {
    ambassador?: {
        first_name: string;
        paternal_surname: string;
        email: string;
        referral_code: string;
    };
}

// ============================================
// FORMULARIO DE REGISTRO (3 pasos)
// ============================================

// Paso 1: Datos personales
export interface AmbassadorStep1Data {
    first_name: string;
    paternal_surname: string;
    maternal_surname: string;
    gender: Gender | '';
    birth_date: string;
    curp: string;
    ine_front: File | null;
    ine_back: File | null;
    postal_code: string;
    state: string;
    city: string;
    neighborhood: string;
    address: string;
    email: string;
    phone: string;
    password: string;
    confirm_password: string;
}

// Paso 2: Información adicional
export interface AmbassadorStep2Data {
    instagram: string;
    facebook: string;
    tiktok: string;
    other_social: string;
    motivation: string;
}

// Paso 3: Datos bancarios
export interface AmbassadorStep3Data {
    rfc: string;
    payment_method: PaymentMethod | '';
    bank_name: string;
    card_number: string;
    clabe: string;
    accept_terms: boolean;
}

// Formulario completo
export interface AmbassadorFormData extends 
    AmbassadorStep1Data, 
    AmbassadorStep2Data, 
    AmbassadorStep3Data {}

// Para crear embajador (lo que se envía al API)
export interface CreateAmbassadorRequest {
    // Paso 1
    first_name: string;
    paternal_surname: string;
    maternal_surname?: string;
    gender?: Gender;
    birth_date: string;
    curp: string;
    ine_front_url?: string;
    ine_back_url?: string;
    postal_code?: string;
    state?: string;
    city?: string;
    neighborhood?: string;
    address?: string;
    email: string;
    phone?: string;
    password: string;
    
    // Paso 2
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    other_social?: string;
    motivation?: string;
    
    // Paso 3
    rfc?: string;
    payment_method?: PaymentMethod;
    bank_name?: string;
    card_last_digits?: string;
    clabe?: string;
    
    // Opcional: si ya es miembro
    linked_memberstack_id?: string;
}

// ============================================
// SESIONES Y AUTH
// ============================================

export interface AmbassadorSession {
    id: string;
    ambassador_id: string;
    session_token: string;
    expires_at: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

export interface AmbassadorLoginRequest {
    email: string;
    password: string;
}

export interface AmbassadorLoginResponse {
    success: boolean;
    token?: string;
    ambassador?: Ambassador;
    error?: string;
}

// ============================================
// CONFIGURACIÓN
// ============================================

export interface AmbassadorConfig {
    default_commission_percentage: number;
    payment_frequency: 'monthly' | 'biweekly' | 'weekly';
    minimum_payout_amount: number;
    referral_code_prefix: string;
}

// ============================================
// ESTADÍSTICAS
// ============================================

export interface AmbassadorStats {
    total_referrals: number;
    referrals_this_month: number;
    total_earnings: number;
    pending_payout: number;
    commission_percentage: number;
}

export interface AdminAmbassadorStats {
    total_ambassadors: number;
    pending_approval: number;
    active_ambassadors: number;
    total_referrals: number;
    total_commissions_paid: number;
    pending_payouts: number;
}

// ============================================
// RESPUESTAS API
// ============================================

export interface AmbassadorApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
