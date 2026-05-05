
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Información Faltante | Club Pata Amiga</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #FE8F15;
            --accent: #15BEB2;
            --surface: #FFFFFF;
            --fg: #000000;
            --border: rgba(0, 0, 0, 0.15);
            --upload-bg: #CAF5F2;
            
            --font-main: 'Outfit', sans-serif;
            --radius-card: 66px;
            --radius-btn: 50px;
            --padding-card: clamp(24px, 5vw, 48px);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
        }

        body {
            font-family: var(--font-main);
            background-color: var(--bg);
            color: var(--fg);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow-x: hidden;
            position: relative;
        }

        .bg-letter {
            position: absolute;
            width: 1000px;
            max-width: 150%;
            left: -200px;
            top: 100px;
            transform: rotate(-3deg);
            opacity: 0.8;
            pointer-events: none;
            z-index: 0;
        }

        .container {
            width: 100%;
            max-width: 1100px;
            padding: 60px 24px;
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 32px;
            animation: slideUp 0.8s ease-out forwards;
        }

        .header {
            max-width: 900px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .header h1 {
            color: white;
            font-size: clamp(48px, 8vw, 100px);
            font-weight: 800;
            line-height: 1;
            letter-spacing: -0.02em;
        }

        .header-sub {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: clamp(16px, 2vw, 18px);
            line-height: 1.4;
        }

        .card {
            background: var(--surface);
            border-radius: var(--radius-card);
            padding: var(--padding-card);
            display: flex;
            flex-direction: column;
            gap: 24px;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.1);
        }

        .card-header {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .card-title {
            font-size: clamp(32px, 5vw, 50px);
            font-weight: 800;
            line-height: 1.1;
        }

        .card-intro {
            font-size: clamp(16px, 1.5vw, 20px);
            color: rgba(0, 0, 0, 0.7);
        }

        /* Progress Bar */
        .progress-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .progress-labels {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: var(--fg);
        }

        .progress-bar-container {
            width: 100%;
            height: 20px;
            background: #f0f0f0;
            border-radius: 50px;
            border: 0.5px solid #000;
            overflow: hidden;
        }

        .progress-bar-fill {
            height: 100%;
            width: 0%;
            background: var(--accent);
            border-radius: 50px;
            transition: width 1.5s ease-in-out;
            background-image: linear-gradient(-45deg, rgba(255, 255, 255, 0.2) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.2) 75%, transparent 75%, transparent);
            background-size: 20px 20px;
        }

        /* Missing Info Box */
        .info-missing-box {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-top: 10px;
        }

        .mascot-icon {
            width: 150px;
            height: 150px;
            background: var(--accent);
            border-radius: 18px;
            flex-shrink: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }

        .mascot-icon img {
            width: 90%;
            height: 90%;
            object-fit: contain;
        }

        .info-text-card {
            padding: 20px;
            border: 1px solid var(--border);
            border-radius: 18px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .info-text-card h3 {
            font-size: 18px;
            font-weight: 400;
        }

        .info-text-card strong {
            font-weight: 700;
        }

        .info-text-card p {
            font-size: 16px;
            color: rgba(0, 0, 0, 0.8);
            line-height: 1.4;
        }

        /* Upload Section */
        .upload-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .upload-instruction {
            font-size: 16px;
            font-weight: 400;
        }

        .upload-disclaimer {
            font-size: 12px;
            opacity: 0.5;
            line-height: 1.3;
        }

        .upload-area {
            height: 120px;
            background: var(--upload-bg);
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: transform 0.2s;
            text-align: center;
            padding: 10px;
        }

        .upload-area:hover {
            transform: scale(1.01);
        }

        .upload-icon {
            width: 40px;
            height: 40px;
            margin-bottom: 8px;
        }

        .upload-area span {
            font-size: 12px;
            color: rgba(0, 0, 0, 0.6);
        }

        .upload-area .underline {
            text-decoration: underline;
            font-weight: 500;
        }

        /* Footer / Button */
        .cta-container {
            display: flex;
            justify-content: center;
            margin-top: 10px;
        }

        .btn-submit {
            background: var(--accent);
            color: var(--fg);
            padding: 12px 60px;
            border-radius: var(--radius-btn);
            font-size: 18px;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            cursor: pointer;
            box-shadow: 0 8px 16px rgba(21, 190, 178, 0.3);
        }

        .btn-submit:hover {
            transform: translateY(-4px) scale(1.05);
            box-shadow: 0 12px 24px rgba(21, 190, 178, 0.4);
            background-color: #18d8ca;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 40px 16px;
            }
            .info-missing-box {
                flex-direction: column;
                align-items: flex-start;
            }
            .mascot-icon {
                width: 100px;
                height: 100px;
            }
            .btn-submit {
                width: 100%;
                text-align: center;
            }
            .card {
                border-radius: 40px;
            }
        }
    </style>
