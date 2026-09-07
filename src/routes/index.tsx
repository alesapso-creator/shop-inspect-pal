import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Plus, Store, Trash2, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { AREAS, formatDate, newInspection, type Inspection } from "@/lib/inspection";
import { deleteInspection, listInspections, saveInspection } from "@/lib/inspection-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inspeção de Loja — Registro e Relatório em PDF" },
      {
        name: "description",
        content:
          "Registre inspeções de loja por área, marque a conformidade, anexe fotos e gere o relatório em PDF direto do celular.",
      },
      { property: "og:title", content: "Inspeção de Loja — Registro e Relatório em PDF" },
      {
        property: "og:description",
        content: "Checklist de áreas, fotos e PDF gerado no aparelho, sem internet.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Inspection[] | null>(null);

  const load = useCallback(async () => {
    setItems(await listInspections());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const criar = async () => {
    const inspecao = newInspection();
    await saveInspection(inspecao);
    void navigate({ to: "/inspecao/$id", params: { id: inspecao.id } });
  };

  const remover = async (id: string) => {
    await deleteInspection(id);
    void load();
  };

  return (
    <AppShell title="Inspeções de Loja" subtitle="Salvas neste aparelho">
      <Link
        to="/rendimento"
        className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors active:bg-accent"
      >
        <Beef className="size-8 text-primary" />
        <div className="min-w-0">
          <p className="font-semibold text-card-foreground">Rendimento Bovino</p>
          <p className="text-sm text-muted-foreground">
            Pesos, exsudação, perda e relatório em PDF
          </p>
        </div>
      </Link>
      {items === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>

      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center">
          <ClipboardList className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Nenhuma inspeção ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Toque em “Nova inspeção” para começar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const preenchidas = AREAS.filter((a) => item.areas[a.id]).length;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <Link
                  to="/inspecao/$id"
                  params={{ id: item.id }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate font-semibold text-card-foreground">
                    {item.loja || "Loja sem nome"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                    <Store className="size-3.5" />
                    {item.rede || "Rede não informada"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <User className="size-3.5" />
                    {item.tecnico || "Sem técnico"} · {formatDate(item.data)} · {preenchidas}/
                    {AREAS.length} áreas
                  </p>
                </Link>
                <button
                  type="button"
                  aria-label="Excluir inspeção"
                  onClick={() => void remover(item.id)}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Button size="lg" className="h-13 w-full text-base" onClick={() => void criar()}>
            <Plus className="size-5" /> Nova inspeção
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
