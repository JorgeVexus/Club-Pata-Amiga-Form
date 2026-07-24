# -*- coding: utf-8 -*-
"""Generador de los correos "Completa el perfil de tu peludo" · Club Pata Amiga.

Cómo funciona:
  - Edita los textos en COPY (por día) o los colores/estructura en PLANTILLA.
  - Corre:  python generar_correos.py
  - Regenera los 12 HTML (4 días x 3 variantes) + index.html de vista previa.

Variantes por día (se envía solo la que corresponda al perfil):
  ambos       -> le faltan foto y certificado médico   (tarjeta teal)
  foto        -> solo le falta la foto                  (tarjeta amarilla)
  certificado -> solo le falta el certificado médico    (tarjeta naranja)

Variables de plantilla (rellénalas en tu herramienta de envío):
  {{nombre}}  {{nombre_peludo}}  {{url_completar}}
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- tokens
CREMA = "#FAF7F1"
TEAL = "#1CBCAD"
TEAL_OSCURO = "#1E5350"
TEXTO = "#3D524F"
AMARILLO = "#FFC20E"
NARANJA = "#F7941D"
ROSA = "#F23D6D"          # acento de urgencia (cuenta regresiva)
VERDE = "#A6CE39"

FUENTE_TITULO = "'Baloo 2','Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif"
FUENTE_TEXTO = "'Outfit',Arial,Helvetica,sans-serif"

VARIANTES = {
    "ambos": {
        "color_tarjeta": TEAL, "color_texto_tarjeta": "#FFFFFF",
        "items": ["foto", "certificado"],
        "titulo_tarjeta": "Solo faltan estos dos detalles:",
    },
    "foto": {
        "color_tarjeta": AMARILLO, "color_texto_tarjeta": TEAL_OSCURO,
        "items": ["foto"],
        "titulo_tarjeta": "Solo falta este detalle:",
    },
    "certificado": {
        "color_tarjeta": NARANJA, "color_texto_tarjeta": TEAL_OSCURO,
        "items": ["certificado"],
        "titulo_tarjeta": "Solo falta este detalle:",
    },
}

ICONOS = {"foto": "📷", "certificado": "🩺"}

# textos de los renglones de la tarjeta; el día 15 usa versiones largas
ITEM_CORTO = {
    "foto": ("Su FOTO", "(para reconocerlo al momento)"),
    "certificado": ("Su CERTIFICADO MÉDICO", "(para saber cómo cuidarlo mejor)"),
}
ITEM_LARGO = {
    "foto": ("SU FOTO MÁS GUAPA:", "Queremos conocerlo y que su perfil sea único."),
    "certificado": ("SU CERTIFICADO MÉDICO:",
                    "Es indispensable para tener su historial al día y acompañarlo como se merece."),
}

# ---------------------------------------------------------------- copy por día
COPY = {
    "dia15": {
        "titulo": "¡Bienvenido a la manada! Completa el perfil de {{nombre_peludo}}",
        "preheader": "El perfil de {{nombre_peludo}} está a nada de quedar completo 🐾",
        "hero": "assets/hero-dia15.png",
        "items_largos": True,
        "parrafos_antes": [
            "Nos da muchísimo gusto que ya seas parte de la manada 🐾",
            "Estábamos viendo el perfil de <strong>{{nombre_peludo}}</strong> y está a nada de quedar completo. "
            "Solo nos {FALTAN} para conocerlo mejor y poder acompañarte cuando lo necesites:",
        ],
        "parrafos_despues": [
            "Con esto listo, podemos estar preparados para acompañarte en cualquier momento. "
            "Es muy rápido y puedes hacerlo directamente desde tu panel.",
        ],
        "subtitulo_cta": "No te tomará más de unos minutos",
        "cta": "Completar perfil de {{nombre_peludo}}",
        "cierre": [
            "Si necesitas ayuda para subirlos o tienes cualquier duda, aquí estamos para ayudarte.",
        ],
        "firma": "Un abrazo,<br><strong>La manada Pata Amiga®</strong>",
    },
    "dia3": {
        "titulo": "Quedan 3 días para completar el perfil de {{nombre_peludo}}",
        "preheader": "Quedan 3 días para completar el perfil de {{nombre_peludo}}",
        "hero": "assets/hero-dia3.png",
        "items_largos": False,
        "parrafos_antes": [
            "Sabemos que el día a día se llena de cosas… y justo por eso queríamos escribirte hoy.",
            f'Quedan <strong style="color:{ROSA};">3 DÍAS</strong> para completar el perfil de '
            "<strong>{{nombre_peludo}}</strong> y estás a un paso de dejar todo listo.",
            "Tener su información completa nos permite acompañarte mejor y reaccionar a tiempo "
            "cuando lo necesites.",
        ],
        "parrafos_despues": [],
        "subtitulo_cta": "Te toma menos de un minuto",
        "cta": "Completar perfil ahora",
        "cierre": ["Hazlo hoy y te olvidas de este pendiente 💛"],
        "firma": "Aquí estamos para ustedes, siempre.<br><strong>La manada Pata Amiga®</strong>",
    },
    "dia2": {
        "titulo": "Quedan 2 días — deja listo el perfil de {{nombre_peludo}}",
        "preheader": "Quedan 2 días… es rapidísimo dejarlo listo hoy",
        "hero": "assets/hero-dia2.png",
        "items_largos": False,
        "parrafos_antes": [
            "Pasamos por aquí porque ya estamos muy cerca del cierre: quedan "
            f'<strong style="color:{ROSA};">2 DÍAS</strong> para completar el perfil de '
            "<strong>{{nombre_peludo}}</strong>.",
            "Sabemos que entre todo lo del día esto puede quedarse para después… "
            "<strong>pero hoy es el mejor momento para dejarlo listo.</strong>",
            "Con su información completa, podemos acompañarte y reaccionar a tiempo cuando lo necesites.",
        ],
        "parrafos_despues": [],
        "subtitulo_cta": "Lo puedes dejar listo en un momento",
        "cta": "Dejarlo listo ahora",
        "cierre": [
            "No lo dejes pasar… {{nombre_peludo}} está a nada de estar completamente "
            "dentro de la manada 💛",
        ],
        "firma": "Estamos contigo,<br><strong>La manada Pata Amiga®</strong>",
    },
    "dia1": {
        "titulo": "Último día para completar el perfil de {{nombre_peludo}}",
        "preheader": "Hoy es el último día para completar el perfil de {{nombre_peludo}} 💛",
        "hero": "assets/hero-dia1.png",
        "items_largos": False,
        "parrafos_antes": [
            "Pasamos por aquí con el último aviso 🐾",
            f'Hoy es el <strong style="color:{ROSA};">ÚLTIMO DÍA</strong> para completar el perfil de '
            "<strong>{{nombre_peludo}}</strong> y estás a un paso de dejar todo listo.",
            "Sabemos que el día se llena… pero este pequeño paso hace toda la diferencia.",
            "Con su información completa, <strong>puedes contar con tu manada cuando lo "
            "necesites</strong> 💛",
        ],
        "parrafos_despues": [],
        "subtitulo_cta": "Estás a un paso de dejarlo listo",
        "cta": "Completar perfil",
        "cierre": [
            "Hazlo hoy y quédate con la tranquilidad de que {{nombre_peludo}} ya está "
            "completamente dentro de la manada.",
        ],
        "firma": "Estamos contigo, siempre 💛<br><strong>La manada Pata Amiga®</strong>",
    },
}


# ---------------------------------------------------------------- armado html
def fila_item(item, largo, color_texto):
    titulo, desc = (ITEM_LARGO if largo else ITEM_CORTO)[item]
    return f"""
        <tr>
          <td width="56" valign="top" style="padding:10px 0;">
            <div style="width:44px;height:44px;background-color:#FFFFFF;border-radius:999px;text-align:center;line-height:44px;font-size:22px;">{ICONOS[item]}</div>
          </td>
          <td valign="middle" style="padding:10px 0 10px 14px;font-family:{FUENTE_TEXTO};color:{color_texto};">
            <p style="margin:0;font-size:16px;font-weight:700;">{titulo}</p>
            <p style="margin:2px 0 0;font-size:14px;line-height:1.45;">{desc}</p>
          </td>
        </tr>"""


def divisor(color_texto):
    return f"""
        <tr><td colspan="2" style="padding:2px 0;"><div style="border-top:1px solid {color_texto};opacity:0.35;font-size:0;line-height:0;">&nbsp;</div></td></tr>"""


def correo(dia, variante):
    c = COPY[dia]
    v = VARIANTES[variante]

    faltan = ("faltan un par de detalles" if len(v["items"]) == 2 else "falta un detalle")
    parrafos_antes = [p.replace("{FALTAN}", faltan) for p in c["parrafos_antes"]]

    filas = []
    for i, item in enumerate(v["items"]):
        if i:
            filas.append(divisor(v["color_texto_tarjeta"]))
        filas.append(fila_item(item, c["items_largos"], v["color_texto_tarjeta"]))
    filas_html = "".join(filas)

    parrafo = lambda t: (f'<p style="margin:0 0 18px;font-family:{FUENTE_TEXTO};font-size:16px;'
                         f'line-height:1.6;color:{TEXTO};">{t}</p>')
    antes = "".join(parrafo(t) for t in parrafos_antes)
    despues = "".join(parrafo(t) for t in c["parrafos_despues"])
    cierre = "".join(parrafo(t) for t in c["cierre"])

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>{c['titulo']}</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* Los clientes de correo usan los estilos inline; esto es solo respaldo/preview. */
  body {{ margin:0; padding:0; }}
  @media (max-width:620px) {{ .contenedor {{ width:100% !important; }} }}
</style>
</head>
<body style="margin:0;padding:0;background-color:{CREMA};">
<!-- Preheader oculto -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{c['preheader']}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{CREMA};">
  <tr><td align="center" style="padding:0 0 0;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="contenedor" style="max-width:600px;width:100%;background-color:{CREMA};">

      <!-- Cabecera: saludo + peludo asomándose -->
      <tr><td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="45%" valign="bottom" style="padding:30px 0 6px 32px;">
              <img src="assets/paw-teal.png" width="72" alt="" style="display:block;width:72px;height:auto;margin:0 0 22px;">
              <h1 style="margin:0;font-family:{FUENTE_TITULO};font-size:32px;line-height:1.1;color:{TEAL_OSCURO};font-weight:800;">¡Hola,<br>{{{{nombre}}}}!</h1>
            </td>
            <td width="55%" valign="top" align="right" style="padding:0;">
              <img src="{c['hero']}" width="330" alt="Peludo de la manada Pata Amiga" style="display:block;width:330px;max-width:100%;height:auto;">
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Cuerpo -->
      <tr><td style="padding:26px 32px 0;">
        {antes}
      </td></tr>

      <!-- Tarjeta de pendientes -->
      <tr><td style="padding:8px 32px 0;">
        <h2 style="margin:0 0 16px;font-family:{FUENTE_TITULO};font-size:22px;line-height:1.25;color:{TEAL_OSCURO};font-weight:700;text-align:center;">{v['titulo_tarjeta']}</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{v['color_tarjeta']};border-radius:24px;">
          <tr><td style="padding:20px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{filas_html}
            </table>
          </td></tr>
        </table>
      </td></tr>

      {f'<tr><td style="padding:22px 32px 0;">{despues}</td></tr>' if despues else ''}

      <!-- CTA -->
      <tr><td style="padding:26px 32px 6px;text-align:center;">
        <h2 style="margin:0 0 18px;font-family:{FUENTE_TITULO};font-size:24px;line-height:1.25;color:{TEAL_OSCURO};font-weight:700;">{c['subtitulo_cta']}</h2>
        <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
          <tr><td style="background-color:{TEAL_OSCURO};border-radius:999px;">
            <a href="{{{{url_completar}}}}" style="display:inline-block;padding:16px 42px;font-family:{FUENTE_TITULO};font-size:17px;font-weight:700;color:#FFFFFF;text-decoration:none;">{c['cta']}</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Cierre -->
      <tr><td style="padding:24px 32px 0;">
        {cierre}
        <p style="margin:0;font-family:{FUENTE_TEXTO};font-size:16px;line-height:1.6;color:{TEXTO};">{c['firma']}</p>
      </td></tr>

      <!-- Footer con la familia -->
      <tr><td style="padding:30px 0 0;">
        <img src="assets/footer-familia.png" width="600" alt="La manada Pata Amiga" style="display:block;width:100%;height:auto;">
      </td></tr>
      <tr><td style="background-color:{TEAL};padding:4px 32px 26px;text-align:center;">
        <p style="margin:0 0 8px;font-family:{FUENTE_TEXTO};font-size:13px;font-weight:700;color:#FFFFFF;">Club Pata Amiga · Protección para tu manada</p>
        <p style="margin:0 0 10px;font-family:{FUENTE_TEXTO};font-size:12px;line-height:1.7;color:#EAF9F7;">
          ¿Dudas? Escríbenos a <a href="mailto:soporte@pataamiga.mx" style="color:#FFFFFF;text-decoration:underline;">soporte@pataamiga.mx</a> — estamos para ayudarte.
        </p>
        <p style="margin:0;font-family:{FUENTE_TEXTO};font-size:11px;line-height:1.6;color:#D3F2EE;">
          Pata Amiga es una membresía de salud para mascotas. No es un seguro.<br>
          Recibes este correo porque formas parte de la manada Pata Amiga.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>
"""


