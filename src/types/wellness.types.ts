/**
 * 🎯 Tipos para el Sistema de Centros de Bienestar
 * Club Pata Amiga
 */

export type WellnessCenterStatus = 'pending' | 'approved' | 'rejected' | 'appealed' | 'cancelled';

export interface SocialLinks {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
    website?: string;
}

export interface WellnessCenter {
    id: string;
    memberstack_id?: string;
    
    // Información del establecimiento
    establishment_name: string;
    services: string[];
    phone?: string;
    email: string;
    logo_url?: string;
    promotion_details?: string;
    
    // Dirección y Geolocalización
    address?: string;
    lat?: number;
    lng?: number;
    
    // Redes Sociales
    social_links: SocialLinks;
    
    // Estado
    status: WellnessCenterStatus;
    
    // Administración
    rejection_reason?: string;
    appeal_message?: string;
    
    // Cancelación
    cancellation_reason?: string;
    cancelled_at?: string;
    
    // Timestamps
    created_at: string;
    updated_at: string;
}

// ============================================
// PAGOS (Beneficios Económicos)
// ============================================

export type PaymentStatus = 'pending' | 'paid';

export interface WellnessCenterPayment {
    id: string;
    wellness_center_id: string;
    solidarity_request_id?: string;
    
    amount: number;
    status: PaymentStatus;
    payment_reference?: string;
    
    paid_at?: string;
    created_at: string;
}

// ============================================
// CITAS / PELUDOS ATENDIDOS
// ============================================

export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
export type RejectionReason = 'no_availability' | 'out_of_scope' | 'other';

export interface WellnessCenterAppointment {
    id: string;
    wellness_center_id: string;
    solidarity_request_id: string;
    
    pet_id?: string;
    member_id?: string;
    
    appointment_date?: string;
    status: AppointmentStatus;
    
    rejection_reason?: RejectionReason;
    rejection_details?: string;
    
    evidence_url?: string;
    amount?: number;
    
    created_at: string;
    updated_at: string;
}

// ============================================
// FORMULARIO DE REGISTRO
// ============================================

export interface WellnessCenterRegistrationData {
    establishment_name: string;
    services: string[];
    email: string;
    password?: string;
    confirm_password?: string;
    accept_terms: boolean;
}

export interface WellnessCenterComplementaryData {
    phone?: string;
    address?: string;
    lat?: number;
    lng?: number;
    logo_url?: string;
    social_links: SocialLinks;
    promotion_details?: string;
}
