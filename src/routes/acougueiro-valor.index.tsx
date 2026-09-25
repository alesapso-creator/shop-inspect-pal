import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Award, Plus, Store, Trash2, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { formatValorDate, newAcougueiroValor, type AcougueiroValor } from "@/lib/acougueiro-valor";
import { deleteAcougueiroValor, listAcougueirosValor, saveAcougueiroValor } from "@/lib/acougueiro-valor-store";
import { nivelLabel } from "@/lib/inspection";

export const Route = createFileRoute("/acougueiro-valor/")({
  head: () => ({ meta: [
    { title: "Açougueiro em Destaque — Reconhecimentos" },
    { name: "description", content: "Consulte reconhecimentos salvos ou destaque um novo colaborador." },
    { property: "og:title", content: "Açougueiro em Destaque — Reconhecimentos" },
    { property: "og:description", content: "Histórico de colaboradores reconhecidos pelo trabalho de destaque." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AcougueiroValorHome,
});

function AcougueiroValorHome() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AcougueiroValor[] | null>(null);
  const load = useCallback(async () => setItems(await listAcougueirosValor()), []);
  useEffect(() => { void load(); }, [load]);
  const criar = async () => {
    const item = newAcougueiroValor();
    await saveAcougueiroValor(item);
    void navigate({ to: "/acougueiro-valor/$id", params: { id: item.id } });
  };
  const remover = async (id: string) => { await deleteAcougueiroValor(id); void load(); };

  return (
    <AppShell title="Açougueiro em Destaque" subtitle="Reconhecimentos salvos" backTo={{ to: "/" }}>
      {items === null ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p> : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center">
          <Award className="mx-auto size-10 text-warn" />
          <p className="mt-3 font-medium">Nenhum reconhecimento ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Toque em “Novo reconhecimento” para começar.</p>
        </div>
      ) : (
        <ul className="space-y-3">{items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
            <Link to="/acougueiro-valor/$id" params={{ id: item.id }} className="flex min-w-0 flex-1 items-center gap-3">
              {item.fotoPerfil ? <img src={item.fotoPerfil} alt="" className="size-14 shrink-0 rounded-md object-cover" /> : <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted"><User className="size-6 text-muted-foreground" /></span>}
              <span className="min-w-0">
                <span className="block truncate font-semibold text-card-foreground">{item.colaborador || "Colaborador sem nome"}</span>
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground"><Store className="size-3.5" />{item.loja || "Loja não informada"} · {item.nivel ? nivelLabel(item.nivel) : "Sem nível"}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{formatValorDate(item.data)}</span>
              </span>
            </Link>
            <Button type="button" variant="ghost" size="icon" aria-label="Excluir reconhecimento" onClick={() => void remover(item.id)} className="rounded-full text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button>
          </li>
        ))}</ul>
      )}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur"><div className="mx-auto max-w-3xl"><Button size="lg" className="h-13 w-full text-base" onClick={() => void criar()}><Plus className="size-5" /> Novo reconhecimento</Button></div></div>
    </AppShell>
  );
}