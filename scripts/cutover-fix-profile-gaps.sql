-- welcome_shown: el modal de bienvenida no debe volver a salir para
-- quien ya lo vio en el sistema viejo.
update profiles p
set welcome_shown = u.welcome_shown
from users u
where u.id = p.id and u.welcome_shown is not null;

-- billing_details (CFDI): 19 miembros reales pidieron factura en el
-- sistema viejo, sus datos fiscales nunca se migraron a profiles.
update profiles p
set cfdi_requested = true,
    rfc = b.rfc,
    razon_social = b.business_name,
    regimen_fiscal = b.tax_regime,
    uso_cfdi = b.cfdi_use,
    cp_fiscal = b.zip_code
from billing_details b
where b.user_id = p.id;
