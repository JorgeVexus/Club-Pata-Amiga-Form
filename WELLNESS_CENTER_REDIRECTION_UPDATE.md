# Wellness Center Role Redirection Update

## Overview
This update enhances the login redirection system to properly handle users with "wellness_center" roles, redirecting them to their specific dashboard at `https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar`.

## Changes Made

### 1. Enhanced Login Redirect Script (`login-redirect-enhanced.js`)

**New Features:**
- Added `wellness_center` role support in the configuration
- Updated dashboard URLs to include wellness center redirect
- Enhanced switch statement to handle wellness_center role
- Added support for both `wellness_center` and `wellness-center` role formats

**Key Changes:**
```javascript
// Added wellness center dashboard URL
const CONFIG = {
    dashboards: GLOBAL_CONFIG.dashboards || {
        member: 'https://www.pataamiga.mx/pets/pet-waiting-period',
        ambassador: 'https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar',
        admin: 'https://app.pataamiga.mx/admin/dashboard',
        wellness_center: 'https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar' // NEW
    }
};

// Added wellness center case in switch statement
switch (data.role) {
    case 'admin':
        redirectUrl = CONFIG.dashboards.admin;
        break;
    case 'ambassador':
        redirectUrl = CONFIG.dashboards.ambassador;
        break;
    case 'wellness_center':
    case 'wellness-center':
        redirectUrl = CONFIG.dashboards.wellness_center;
        logger.log('Usuario con rol de Centro del Bienestar, redirigiendo a dashboard específico');
        break;
    // ... other cases
}
```

### 2. API Endpoint Update (`/api/auth/check-role`)

**Enhancements:**
- Added wellness center verification logic
- Queries the `wellness_centers` table in Supabase
- Checks for valid wellness center status (not rejected, suspended, or cancelled)

**Key Changes:**
```typescript
// 2.5 Check if user is a Wellness Center
console.time(`[Check-Role] Supabase Wellness Center Check: ${memberstackId}`);
const { data: wellnessCenter } = await supabase
    .from('wellness_centers')
    .select('id, status')
    .eq('memberstack_id', memberstackId)
    .maybeSingle();
console.timeEnd(`[Check-Role] Supabase Wellness Center Check: ${memberstackId}`);

if (wellnessCenter && wellnessCenter.status !== 'rejected' && wellnessCenter.status !== 'suspended' && wellnessCenter.status !== 'cancelled') {
    console.log(`🔍 [Check-Role] Centro de Bienestar encontrado para ID ${memberstackId}:`, wellnessCenter);
    return NextResponse.json({
        success: true,
        role: 'wellness_center',
        status: wellnessCenter.status
    }, { headers: corsHeaders() });
}
```

### 3. Database Integration

**Wellness Centers Table Structure:**
- Uses existing `wellness_centers` table in Supabase
- Links to Memberstack via `memberstack_id` field
- Checks for valid status values: `approved`, `pending`, `appealed`

## Usage

### For New Implementations:
1. Use the enhanced login redirect script: `login-redirect-enhanced.js`
2. Place it in your HTML where you want the login functionality
3. The script will automatically detect wellness center roles and redirect accordingly

### For Existing Implementations:
1. Replace your current login redirect script with the enhanced version
2. The script maintains backward compatibility with existing roles (admin, ambassador, member)

## Role Priority Order

The system checks roles in this order:
1. **Admin** - Highest priority
2. **Wellness Center** - New addition
3. **Ambassador** 
4. **Member** - Default fallback

## Testing

### Test Scenarios:
1. **Admin User** - Should redirect to `https://app.pataamiga.mx/admin/dashboard`
2. **Wellness Center User** - Should redirect to `https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar`
3. **Ambassador User** - Should redirect to `https://www.pataamiga.mx/red-pata-amiga/perfil-centros-del-bienestar`
4. **Regular Member** - Should redirect to `https://www.pataamiga.mx/pets/pet-waiting-period`

### Wellness Center Status Testing:
- **Approved** - Should redirect to wellness center dashboard
- **Pending** - Should redirect to wellness center dashboard (can access profile)
- **Appealed** - Should redirect to wellness center dashboard (can respond to appeal)
- **Rejected/Suspended/Cancelled** - Should fall back to member dashboard

## Files Modified

1. **`public/widgets/login-redirect-enhanced.js`** - Enhanced login redirect script
2. **`src/app/api/auth/check-role/route.ts`** - Added wellness center verification

## Verification

- ✅ Build completed successfully
- ✅ TypeScript type checking passed
- ✅ No breaking changes to existing functionality
- ✅ Backward compatible with existing user roles

## Next Steps

1. Deploy the enhanced login redirect script to your production environment
2. Test with actual wellness center accounts
3. Monitor the console logs for proper role detection
4. Update any documentation to reflect the new wellness center role support

## Support

For issues or questions:
- Check browser console logs for role detection messages
- Verify wellness center entries in Supabase `wellness_centers` table
- Ensure `memberstack_id` is properly linked to wellness center records