import { supabase } from '@/lib/supabase';

export class AdminAuthService {
    /**
     * Verifica si un usuario (por Memberstack ID) es Admin o Super Admin
     */
    static async getRole(memberstackId: string): Promise<'member' | 'admin' | 'super_admin' | null> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('memberstack_id', memberstackId)
                .single();

            if (error || !data) {
                console.error('Error fetching role:', error);
                return null;
            }

            return data.role as 'member' | 'admin' | 'super_admin';
        } catch (err) {
            console.error('AdminAuthService error:', err);
            return null;
        }
    }

    /**
     * Verifica si es específicamente Super Admin
     */
    static async isSuperAdmin(memberstackId: string): Promise<boolean> {
        const role = await this.getRole(memberstackId);
        return role === 'super_admin';
    }

    /**
     * Middleware helper: Lanza error si no es admin
     */
    static async verifyAdminAccess(memberstackId: string) {
        const role = await this.getRole(memberstackId);
        if (role !== 'admin' && role !== 'super_admin') {
            throw new Error('Unauthorized: User is not an admin');
        }
        return role;
    }

    /**
     * Obtiene los detalles completos del usuario
     */
    static async getUserDetails(memberstackId: string) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role, full_name, email')
                .eq('memberstack_id', memberstackId)
                .single();

            if (error || !data) return null;
            return data;
        } catch (e) { return null; }
    }
}