def indice(archivos):
    tarjetas = "".join(
        f"""
      <figure>
        <figcaption>{nombre}</figcaption>
        <iframe src="{nombre}" loading="lazy"></iframe>
        <a href="{nombre}" target="_blank">abrir</a>
      </figure>"""
        for nombre in archivos
    )
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Correos · Completar perfil · Pata Amiga</title>
<style>
  body {{ font-family: system-ui, sans-serif; background:#F1EBDF; margin:24px; }}
  h1 {{ color:#1E5350; }}
  p.nota {{ max-width:70ch; color:#3D524F; }}
  .malla {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:20px; }}
  figure {{ margin:0; background:#fff; border-radius:14px; padding:12px; box-shadow:0 2px 8px rgb(0 0 0 / .08); }}
  figcaption {{ font-weight:600; color:#1E5350; margin-bottom:8px; font-size:14px; }}
  iframe {{ width:100%; height:520px; border:1px solid #e5e0d5; border-radius:8px; background:#FAF7F1; }}
  a {{ color:#1CBCAD; font-size:13px; }}
</style>
</head>
<body>
<h1>Correos "Completa el perfil de tu peludo"</h1>
<p class="nota">4 momentos del journey (día 15, 3, 2 y último día) × 3 variantes según lo que
falte en el perfil (foto + certificado · solo foto · solo certificado). Variables:
<code>{{{{nombre}}}}</code>, <code>{{{{nombre_peludo}}}}</code>, <code>{{{{url_completar}}}}</code>.</p>
<div class="malla">{tarjetas}
</div>
</body>
</html>
"""


if __name__ == "__main__":
    archivos = []
    for dia in ["dia15", "dia3", "dia2", "dia1"]:
        for variante in ["ambos", "foto", "certificado"]:
            nombre = f"correo-{dia}-{variante}.html"
            with open(os.path.join(BASE, nombre), "w", encoding="utf-8") as f:
                f.write(correo(dia, variante))
            archivos.append(nombre)
            print("ok", nombre)
    with open(os.path.join(BASE, "index.html"), "w", encoding="utf-8") as f:
        f.write(indice(archivos))
    print("ok index.html")
