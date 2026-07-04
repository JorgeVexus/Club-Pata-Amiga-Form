import { supabaseAdmin } from '@/lib/supabase';
import { WellnessCenter, WellnessCenterAppointment, WellnessCenterPayment, WellnessCenterLocation } from '@/types/wellness.types';

// Usar el cliente administrativo centralizado
const supabase = supabaseAdmin;

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
     * Obtiene las sucursales de un centro.
     */
    async getLocations(wellnessCenterId: string): Promise<WellnessCenterLocation[]> {
        const { data, error } = await supabase
            .from('wellness_center_locations')
            .select('*')
            .eq('wellness_center_id', wellnessCenterId)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Error fetching wellness center locations:', error);
            return [];
        }

        return data as WellnessCenterLocation[];
    },

    /**
     * Reemplaza las sucursales de un centro con el payload enviado por el widget.
     */
    async syncLocations(wellnessCenterId: string, locations: WellnessCenterLocation[]): Promise<{ error: any }> {
        const normalized = locations
            .map((location, index) => ({
                wellness_center_id: wellnessCenterId,
                name: location.name?.trim() || null,
                address: location.address?.trim(),
                lat: typeof location.lat === 'number' ? location.lat : null,
                lng: typeof location.lng === 'number' ? location.lng : null,
                phone: location.phone?.trim() || null,
                is_primary: index === 0 ? true : Boolean(location.is_primary),
                sort_order: index
            }))
            .filter(location => location.address);

        const { error: deleteError } = await supabase
            .from('wellness_center_locations')
            .delete()
            .eq('wellness_center_id', wellnessCenterId);

        if (deleteError) {
            console.error('❌ Error deleting wellness center locations:', deleteError);
            return { error: deleteError };
        }

        if (normalized.length === 0) {
            return { error: null };
        }

        const { error: insertError } = await supabase
            .from('wellness_center_locations')
            .insert(normalized);

        if (insertError) {
            console.error('❌ Error inserting wellness center locations:', insertError);
        }

        return { error: insertError };
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
    },

    /**
     * Obtiene todos los centros de bienestar aprobados con coordenadas
     */
    async getAllApprovedLocations(): Promise<Partial<WellnessCenter>[]> {
        const { data, error } = await supabase
            .from('wellness_centers')
            .select('id, establishment_name, logo_url, address, phone, lat, lng, services, promotion_details, social_links, wellness_center_locations(*)')
            .eq('status', 'approved')
            .order('establishment_name', { ascending: true });

        if (error) {
            console.error('❌ Error fetching wellness center locations:', error);
            return [];
        }

        return (data || []).flatMap((center: any) => {
            const branchLocations = (center.wellness_center_locations || [])
                .filter((location: WellnessCenterLocation) => location.lat != null && location.lng != null)
                .map((location: WellnessCenterLocation) => ({
                    id: location.id,
                    wellness_center_id: center.id,
                    establishment_name: location.name || center.establishment_name,
                    logo_url: center.logo_url,
                    address: location.address,
                    phone: location.phone || center.phone,
                    lat: location.lat,
                    lng: location.lng,
                    services: center.services,
                    promotion_details: center.promotion_details,
                    social_links: center.social_links,
                    is_primary: location.is_primary
                }));

            if (branchLocations.length > 0) {
                return branchLocations;
            }

            if (center.lat != null && center.lng != null) {
                return [{
                    id: center.id,
                    wellness_center_id: center.id,
                    establishment_name: center.establishment_name,
                    logo_url: center.logo_url,
                    address: center.address,
                    phone: center.phone,
                    lat: center.lat,
                    lng: center.lng,
                    services: center.services,
                    promotion_details: center.promotion_details,
                    social_links: center.social_links,
                    is_primary: true
                }];
            }

            return [];
        }) as Partial<WellnessCenter>[];
    }
};
