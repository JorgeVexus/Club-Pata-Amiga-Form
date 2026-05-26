/**
 * Utilidades para el cálculo del periodo de carencia (waiting period)
 * Centraliza las reglas de negocio para asegurar consistencia entre el registro,
 * el dashboard admin, la API de solidaridad y el Vet-Bot.
 */

interface CarenciaInput {
    waiting_period_end?: string | null;
    waiting_period_start?: string | null;
    created_at?: string | null;
    is_adopted?: boolean | null;
    is_mixed_breed?: boolean | null;
    is_mixed?: boolean | null; // Soporte para inconsistencias de nombrado
    breed?: string | null;
    pet_type?: string | null;
}

/**
 * Calcula la fecha de finalización del periodo de carencia.
 * 
 * Reglas de negocio:
 * 1. Si existe un código de embajador (referido): 90 días.
 * 2. Si es adoptado y mestizo: 120 días.
 * 3. Si es adoptado y de raza: 150 días.
 * 4. Por defecto: 180 días.
 * 
 * Si es mestizo o gato (michis/mestizos), se considera adoptado por defecto en la lógica.
 * 
 * El periodo inicia desde waiting_period_start (fecha de aprobación).
 * Si no existe, se usa created_at como fallback.
 */
export function getPetCarenciaDate(pet: CarenciaInput, hasAmbassadorCode: boolean = false): Date {
    // 1. Si ya tiene una fecha de fin explícita en DB, respetarla
    if (pet.waiting_period_end) {
        return new Date(pet.waiting_period_end);
    }

    // 2. Determinar fecha de inicio
    const startDate = pet.waiting_period_start 
        ? new Date(pet.waiting_period_start) 
        : (pet.created_at ? new Date(pet.created_at) : new Date());

    // 3. Determinar número de días según reglas
    let days = 180;
    
    const isMixed = pet.is_mixed_breed === true || pet.is_mixed === true || 
                    (pet.breed && (pet.breed.toLowerCase().includes('mestizo') || 
                                   pet.breed.toLowerCase().includes('doméstico') || 
                                   pet.breed.toLowerCase().includes('domestico')));
    const isCat = pet.pet_type === 'cat' || pet.pet_type === 'gato' || (pet.pet_type && pet.pet_type.toLowerCase().includes('gato'));
    const isAdopted = pet.is_adopted === true || isMixed || isCat;

    if (hasAmbassadorCode) {
        days = 90;
    } else if (isAdopted) {
        days = isMixed ? 120 : 150;
    }

    // 4. Calcular fecha final
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days);
    
    return endDate;
}

/**
 * Determina si una mascota está actualmente activa (fuera de carencia).
 */
export function isPetActive(pet: CarenciaInput, hasAmbassadorCode: boolean = false): boolean {
    const carenciaEnd = getPetCarenciaDate(pet, hasAmbassadorCode);
    return new Date() >= carenciaEnd;
}

/**
 * Calcula cuántos días faltan para que termine la carencia.
 * Retorna 0 si ya terminó.
 */
export function getDaysUntilActive(pet: CarenciaInput, hasAmbassadorCode: boolean = false): number {
    const carenciaEnd = getPetCarenciaDate(pet, hasAmbassadorCode);
    const now = new Date();
    
    if (now >= carenciaEnd) return 0;
    
    const diffTime = carenciaEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
/**
 * Calcula cuántos días han transcurrido desde el inicio de la carencia.
 */
export function getDaysElapsed(pet: CarenciaInput, hasAmbassadorCode: boolean = false): number {
    const startDate = pet.waiting_period_start 
        ? new Date(pet.waiting_period_start) 
        : (pet.created_at ? new Date(pet.created_at) : new Date());
    
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}
