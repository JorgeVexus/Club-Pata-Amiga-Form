/**
 * 🛰️ Communication Service
 * Gestión de plantillas y logs de comunicación (Email/WhatsApp)
 */

import { supabase } from '@/lib/supabase';

export interface CommTemplate {
    id: string;
    name: string;
    type: 'email' | 'whatsapp';
    subject?: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface CommLog {
    id: string;
    user_id: string;
    admin_id?: string;
    type: 'email' | 'whatsapp';
    template_id?: string;
    status: 'sent' | 'failed' | 'pending';
    content: string;
    metadata?: any;
    created_at: string;
}

export const commService = {
    /**
     * Obtener todas las plantillas
     */
    async getTemplates(): Promise<{ success: boolean; data?: CommTemplate[]; error?: string }> {
        const { data, error } = await supabase
            .from('communication_templates')
            .select('*')
            .order('name');

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    /**
     * Obtener una plantilla por ID
     */
    async getTemplateById(id: string): Promise<{ success: boolean; data?: CommTemplate; error?: string }> {
        const { data, error } = await supabase
            .from('communication_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    /**
     * Crear o actualizar una plantilla
     */
    async saveTemplate(template: Partial<CommTemplate>): Promise<{ success: boolean; data?: CommTemplate; error?: string }> {
        const { id, ...rest } = template;

        if (id) {
            const { data, error } = await supabase
                .from('communication_templates')
                .update(rest)
                .eq('id', id)
                .select()
                .single();
            if (error) return { success: false, error: error.message };
            return { success: true, data };
        } else {
            const { data, error } = await supabase
                .from('communication_templates')
                .insert(rest)
                .select()
                .single();
            if (error) return { success: false, error: error.message };
            return { success: true, data };
        }
    },

    /**
     * Eliminar una plantilla
     */
    async deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
        const { error } = await supabase
            .from('communication_templates')
            .delete()
            .eq('id', id);

        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    /**
     * Registrar un log de comunicación
     */
    async logCommunication(log: Omit<CommLog, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
        const { error } = await supabase
            .from('communication_logs')
            .insert(log);

        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    /**
     * Obtener historial de un usuario
     */
    async getUserHistory(userId: string): Promise<{ success: boolean; data?: CommLog[]; error?: string }> {
        const { data, error } = await supabase
            .from('communication_logs')
            .select('*, communication_templates(name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    /**
     * Obtener todos los logs (para el dashboard general)
     */
    async getAllLogs(): Promise<{ success: boolean; data?: CommLog[]; error?: string }> {
        const { data, error } = await supabase
            .from('communication_logs')
            .select('*, communication_templates(name)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },

    /**
     * Procesa placeholders en un texto
     * Ejemplo: "Hola {{name}}" -> "Hola Juan"
     */
    processPlaceholders(content: string, vars: Record<string, string>): string {
        let processed = content;
        Object.entries(vars).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processed = processed.replace(regex, value || '');
        });
        return processed;
    }
};
