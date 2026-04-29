/**
 * 🎨 Email Preview Builder (Client-side)
 * Genera el HTML para la vista previa en el dashboard.
 */

interface PreviewParams {
    memberName: string;
    subject: string;
    content: string;
    audience: 'member' | 'ambassador' | 'wellness-center' | 'general';
}

const AUDIENCE_COLORS = {
    member: '#FE4B5B',
    ambassador: '#FE8F15',
    'wellness-center': '#7DD8D5',
    general: '#00BBB4',
};

const LOGO_URL = "https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/6929d5ea79839f5517dc2edd_2ccd338fb84f816d8245097d8203902f_client-first-logo-white.png";
const PAW_ICON_URL = "https://cdn.prod.website-files.com/6929d5e779839f5517dc2ded/693b20b431b6b876fa5356ee_Icon%20huella.svg";

export function buildEmailPreview({ memberName, subject, content, audience }: PreviewParams): string {
    const headerColor = AUDIENCE_COLORS[audience] || AUDIENCE_COLORS.general;
    
    const paragraphs = content
        .split('\n')
        .filter(p => p.trim() !== '')
        .map(p => `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4A5568;">${p}</p>`)
        .join('');

    return `
    <html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body {
                margin: 0;
                padding: 20px;
                background-color: #F0F2F5;
                font-family: 'Outfit', sans-serif;
            }
            .preview-card {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
                background-color: ${headerColor};
                padding: 24px;
                text-align: center;
            }
            .logo { height: 32px; }
            .content { padding: 32px; }
            .greeting { font-size: 20px; font-weight: 700; color: #1A202C; margin: 0 0 4px; }
            .sub-greeting { font-size: 14px; color: #718096; margin: 0 0 16px; }
            .divider { height: 1px; background-color: #EDF2F7; margin: 20px 0; border: none; }
            .footer { padding: 20px; background-color: #F8FAFC; text-align: center; border-top: 1px solid #EDF2F7; font-size: 11px; color: #A0AEC0; }
        </style>
    </head>
    <body>
        <div class="preview-card">
            <div class="header">
                <img src="${LOGO_URL}" class="logo">
            </div>
            <div class="content">
                <h1 class="greeting">¡Hola, ${memberName}! 🐾</h1>
                <p class="sub-greeting">${subject}</p>
                <div class="divider"></div>
                <div class="paragraphs">${paragraphs}</div>
                <div class="divider"></div>
                <p style="margin: 16px 0 0; font-size: 14px; font-weight: 700; color: #1A202C;">
                    Con cariño,<br>
                    <span style="color: ${headerColor};">El equipo de Club Pata Amiga</span>
                </p>
            </div>
            <div class="footer">
                © ${new Date().getFullYear()} Club Pata Amiga
            </div>
        </div>
    </body>
    </html>
    `;
}
