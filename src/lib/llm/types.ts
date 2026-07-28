export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Context the bot receives about the member and their pets. */
export type VetContext = {
  memberName: string | null;
  pets: {
    name: string;
    species: "dog" | "cat";
    breed: string | null;
    ageLabel: string;
  }[];
  /** True when the latest user message matches emergency signals. */
  urgent: boolean;
  /** Teléfono del veterinario humano (site_settings.emergency_phone). */
  emergencyPhone?: string | null;
};

/**
 * Herramienta que el modelo puede invocar para leer datos reales (BD del
 * miembro, catálogo de planes, etc.). `input_schema` es JSON Schema estándar.
 */
export type AgentTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

/** Parámetros de una conversación de agente con herramientas. */
export type AgentParams = {
  messages: ChatMessage[];
  /** System prompt ya armado (guardrails + conocimiento del negocio). */
  system: string;
  tools: AgentTool[];
  /**
   * Ejecuta una herramienta y devuelve el resultado serializado (JSON).
   * Quien llama decide el acceso a datos (p. ej. cliente Supabase con RLS
   * del usuario), así el proveedor LLM nunca toca la BD directamente.
   */
  executeTool: (name: string, input: Record<string, unknown>) => Promise<string>;
  maxTokens?: number;
};

/**
 * Swappable LLM provider ("capa de proveedor flexible" per the handoff).
 * The client's definitive API arrives later — implementations: mock (dev),
 * anthropic; others can be added without touching callers.
 */
export interface LLMProvider {
  complete(messages: ChatMessage[], context: VetContext): Promise<string>;
  /**
   * Conversación con herramientas — usada por el asistente de soporte y el
   * agente de ventas. El proveedor itera: modelo → tool_use → resultado →
   * modelo, hasta obtener la respuesta final en texto.
   */
  completeWithTools(params: AgentParams): Promise<string>;
}
