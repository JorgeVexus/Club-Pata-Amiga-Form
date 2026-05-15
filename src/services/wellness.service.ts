import { createClient } from '@supabase/supabase-js';
import { WellnessCenter, WellnessCenterStatus, WellnessCenterAppointment, WellnessCenterPayment } from '@/types/wellness.types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const wellnessService = {
    /**
     * Obtiene un centro de bienestar por su ID de Memberstack
     */
    async getByMemberstackId(memberstackId: string): Promise<WellnessCenter | null> {
        const { data, error } = await supabase
            .from('wellness_centers')
            .select('*')
            .eq('memberstack_id', memberstackId)
            .single();

        if (error) {
            console.error('❌ Error fetching wellness center by memberstack_id:', error);
            return null;
        }

        return data as WellnessCenter;
    },

    /**
     * Crea un nuevo registro de centro de bienestar
     */
    async create(data: Partial<WellnessCenter>): Promise<{ data: WellnessCenter | null; error: any }> {
        const { data: created, error } = await supabase
            .from('wellness_centers')
            .insert(data)
            .select()
            .single();

        return { data: created as WellnessCenter, error };
    },

    /**
     * Actualiza un centro de bienestar
     */
    async update(id: string, data: Partial<WellnessCenter>): Promise<{ data: WellnessCenter | null; error: any }> {
        const { data: updated, error } = await supabase
            .from('wellness_centers')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        return { data: updated as WellnessCenter, error };
    },

    /**
     * Obtiene el historial de pagos de un centro
     */
    async getPaymentHistory(wellnessCenterId: string): Promise<WellnessCenterPayment[]> {
        const { data, error } = await supabase
            .from('wellness_center_payments')
            .select('*')
            .eq('wellness_center_id', wellnessCenterId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching payment history:', error);
            return [];
        }

        return data as WellnessCenterPayment[];
    },

    /**
     * Obtiene las citas de un centro
     */
    async getAppointments(wellnessCenterId: string, status?: string): Promise<WellnessCenterAppointment[]> {
        let query = supabase
            .from('wellness_center_appointments')
            .select('*, pets(*), users(*)')
            .eq('wellness_center_id', wellnessCenterId)
            .order('appointment_date', { ascending: true });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Error fetching appointments:', error);
            return [];
        }

        return data as any[];
    }
};