</head>
<body>

    <img src="https://res.cloudinary.com/dqy07kgu6/image/upload/v1777945368/letra_a_orange_vuxixu.png" alt="Decor" class="bg-letter">

    <main class="container">
        <header class="header">
            <h1 data-od-id="greeting">¡hola, Azalia!</h1>
            <div class="header-sub">
                <p><strong>Gracias por tu paciencia</strong></p>
                <p>Recibimos tu solicitud y ya estamos revisando la información para poder continuar con tu proceso. Mientras tanto, puedes entrar aquí cuando quieras para ver tu estatus actualizado.</p>
            </div>
        </header>

        <section class="card">
            <div class="card-header">
                <h2 class="card-title" data-od-id="card-title">aviso de información faltante</h2>
                <p class="card-intro">Recibimos tu solicitud y ya estamos revisando la información para poder continuar con tu proceso.</p>
            </div>

            <div class="progress-section">
                <div class="progress-labels">
                    <span>Solicitud enviada</span>
                    <span>En revisión...</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" id="progressBar"></div>
                </div>
            </div>

            <div class="info-missing-box">
                <div class="mascot-icon">
                    <!-- Usando un SVG que representa el icono de la cámara del diseño -->
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 60%; height: 60%;">
                        <rect x="10" y="25" width="80" height="60" rx="5" stroke="black" stroke-width="4"/>
                        <circle cx="50" cy="55" r="15" stroke="black" stroke-width="4"/>
                        <rect x="70" y="35" width="10" height="10" rx="2" fill="black"/>
                        <path d="M35 25L42 15H58L65 25" stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="info-text-card">
                    <h3>Información faltante en el registro de <strong>Firulais</strong></h3>
                    <p data-od-id="missing-description">Vimos que subiste las fotos, pero falta una selfie contigo y tu perrito. Esta imagen es obligatoria para validar el registro.</p>
                </div>
            </div>

            <div class="upload-section">
                <p class="upload-instruction">Sube una selfie para completar tu registro y continuar ♥️</p>
                <p class="upload-disclaimer">Para completar el proceso, necesitamos una selfie contigo y tu perrito. Las fotos cargadas no incluyen esta imagen, que es obligatoria.</p>
                
                <div class="upload-area" data-od-id="dropzone">
                    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="#15BEB2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M3 15V16C3 18.2091 4.79086 20 7 20H17C19.2091 20 21 18.2091 21 16V15" stroke="#15BEB2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Arrastra y suelta archivos tus imagenes aquí o <span class="underline">explora</span></span>
                    <span>PDF, JPG o PNG - Máx. 5MB</span>
                </div>
            </div>

            <div class="cta-container">
                <button class="btn-submit" data-od-id="btn-send">Enviar</button>
            </div>
        </section>
    </main>

    <script>
        window.addEventListener('load', () => {
            setTimeout(() => {
                const bar = document.getElementById('progressBar');
                bar.style.width = '65%';
            }, 300);
        });
    </script>
</body>
</html>
