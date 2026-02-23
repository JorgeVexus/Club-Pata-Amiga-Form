-- ============================================
-- 🔄 BACKFILL: Actualizar embajadores existentes
-- Fecha: 2026-02-23
-- ============================================

-- 1. Actualizar embajadores que ya tienen código pero no tienen status
-- Esto pasa con embajadores registrados antes del nuevo sistema
UPDATE ambassadors 
SET 
    referral_code_status = 'active',
    can_change_referral_code = true
WHERE 
    status = 'approved' 
    AND referral_code IS NOT NULL 
    AND (referral_code_status IS NULL OR referral_code_status = 'pending');

-- 2. Verificar cuántos se actualizaron
SELECT 
    COUNT(*) as total_actualizados,
    (SELECT COUNT(*) FROM ambassadors WHERE status = 'approved' AND referral_code_status = 'active') as total_con_codigo_activo
FROM ambassadors 
WHERE 
    status = 'approved' 
    AND referral_code IS NOT NULL 
    AND referral_code_status = 'active';

-- 3. Listar embajadores que pueden cambiar su código (para verificación)
SELECT 
    id,
    first_name,
    email,
    referral_code,
    referral_code_status,
    can_change_referral_code,
    referral_code_changed_at
FROM ambassadors 
WHERE 
    status = 'approved' 
    AND referral_code IS NOT NULL
ORDER BY created_at DESC;
