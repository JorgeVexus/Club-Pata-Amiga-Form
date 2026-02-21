/**
 * 🎯 Script para migrar URLs de INE de embajadores existentes
 * 
 * Este script busca los archivos INE en el bucket 'documents' de Supabase
 * y los asigna a los embajadores correspondientes en la base de datos.
 * 
 * Uso:
 * 1. Ejecutar en el servidor de desarrollo o crear un endpoint temporal
 * 2. O ejecutar manualmente con las queries generadas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface AmbassadorFile {
  id: string;
  name: string;
  created_at: string;
  ambassador_id?: string;
  type: 'front' | 'back';
}

async function migrateAmbassadorIneUrls() {
  console.log('🔍 Buscando archivos INE en el bucket...\n');

  try {
    // 1. Listar todos los archivos en la carpeta ambassadors/
    const { data: files, error } = await supabase.storage
      .from('documents')
      .list('ambassadors', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (error) {
      console.error('❌ Error listando archivos:', error);
      return;
    }

    if (!files || files.length === 0) {
      console.log('⚠️ No se encontraron archivos en ambassadors/');
      return;
    }

    console.log(`✅ Encontrados ${files.length} archivos\n`);

    // 2. Filtrar solo los archivos de INE de embajadores
    const ineFiles = files.filter(file => 
      file.name.includes('ambassador_ine_front') || 
      file.name.includes('ambassador_ine_back')
    );

    console.log(`🪪 Archivos INE encontrados: ${ineFiles.length}\n`);

    // 3. Obtener todos los embajadores sin URLs de INE
    const { data: ambassadors, error: ambError } = await supabase
      .from('ambassadors')
      .select('id, email, first_name, paternal_surname, created_at')
      .is('ine_front_url', null)
      .is('ine_back_url', null)
      .order('created_at', { ascending: true });

    if (ambError) {
      console.error('❌ Error obteniendo embajadores:', ambError);
      return;
    }

    console.log(`👥 Embajadores sin INE asignada: ${ambassadors?.length || 0}\n`);

    // 4. Agrupar archivos por timestamp (aproximado al momento de registro)
    const filesByDate = ineFiles.reduce((acc, file) => {
      const date = new Date(file.created_at!);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push({
        id: file.id,
        name: file.name,
        created_at: file.created_at!,
        type: file.name.includes('front') ? 'front' : 'back',
        publicUrl: `${supabaseUrl}/storage/v1/object/public/documents/ambassadors/${file.name}`
      });
      return acc;
    }, {} as Record<string, any[]>);

    // 5. Mostrar resumen de archivos encontrados
    console.log('📁 Archivos INE por fecha:');
    Object.entries(filesByDate).forEach(([date, files]) => {
      console.log(`  ${date}: ${files.length} archivos`);
      files.forEach((f: any) => console.log(`    - ${f.name} (${f.type})`));
    });
    console.log('\n');

    // 6. Generar queries SQL para actualización manual (más seguro)
    console.log('📝 Queries SQL generadas para actualización manual:\n');
    console.log('-- ============================================');
    console.log('-- Queries para asignar URLs de INE');
    console.log('-- Ejecutar en el SQL Editor de Supabase');
    console.log('-- ============================================\n');

    // Emparejar archivos con embajadores por orden cronológico
    let fileIndex = 0;
    const allFiles = ineFiles.sort((a, b) => 
      new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
    );

    // Agrupar en pares (front, back)
    const pairs: { front?: any; back?: any }[] = [];
    let currentPair: { front?: any; back?: any } = {};
    
    allFiles.forEach(file => {
      if (file.name.includes('front')) {
        if (currentPair.front || currentPair.back) {
          pairs.push(currentPair);
        }
        currentPair = { front: file };
      } else if (file.name.includes('back')) {
        currentPair.back = file;
        pairs.push(currentPair);
        currentPair = {};
      }
    });

    // Generar queries
    ambassadors?.forEach((ambassador, index) => {
      const pair = pairs[index];
      if (pair && (pair.front || pair.back)) {
        const frontUrl = pair.front 
          ? `${supabaseUrl}/storage/v1/object/public/documents/ambassadors/${pair.front.name}`
          : null;
        const backUrl = pair.back 
          ? `${supabaseUrl}/storage/v1/object/public/documents/ambassadors/${pair.back.name}`
          : null;

        console.log(`-- Embajador: ${ambassador.first_name} ${ambassador.paternal_surname} (${ambassador.email})`);
        console.log(`-- Registrado: ${ambassador.created_at}`);
        console.log(`UPDATE ambassadors SET`);
        if (frontUrl) console.log(`  ine_front_url = '${frontUrl}',`);
        if (backUrl) console.log(`  ine_back_url = '${backUrl}',`);
        console.log(`  updated_at = NOW()`);
        console.log(`WHERE id = '${ambassador.id}';`);
        console.log('');
      }
    });

    console.log('-- ============================================');
    console.log('⚠️ IMPORTANTE: Revisa que las URLs coincidan con cada embajador antes de ejecutar');
    console.log('-- ============================================');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
migrateAmbassadorIneUrls();
