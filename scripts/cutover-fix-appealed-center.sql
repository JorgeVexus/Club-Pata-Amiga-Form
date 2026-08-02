insert into wellness_centers (id, name, contact_name, email, phone, services, logo_url, status, rejection_reason, memberstack_id)
values ('2cd1ff55-3705-4d0f-804e-0062a6f6b442', 'Hospital Guaf', 'Hospital Guaf', null, '5543456745', array['Tienda','Hospital Veterinario'], 'https://hjvhntxjkuuobgfslzlf.supabase.co/storage/v1/object/public/wellness-logos/mem_cmrbkj6790bul0smt98t04uzg/logo.jpg', 'pending', 'Falta de documentación oficial', 'mem_cmrbkj6790bul0smt98t04uzg')
on conflict (id) do nothing;
