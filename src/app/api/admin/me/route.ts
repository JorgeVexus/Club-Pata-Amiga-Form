import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/services/admin-auth.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memberstackId } = body;

        if (!memberstackId) {
            return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
        }

        const user = await AdminAuthService.getUserDetails(memberstackId);

        if (!user) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        return NextResponse.json({
            role: user.role,
            isSuperAdmin: user.role === 'super_admin',
            isAdmin: user.role === 'admin' || user.role === 'super_admin',
            name: user.full_name,
            email: user.email
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
