import Anthropic from "@anthropic-ai/sdk";
import type { AgentParams, ChatMessage, LLMProvider, VetContext } from "./types";
import { buildSystemPrompt } from "./system-prompt";

/**
 * Modelo por defecto. CONECTAR: se puede sobreescribir con LLM_MODEL en el
 * entorno (p. ej. un modelo más económico si el volumen crece).
 */
const MODEL = process.env.LLM_MODEL ?? "claude-opus-4-8";

const FALLBACK_REPLY =
  "Perdona, tuve un problema para responder. ¿Me lo puedes contar de nuevo?";

/** Junta los bloques de texto de una respuesta del modelo. */
function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

/**
 * Anthropic implementation of the flexible provider layer. Activated with
 * LLM_PROVIDER=anthropic + ANTHROPIC_API_KEY (the client's production key
 * plugs in here later without touching callers).
 */
export class AnthropicProvider implements LLMProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async complete(messages: ChatMessage[], context: VetContext): Promise<string> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: buildSystemPrompt(context),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return extractText(response) || FALLBACK_REPLY;
  }

  /**
   * Bucle de herramientas: el modelo puede pedir datos (tool_use), nosotros
   * ejecutamos la herramienta y le devolvemos el resultado, hasta que
   * responde en texto. Tope de 5 rondas para acotar costo y latencia.
   */
  async completeWithTools(params: AgentParams): Promise<string> {
    const messages: Anthropic.MessageParam[] = params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const tools: Anthropic.Tool[] = params.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Tool.InputSchema,
    }));

    for (let round = 0; round < 5; round++) {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: params.maxTokens ?? 1024,
        thinking: { type: "adaptive" },
        system: [
          {
            type: "text",
            text: params.system,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools,
        messages,
      });

      if (response.stop_reason !== "tool_use") {
        return extractText(response) || FALLBACK_REPLY;
      }

      // El modelo pidió una o más herramientas: ejecutarlas y devolver resultados
      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        try {
          const result = await params.executeTool(
            block.name,
            block.input as Record<string, unknown>,
          );
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        } catch (e) {
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Error al consultar: ${e instanceof Error ? e.message : "desconocido"}`,
            is_error: true,
          });
        }
      }
      messages.push({ role: "user", content: results });
    }

    return FALLBACK_REPLY;
  }
}
