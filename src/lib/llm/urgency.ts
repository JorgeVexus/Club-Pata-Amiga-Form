/**
 * Detección de nivel de urgencia sobre el mensaje del miembro. Alimenta el
 * tono de la respuesta (derivar al veterinario de confianza + flujo de
 * reintegro) y el aviso de reintegro en la UI.
 *
 * Niveles (del requerimiento del cliente, VF_Requerimiento):
 *   red    🔴 emergencia inmediata → derivar YA al veterinario de confianza
 *   orange 🟠 consulta prioritaria (12-24 h) → recopilar datos y sugerir consulta
 *   yellow 🟡 monitoreo en casa → orientación general segura
 *
 * Sesgo hacia recall: un falso positivo muestra un aviso inofensivo; un falso
 * negativo oculta una guía importante.
 */

export type TriageLevel = "red" | "orange" | "yellow";

/**
 * Banderas rojas de emergencia inmediata, incluidos modismos mexicanos que
 * los tutores usan de verdad ("le di un hueso", "sacó la basura", "se comió
 * una planta"). Del anexo de red flags del requerimiento.
 */
const RED_FLAGS: RegExp[] = [
  /no\s+respira|dificultad\s+(para\s+)?respir|se\s+ahog|ahogand/i,
  /convulsion|convulsion(a|ó)|ataque/i,
  /sangr(a|e|ado|rando)|vomit\w*\s+sangre|hemorrag/i,
  /desmay|inconscien|no\s+reacciona|perd(ió|io)\s+el\s+conocimiento/i,
  /atropell|lo\s+pis(ó|o)\s+un\s+(carro|coche|auto)/i,
  /envenen|intox|se\s+comi(ó|o)\s+(veneno|raticida)/i,
  /chocolate|uvas?|pasas|cebolla|ajo|xilitol/i, // tóxicos comunes
  /ingiri(ó|o)|se\s+trag(ó|o)|se\s+comi(ó|o)\s+(una?\s+)?(planta|hueso|basura|calcet|juguete|pila|moneda)/i,
  /le\s+di\s+un\s+hueso/i,
  /sac(ó|o)\s+la\s+basura/i,
  /no\s+puede\s+(caminar|pararse|levantarse|moverse|respirar)/i,
  /paraliz|no\s+siente\s+las?\s+patas/i,
  /fractur|hueso\s+(roto|expuesto|de\s+fuera)|se\s+rompi(ó|o)/i,
  /golpe\s+fuerte|se\s+peg(ó|o)\s+(muy\s+)?fuerte|ca(í|i)da\s+(fuerte|de\s+altura)/i,
  /abdomen\s+(distendido|hinchado|duro)|panza\s+(muy\s+)?(dura|hinchada)/i,
  /no\s+(toma|bebe|ha\s+tomado)\s+agua\s+.*(12|dos?\s+d(í|i)as|much)/i,
  /diarrea\s+(explosiva|con\s+sangre|negra)/i,
  /temperatura\s+(muy\s+)?(alta|baja)|hipotermia|golpe\s+de\s+calor/i,
  /no\s+deja\s+de\s+(vomitar|convulsionar|sangrar)/i,
];

/** Consulta prioritaria (12-24 h): importante pero no crítico. */
const PRIORITY_FLAGS: RegExp[] = [
  /v(ó|o)mit/i,
  /diarrea/i,
  /fiebre/i,
  /dolor\s+(moderado|fuerte)|le\s+duele|se\s+queja/i,
  /no\s+(come|ha\s+comido|quiere\s+comer)|sin\s+apetito|no\s+tiene\s+hambre/i,
  /deca(í|i)d|sin\s+energ(í|i)a|muy\s+cansad|no\s+se\s+levanta/i,
  /infecci(ó|o)n\s+de\s+o(í|i)do|le\s+huele\s+el\s+o(í|i)do/i,
  /cojea|renquea|no\s+apoya\s+la\s+pata/i,
  /orina\s+con\s+sangre|no\s+puede\s+orinar|hace\s+mucho\s+pip(í|i)/i,
];

/** Palabras que por sí solas indican intención de urgencia. */
const EXPLICIT_URGENCY = /emergencia|urgencia|urgente|se\s+(está|esta)\s+muriendo|ay(ú|u)da/i;

/** Nivel de triage del mensaje. */
export function triageLevel(message: string): TriageLevel {
  if (RED_FLAGS.some((re) => re.test(message)) || EXPLICIT_URGENCY.test(message)) {
    return "red";
  }
  if (PRIORITY_FLAGS.some((re) => re.test(message))) {
    return "orange";
  }
  return "yellow";
}

/** Retrocompatible: urgente = emergencia inmediata (rojo). */
export function isUrgent(message: string): boolean {
  return triageLevel(message) === "red";
}
