/**
 * Password Visibility Toggle Widget v1.1
 * 
 * Corrección para el problema de los "2 clics":
 * - Protección contra múltiple inicialización.
 * - Uso de stopImmediatePropagation para evitar conflictos con otros scripts/Memberstack.
 * - Lógica de detección de input más robusta.
 */

(function() {
    'use strict';

    // Evitar que el script se inicialice más de una vez si se incluyó repetido
    if (window.__ms_password_toggle_initialized) {
        console.log('⚠️ Password Toggle already initialized. Skipping.');
        return;
    }
    window.__ms_password_toggle_initialized = true;

    function initPasswordToggle() {
        console.log('🔐 Password Toggle Widget v1.1 Active');
        
        // Usar capture phase para intentar ser los primeros en capturar el evento
        document.addEventListener('click', function(e) {
            const toggle = e.target.closest('[data-ms-toggle="password"]');
            if (!toggle) return;

            // Prevenir comportamientos por defecto y otros listeners
            e.preventDefault();
            e.stopImmediatePropagation();

            console.log('👁️ Toggle clicked');

            // 1. Localizar el input
            // Buscar en el mismo contenedor o por atributo de Memberstack
            const container = toggle.closest('.password-wrapper') || 
                            toggle.closest('.w-select-wrapper') || 
                            toggle.parentElement;
            
            let input = container ? container.querySelector('input[data-ms-member="password"], input[type="password"], input[type="text"]') : null;

            // Si hay un input de texto pero no es el de contraseña (ej. email), filtrar
            if (input && input.type === 'text' && !input.hasAttribute('data-ms-member') && !input.classList.contains('is-password')) {
               // Seguir buscando si el que encontramos no parece ser el correcto
            }

            if (!input) {
                input = document.querySelector('[data-ms-member="password"]');
            }

            if (!input) {
                console.warn('[PasswordToggle] Input not found');
                return;
            }

            // Realizar el cambio de tipo
            const currentType = input.getAttribute('type');
            const newType = currentType === 'password' ? 'text' : 'password';
            
            console.log(`🔄 Switching type from ${currentType} to ${newType}`);
            input.setAttribute('type', newType);
            
            // Forzar actualización visual en algunos navegadores/entornos
            input.type = newType;

            // Actualizar estado visual del botón (añadir/quitar clase)
            if (newType === 'text') {
                toggle.classList.add('is-showing');
                toggle.setAttribute('aria-label', 'Ocultar contraseña');
                toggle.style.opacity = '1';
            } else {
                toggle.classList.remove('is-showing');
                toggle.setAttribute('aria-label', 'Mostrar contraseña');
                toggle.style.opacity = '0.6';
            }

            // Sincronizar iconos internos si existen
            const showIcon = toggle.querySelector('[data-icon="show"]');
            const hideIcon = toggle.querySelector('[data-icon="hide"]');
            
            if (showIcon && hideIcon) {
                showIcon.style.display = (newType === 'password') ? 'block' : 'none';
                hideIcon.style.display = (newType === 'text') ? 'block' : 'none';
            }
        }, true); // Use capture phase
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPasswordToggle);
    } else {
        initPasswordToggle();
    }
})();
