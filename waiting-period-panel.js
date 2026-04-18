/**
 * PANEL DE PERÍODO DE CARENCIA - JAVASCRIPT
 * Maneja la lógica dinámica del panel de carencia
 */

// Estado global
let currentPetIndex = 0;
let petsData = [];
let memberData = null;

// Constantes
const TOTAL_DAYS_OPTIONS = [120, 180]; // 4 o 6 meses

/**
 * Inicialización cuando el DOM está listo
 * OPTIMIZACIÓN: El cálculo del progreso se realiza UNA SOLA VEZ al cargar la página.
 * No hay actualizaciones automáticas porque el período de carencia se mide en DÍAS,
 * no en minutos u horas. Esto mejora significativamente el rendimiento.
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🐕 Inicializando panel de período de carencia...');

    // Esperar a que Memberstack esté cargado
    await waitForMemberstack();

    // Cargar datos del usuario
    await loadUserData();

    // Renderizar el panel (cálculo único)
    renderPanel();

    // Configurar event listeners
    setupEventListeners();
});

/**
 * Espera a que Memberstack esté disponible
 */
async function waitForMemberstack() {
    return new Promise((resolve) => {
        if (window.$memberstackDom) {
            resolve();
            return;
        }

        let attempts = 0;
        const maxAttempts = 50; // 10 segundos

        const interval = setInterval(() => {
            attempts++;
            if (window.$memberstackDom) {
                clearInterval(interval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                showError('Memberstack no se cargó correctamente');
                resolve();
            }
        }, 200);
    });
}

/**
 * Carga los datos del usuario desde Memberstack
 */
async function loadUserData() {
    try {
        if (!window.$memberstackDom) {
            throw new Error('Memberstack no está disponible');
        }

        // Obtener miembro actual
        const { data: member } = await window.$memberstackDom.getCurrentMember();

        if (!member) {
            throw new Error('No hay usuario autenticado');
        }

        memberData = member;
        const customFields = member.customFields || {};

        console.log('✅ Datos del usuario cargados:', customFields);
        console.log('📋 Todos los custom fields disponibles:', Object.keys(customFields));

        // Intentar obtener total-pets, si no existe, buscar manualmente
        let totalPets = parseInt(customFields['total-pets'] || '0');

        // Si no hay total-pets, buscar manualmente pet-1, pet-2, pet-3
        if (totalPets === 0) {
            console.log('⚠️ Campo "total-pets" no encontrado, buscando mascotas manualmente...');

            // Buscar cuántas mascotas tienen al menos el campo "name"
            for (let i = 1; i <= 3; i++) {
                if (customFields[`pet-${i}-name`]) {
                    totalPets = i;
                }
            }

            console.log(`📊 Mascotas encontradas manualmente: ${totalPets}`);
        }

        if (totalPets === 0) {
            console.log('❌ No se encontraron mascotas. Campos disponibles:', Object.keys(customFields).filter(k => k.startsWith('pet-')));
            showError('No tienes mascotas registradas');
            return;
        }

        // Procesar cada mascota
        petsData = [];
        for (let i = 1; i <= totalPets; i++) {
            const prefix = `pet-${i}`;
            console.log(`🔍 Buscando datos de ${prefix}...`);

            const petData = extractPetData(customFields, prefix, i);

            if (petData) {
                console.log(`✅ ${prefix} encontrada:`, petData);
                if (petData.isActive) {
                    petsData.push(petData);
                } else {
                    console.log(`⚠️ ${prefix} está inactiva, se omite`);
                }
            } else {
                console.log(`❌ ${prefix} no tiene datos suficientes`);
            }
        }

        if (petsData.length === 0) {
            console.log('❌ No hay mascotas activas después del procesamiento');
            showError('No tienes mascotas activas');
            return;
        }

        console.log('✅ Mascotas procesadas:', petsData);
        hideLoading();

    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        showError('Error al cargar la información de tus mascotas');
    }
}

/**
 * Extrae los datos de una mascota desde los custom fields
 */
function extractPetData(customFields, prefix, index) {
    const name = customFields[`${prefix}-name`];
    const lastName = customFields[`${prefix}-last-name`];
    const petType = customFields[`${prefix}-type`] || 'perro';
    const waitingPeriodDays = parseInt(customFields[`${prefix}-waiting-period-days`] || '180');
    let waitingPeriodEnd = customFields[`${prefix}-waiting-period-end`];
    let registrationDate = customFields[`${prefix}-registration-date`];
    const isActive = customFields[`${prefix}-is-active`] !== 'false';
    const isAdopted = customFields[`${prefix}-is-adopted`] === 'true';

    // Si no hay nombre, no es una mascota válida
    if (!name) {
        console.log(`⚠️ ${prefix}: No tiene nombre`);
        return null;
    }

    // Si no hay fecha de registro, usar la fecha actual
    if (!registrationDate) {
        console.log(`⚠️ ${prefix}: No tiene registration-date, usando fecha actual`);
        registrationDate = new Date().toISOString();
    }

    // Si no hay waiting-period-end, calcularlo
    if (!waitingPeriodEnd) {
        console.log(`⚠️ ${prefix}: No tiene waiting-period-end, calculando...`);
        const startDate = new Date(registrationDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + waitingPeriodDays);
        waitingPeriodEnd = endDate.toISOString();
        console.log(`✅ ${prefix}: waiting-period-end calculado: ${waitingPeriodEnd}`);
    }

    return {
        index,
        name,
        lastName,
        fullName: `${name} ${lastName || ''}`.trim(),
        petType,
        waitingPeriodDays,
        waitingPeriodEnd,
        registrationDate,
        isActive,
        isAdopted
      };
}

/**
 * Calcula el progreso del período de carencia
 */
function calculateProgress(pet) {
    const now = new Date();
    const endDate = new Date(pet.waitingPeriodEnd);
    const startDate = new Date(pet.registrationDate);

    console.log('📅 Calculando progreso para:', pet.name);
    console.log('   Fecha de inicio (registration-date):', pet.registrationDate);
    console.log('   Fecha de fin (waiting-period-end):', pet.waitingPeriodEnd);
    console.log('   Fecha actual:', now.toISOString());
    console.log('   Start Date parseado:', startDate.toISOString());
    console.log('   End Date parseado:', endDate.toISOString());

    // Usar el campo pet-X-waiting-period-days como días totales
    const totalDays = pet.waitingPeriodDays;

    // Calcular días transcurridos desde el registro (usando UTC para evitar problemas de zona horaria)
    const startDateUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const daysPassed = Math.floor((nowUTC - startDateUTC) / (1000 * 60 * 60 * 24));

    // Calcular días restantes hasta el fin del período
    const endDateUTC = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const daysRemaining = Math.max(0, Math.ceil((endDateUTC - nowUTC) / (1000 * 60 * 60 * 24)));

    // Calcular porcentaje basado en días transcurridos vs total
    const percentage = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

    console.log('   Días totales del período (waiting-period-days):', totalDays);
    console.log('   Días transcurridos:', daysPassed);
    console.log('   Días restantes:', daysRemaining);
    console.log('   Porcentaje completado:', Math.round(percentage) + '%');

    return {
        totalDays,
        daysPassed,
        daysRemaining,
        percentage: Math.round(percentage),
        isCompleted: daysRemaining === 0
    };
}

/**
 * Renderiza el panel con los datos de la mascota actual
 */
function renderPanel() {
    if (petsData.length === 0) return;

    const pet = petsData[currentPetIndex];
    const progress = calculateProgress(pet);

    console.log('📊 Progreso calculado:', progress);

    // Actualizar nombre de la mascota en el título
    updateElement('[data-pet-info="pet-name"]', pet.name);

    // Actualizar mensaje motivacional
    updateMotivationalMessage(progress.percentage);

    // Actualizar información de días
    updateElement('[data-pet-info="days-remaining"]', progress.daysRemaining);
    updateElement('[data-pet-info="days-text"]',
        `Faltan ${progress.daysRemaining} días para activar tu fondo solidario completo`
    );

    // Actualizar barra de progreso
    updateElement('[data-pet-info="percentage"]', `${progress.percentage}% completado`);
    updateElement('[data-pet-info="total-days"]', `Día ${progress.totalDays}`);

    const progressBar = document.querySelector('[data-pet-info="progress-bar"]');
    if (progressBar) {
        progressBar.style.width = `${progress.percentage}%`;
    }

    // Actualizar contador
    updateElement('[data-pet-info="countdown"]', progress.daysRemaining);

    // Actualizar mensaje adicional
    updateAdditionalMessage(pet);

    // Mostrar navegación si hay más de una mascota
    if (petsData.length > 1) {
        showPetNavigation();
    }
}

/**
 * Actualiza el mensaje motivacional según el progreso
 */
function updateMotivationalMessage(percentage) {
    let message = '';

    if (percentage >= 90) {
        message = '¡Casi lo logras! Ya falta muy poco.';
    } else if (percentage >= 75) {
        message = '¡Excelente! Estás en la recta final.';
    } else if (percentage >= 50) {
        message = '¡Ya recorriste más de la mitad del camino!';
    } else if (percentage >= 25) {
        message = '¡Vas muy bien! Sigue adelante.';
    } else {
        message = '¡Bienvenido! Tu período de carencia ha comenzado.';
    }

    updateElement('[data-pet-info="motivational"]', message);
}

/**
 * Actualiza el mensaje adicional según las características de la mascota
 */
function updateAdditionalMessage(pet) {
    let message = '';

    if (pet.isAdopted) {
        message = '¡Genial! Tu mascota tiene un período de carencia reducido de 90 días por ser adoptada.';
    } else {
        message = '¿Adoptaste a alguno de tus compañeros? Puedes acelerar tu acceso al fondo. Contáctanos para validar tus documentos.';
    }

    updateElement('[data-pet-info="additional-message"]', message);
}

/**
 * Muestra la navegación entre mascotas
 */
function showPetNavigation() {
    const navigation = document.getElementById('petNavigation');
    if (!navigation) return;

    navigation.style.display = 'flex';

    // Actualizar botones según el número de mascotas
    const buttons = navigation.querySelectorAll('.pet-nav-btn');
    buttons.forEach((btn, index) => {
        if (index < petsData.length) {
            btn.style.display = 'flex';
            const pet = petsData[index];
            const nameSpan = btn.querySelector('.pet-name');
            if (nameSpan) {
                // Mostrar solo el nombre (sin apellido) en los tabs
                nameSpan.textContent = pet.name;
            }

            // Actualizar el icono según el tipo de mascota
            const iconSpan = btn.querySelector('.pet-icon');
            if (iconSpan) {
                iconSpan.textContent = pet.petType === 'gato' ? '🐱' : '🐕';
            }

            // Marcar como activo si es la mascota actual
            if (index === currentPetIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        } else {
            btn.style.display = 'none';
        }
    });
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    const navigation = document.getElementById('petNavigation');
    if (!navigation) return;

    const buttons = navigation.querySelectorAll('.pet-nav-btn');
    buttons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (index < petsData.length) {
                switchToPet(index);
            }
        });
    });
}

