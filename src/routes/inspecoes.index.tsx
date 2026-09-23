import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Plus, Store, Trash2, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { AREAS, formatDate, newInspection, type Inspection } from "@/lib/inspection";
import { deleteInspection, listInspections, saveInspection } from "@/lib/inspection-store";

export const Route = createFileRoute("/inspecoes/")({
  head: () => ({
    meta: [
      { title: "Relatórios de Inspeção — Inspeções de Loja" },
      {
        name: "description",
        content: "Consulte inspeções de loja salvas neste aparelho ou inicie um novo relatório.",
      },
      { property: "og:title", content: "Relatórios de Inspeção — Inspeções de Loja" },
      {
        property: "og:description",
        content: "Histórico de inspeções de loja com áreas, fotos e relatórios em PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InspecoesHome,
});

function InspecoesHome() {
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
    <AppShell title="Relatórios de Inspeção" subtitle="Salvos neste aparelho" backTo={{ to: "/" }}>
      {items === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center">
          <ClipboardList className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Nenhuma inspeção ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Toque em “Nova inspeção” para começar.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const preenchidas = AREAS.filter((area) => item.areas[area.id]).length;
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
                <Link to="/inspecao/$id" params={{ id: item.id }} className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-card-foreground">{item.loja || "Loja sem nome"}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                    <Store className="size-3.5" />
                    {item.rede || "Rede não informada"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <User className="size-3.5" />
                    {item.tecnico || "Sem técnico"} · {formatDate(item.data)} · {preenchidas}/{AREAS.length} áreas
                  </p>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir inspeção"
                  onClick={() => void remover(item.id)}
                  className="rounded-full text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
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