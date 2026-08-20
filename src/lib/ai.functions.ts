import { createServerFn } from "@tanstack/react-start";

type AnalyzeInput = {
  area: string;
  fotos: string[];
};

export type AnalyzeResult = {
  status: "conforme" | "parcial" | "nao_conforme" | null;
  problemas: string;
  oportunidades: string;
};

export const analisarFotos = createServerFn({ method: "POST" })
  .inputValidator((data: AnalyzeInput) => {
    if (!data || typeof data.area !== "string" || !Array.isArray(data.fotos)) {
      throw new Error("Dados inválidos para análise.");
    }
    const fotos = data.fotos.filter((f) => typeof f === "string" && f.startsWith("data:image")).slice(0, 4);
    if (fotos.length === 0) throw new Error("Adicione ao menos uma foto para analisar.");
    return { area: data.area, fotos };
  })
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Serviço de IA indisponível (chave ausente).");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um auditor de boas práticas de higiene e exposição em açougues e supermercados. Analise as fotos da área indicada e responda em português do Brasil. Seja objetivo e prático.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Área inspecionada: ${data.area}. Avalie as fotos e devolve APENAS um JSON válido com as chaves: "status" (um de: conforme, parcial, nao_conforme), "problemas" (texto com os problemas encontrados, em tópicos separados por quebra de linha; vazio se nenhum), "oportunidades" (texto com sugestões de melhoria, em tópicos separados por quebra de linha).`,
              },
              ...data.fotos.map((url) => ({ type: "image_url", image_url: { url } })),
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Muitas análises seguidas. Aguarde alguns segundos e tente novamente.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no Lovable para continuar.");
      throw new Error(`Falha na análise (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "";
    let parsed: Partial<AnalyzeResult> = {};
    try {
      parsed = JSON.parse(content.replace(/^```json\s*|```$/g, "").trim());
    } catch {
      return { status: null, problemas: content.trim(), oportunidades: "" };
    }

    const status = parsed.status;
    return {
      status:
        status === "conforme" || status === "parcial" || status === "nao_conforme" ? status : null,
      problemas: typeof parsed.problemas === "string" ? parsed.problemas.trim() : "",
      oportunidades: typeof parsed.oportunidades === "string" ? parsed.oportunidades.trim() : "",
    };
  });
