/**
 * Password Visibility Toggle Widget
 * 
 * Este script añade la funcionalidad de mostrar/ocultar contraseña 
 * a formularios de Webflow, especialmente útil con Memberstack.
 * 
 * Uso:
 * 1. Campo de contraseña: debe tener type="password" o data-ms-member="password"
 * 2. Botón/Link de ojo: añadir atributo data-ms-toggle="password"
 */

(function() {
    'use strict';

    function initPasswordToggle() {
        console.log('🔐 Password Toggle Widget Initialized');
        
        document.addEventListener('click', function(e) {
            // Buscar el disparador del toggle
            const toggle = e.target.closest('[data-ms-toggle="password"]');
            if (!toggle) return;

            e.preventDefault();
            e.stopPropagation();

            // 1. Intentar encontrar el input relativo al toggle (mismo contenedor)
            const container = toggle.closest('.password-wrapper') || 
                            toggle.closest('.w-select-wrapper') || 
                            toggle.parentElement;
            
            let input = container ? container.querySelector('input[data-ms-member="password"], input[type="password"], input[type="text"].is-password-field') : null;

            // 2. Si no se encuentra, buscar el hermano anterior (típico en Webflow)
            if (!input) {
                input = toggle.previousElementSibling;
                while (input && input.tagName !== 'INPUT') {
                    input = input.previousElementSibling;
                }
            }

            // 3. Último recurso: buscar el primer campo de contraseña de Memberstack en la página
            if (!input) {
                input = document.querySelector('[data-ms-member="password"]');
            }

            if (!input) {
                console.warn('[PasswordToggle] No se encontró el campo de contraseña asociado.');
                return;
            }

            // Realizar el toggle
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            
            // Actualizar estado visual del botón
            if (!isPassword) {
                toggle.classList.remove('is-showing');
                toggle.setAttribute('aria-label', 'Mostrar contraseña');
            } else {
                toggle.classList.add('is-showing');
                toggle.setAttribute('aria-label', 'Ocultar contraseña');
            }

            // Sincronizar iconos si tienen data-attributes (opcional para el usuario)
            const showIcon = toggle.querySelector('[data-icon="show"]');
            const hideIcon = toggle.querySelector('[data-icon="hide"]');
            
            if (showIcon && hideIcon) {
                showIcon.style.display = isPassword ? 'none' : 'block';
                hideIcon.style.display = isPassword ? 'block' : 'none';
            } else {
                // Si no hay iconos específicos, podemos jugar con la opacidad del botón
                toggle.style.opacity = isPassword ? '1' : '0.6';
            }

            // Devolver el foco al input para que el usuario pueda seguir escribiendo
            // input.focus();
        });
    }

    // Iniciar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPasswordToggle);
    } else {
        initPasswordToggle();
    }
})();
