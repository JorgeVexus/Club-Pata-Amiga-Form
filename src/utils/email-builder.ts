/**
 * 📧 Email Builder (Server-side)
 * Construye el HTML de los correos electrónicos con el diseño de marca de Pata Amiga.
 */

export interface EmailParams {
    memberName: string;
    subject: string;
    content: string; // Texto plano con saltos de línea
    audience?: 'member' | 'ambassador' | 'wellness-center' | 'general';
    ctaUrl?: string;
    ctaLabel?: string;
}

const AUDIENCE_COLORS = {
    member: '#FE4B5B', // Rosa
    ambassador: '#FE8F15', // Naranja
    'wellness-center': '#7DD8D5', // Turquesa
    general: '#00BBB4', // Verde Teal
};

const LOGO_URL = "https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6929d5ea79839f5517dc2edd_2ccd338fb84f816d8245097d8203902f_client-first-logo-white.png";
const PAW_ICON_URL = "https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693b20b431b6b876fa5356ee_Icon%20huella.svg";

export function buildBrandedEmailHtml({
    memberName,
    subject,
    content,
    audience = 'general',
    ctaUrl,
    ctaLabel
}: EmailParams): string {
    const headerColor = AUDIENCE_COLORS[audience] || AUDIENCE_COLORS.general;
    
    // Procesar el contenido para convertir saltos de línea en párrafos
    const paragraphs = content
        .split('\n')
        .filter(p => p.trim() !== '')
        .map(p => `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4A5568;">${p}</p>`)
        .join('');

    const ctaButton = ctaUrl && ctaLabel 
        ? `<div style="text-align: center; margin: 32px 0;">
            <a href="${ctaUrl}" style="display: inline-block; background-color: #FE8F15; color: #FFFFFF; font-family: 'Outfit', Arial, sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 50px; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; transition: all 0.2s ease;">
                ${ctaLabel}
            </a>
           </div>`
        : '';

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
        <style>
            @font-face {
                font-family: 'Fraiche';
                src: url('https://fonts.cdnfonts.com/s/91238/Fraiche-Regular.woff') format('woff');
                font-weight: normal;
                font-style: normal;
            }
            body {
                margin: 0;
                padding: 0;
                background-color: #F7F8FA;
                font-family: 'Outfit', Helvetica, Arial, sans-serif;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #FFFFFF;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                border: 1px solid #E2E8F0;
            }
            .header {
                background-color: ${headerColor};
                padding: 40px 20px;
                text-align: center;
                position: relative;
            }
            .logo {
                height: 48px;
                margin-bottom: 20px;
            }
            .decoration {
                position: absolute;
                bottom: -15px;
                right: 20px;
                width: 60px;
                opacity: 0.2;
            }
            .content {
                padding: 40px;
            }
            .greeting {
                font-size: 28px;
                font-weight: 700;
                color: #1A202C;
                margin: 0 0 8px;
                font-family: 'Outfit', sans-serif;
            }
            .sub-greeting {
                font-size: 18px;
                color: #718096;
                margin: 0 0 24px;
            }
            .divider {
                height: 1px;
                background-color: #EDF2F7;
                margin: 32px 0;
                border: none;
            }
            .footer {
                padding: 32px 40px;
                background-color: #F8FAFC;
                text-align: center;
                border-top: 1px solid #EDF2F7;
            }
            .footer-text {
                font-size: 13px;
                color: #A0AEC0;
                margin: 0 0 8px;
            }
            .footer-links a {
                color: ${headerColor};
                text-decoration: none;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${LOGO_URL}" alt="Club Pata Amiga" class="logo">
                <img src="${PAW_ICON_URL}" alt="" class="decoration">
                <div style="color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
                    Comunicación Oficial
                </div>
            </div>
            
            <div class="content">
                <h1 class="greeting">¡Hola, ${memberName}! 🐾</h1>
                <p class="sub-greeting">${subject}</p>
                
                <div class="divider"></div>
                
                <div class="message-body">
                    ${paragraphs}
                </div>
                
                ${ctaButton}
                
                <div class="divider"></div>
                
                <p style="margin: 0; font-size: 15px; color: #4A5568; line-height: 1.6;">
                    Si tienes alguna duda o necesitas asistencia inmediata, recuerda que estamos aquí para ti y tus peludos.
                </p>
                
                <p style="margin: 24px 0 0; font-size: 15px; font-weight: 700; color: #1A202C;">
                    Con cariño,<br>
                    <span style="color: ${headerColor};">El equipo de Club Pata Amiga</span>
                </p>
            </div>
            
            <div class="footer">
                <p class="footer-text">© ${new Date().getFullYear()} Club Pata Amiga. Todos los derechos reservados.</p>
                <p class="footer-text">Este es un mensaje automático enviado a través de nuestra plataforma administrativa.</p>
                <div class="footer-links">
                    <a href="https://pataamiga.mx">Sitio Web</a> • 
                    <a href="https://club.pataamiga.mx">Portal del Miembro</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}
