const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjvhntxjkuuobgfslzlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdmhudHhqa3V1b2JnZnNsemxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1ODk1NywiZXhwIjoyMDgwNDM0OTU3fQ.MMgexipW0S6PTva14Te9wWQdSLw0Fe6D5U2--r__tEk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPetsAge() {
    console.log('🔄 Iniciando sincronización de edad de mascotas...');

    // 1. Obtener mascotas que tienen valores numéricos pero no tienen el campo 'age' de texto
    const { data: pets, error } = await supabase
        .from('pets')
        .select('id, name, age_value, age_unit, age')
        .is('age', null);

    if (error) {
        console.error('❌ Error al obtener mascotas:', error);
        return;
    }

    if (!pets || pets.length === 0) {
        console.log('✅ No hay mascotas pendientes de sincronización.');
        return;
    }

    console.log(`🐾 Se encontraron ${pets.length} mascotas para actualizar.`);

    for (const pet of pets) {
        if (!pet.age_value) {
            console.warn(`⚠️ Saltando mascota ${pet.name} (${pet.id}): Sin age_value`);
            continue;
        }

        const unit = pet.age_unit === 'months' ? (pet.age_value === 1 ? 'mes' : 'meses') : (pet.age_value === 1 ? 'año' : 'años');
        const ageString = `${pet.age_value} ${unit}`;

        const { error: updateError } = await supabase
            .from('pets')
            .update({ age: ageString })
            .eq('id', pet.id);

        if (updateError) {
            console.error(`❌ Error actualizando mascota ${pet.name}:`, updateError);
        } else {
            console.log(`✅ Actualizada: ${pet.name} -> ${ageString}`);
        }
    }

    console.log('🏁 Sincronización finalizada.');
}

syncPetsAge();