/**
 * Cambia a mostrar otra mascota
 */
function switchToPet(index) {
    if (index === currentPetIndex || index >= petsData.length) return;

    currentPetIndex = index;

    // Agregar animación de fade
    const panelContent = document.querySelector('.panel-content');
    if (panelContent) {
        panelContent.style.opacity = '0';

        setTimeout(() => {
            renderPanel();
            panelContent.style.opacity = '1';
        }, 200);
    } else {
        renderPanel();
    }
}

/**
 * Actualiza el contenido de un elemento
 */
function updateElement(selector, content) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = content;
    }
}

/**
 * Oculta el mensaje de carga
 */
function hideLoading() {
    const loading = document.getElementById('loadingMessage');
    if (loading) {
        loading.style.display = 'none';
    }
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    hideLoading();

    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.querySelector('p').textContent = message;
        errorDiv.style.display = 'block';
    }

    // Ocultar el contenido principal
    const panelContent = document.querySelector('.panel-content');
    if (panelContent) {
        panelContent.style.display = 'none';
    }
}

/**
 * Actualiza el panel cada minuto (opcional)
 * REMOVIDO: No es necesario actualizar cada minuto ya que el período se mide en DÍAS.
 * El cálculo se hace una sola vez cuando se carga la página, lo cual es más eficiente.
 */
// setInterval(() => {
//     if (petsData.length > 0) {
//         renderPanel();
//     }
// }, 60000); // Actualizar cada minuto - DESHABILITADO para mejor performance
