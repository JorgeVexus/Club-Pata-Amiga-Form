'use server'

import { createClient } from '@supabase/supabase-js'

/**
 * Inicializar cliente de Supabase con Service Role para bypass de RLS
 * (Solo para uso interno en el servidor)
 */
const getServiceRoleClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ CRITICAL: Falta configuración de Supabase Service Role Key o URL')
        return null
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

/**
 * Crea una notificación desde el servidor de forma segura.
 * Este método se salta el RLS y verifica las preferencias del usuario.
 */
export async function createServerNotification(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    icon?: string;
    link?: string;
    metadata?: any;
    expiresAt?: string;
}) {
    const { userId, type, title, message, icon, link, metadata, expiresAt } = params;

    console.log(`🔔 [Server Action] Intentando crear notificación para ${userId} (Tipo: ${type})`);

    const supabase = getServiceRoleClient()
    if (!supabase) return { success: false, error: 'Configuración de servidor incompleta' }

    try {
        // 1. Verificar preferencias del usuario
        const { data: prefs, error: prefsError } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (prefsError && prefsError.code !== 'PGRST116') {
            console.error('❌ [Server Action] Error consultando preferencias:', prefsError);
        }

        // Si el usuario tiene deshabilitado este tipo, no la creamos
        const prefKey = `${type}_enabled` as any;
        if (prefs && prefs[prefKey] === false) {
            console.log(`⏭️ [Server Action] Notificación omitida por preferencias del usuario (${type})`);
            return { success: true, skipped: true };
        }

        // 2. Insertar la notificación
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                icon: icon || '🔔',
                link: link || null,
                metadata: metadata || {},
                expires_at: expiresAt || null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('❌ [Server Action] Error al insertar notificación:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ [Server Action] Notificación creada exitosamente:', data.id);
        return { success: true, notification: data };

    } catch (error: any) {
        console.error('❌ [Server Action] Error inesperado:', error);
        return { success: false, error: error.message };
    }
}
