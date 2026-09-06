import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Beef, Plus, Store, Trash2, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { formatDate, newRendimento, pct, calcular, type Rendimento } from "@/lib/rendimento";
import { deleteRendimento, listRendimentos, saveRendimento } from "@/lib/rendimento-store";

export const Route = createFileRoute("/rendimento/")({
  head: () => ({
    meta: [
      { title: "Rendimento Bovino — Cálculo e Relatório em PDF" },
      {
        name: "description",
        content:
          "Registre pesos de peça fechada, inatura e sebo, calcule exsudação, rendimento e perda e gere o relatório em PDF.",
      },
      { property: "og:title", content: "Rendimento Bovino — Cálculo e Relatório em PDF" },
      {
        property: "og:description",
        content: "Pesos, fotos, cortes detalhados e PDF gerado no próprio aparelho.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RendimentoHome,
});

function RendimentoHome() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Rendimento[] | null>(null);

  const load = useCallback(async () => {
    setItems(await listRendimentos());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const criar = async () => {
    const item = newRendimento();
    await saveRendimento(item);
    void navigate({ to: "/rendimento/$id", params: { id: item.id } });
  };

  const remover = async (id: string) => {
    await deleteRendimento(id);
    void load();
  };

  return (
    <AppShell title="Rendimento Bovino" subtitle="Salvos neste aparelho" backTo={{ to: "/" }}>
      {items === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center">
          <Beef className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Nenhum rendimento ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Toque em “Novo rendimento” para começar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const c = calcular(item);
            return (
              <li
                key={item.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Link
                    to="/rendimento/$id"
                    params={{ id: item.id }}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate font-semibold text-card-foreground">
                      {item.loja || "Sem loja"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <Store className="size-3.5" /> {item.rede || "Sem rede"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <User className="size-3.5" /> {item.tecnico || "Sem técnico"} ·{" "}
                      {formatDate(item.data)}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-medium text-ok">
                      Rendimento {pct(c.rendimento)}
                    </span>
                  </Link>
                  <button
                    aria-label="Excluir"
                    onClick={() => remover(item.id)}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Button size="lg" className="h-13 w-full text-base" onClick={criar}>
            <Plus className="size-5" /> Novo rendimento
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
