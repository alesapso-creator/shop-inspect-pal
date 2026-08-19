import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, Check, ImagePlus, Save, Trash2, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  areaLabel,
  emptyArea,
  isTrainingArea,
  STATUS,
  type AreaEntry,
  type AreaId,
  type Inspection,
  type StatusId,
} from "@/lib/inspection";

import { getInspection, saveInspection } from "@/lib/inspection-store";
import { filesToDataUrls } from "@/lib/photo";

export const Route = createFileRoute("/area/$id/$areaId")({
  head: () => ({
    meta: [
      { title: "Registro da área — Inspeção de Loja" },
      {
        name: "description",
        content:
          "Marque a conformidade da área, descreva problemas e oportunidades e anexe fotos da inspeção.",
      },
      { property: "og:title", content: "Registro da área — Inspeção de Loja" },
      {
        property: "og:description",
        content: "Conformidade, observações e fotos de cada área da loja.",
      },
    ],
  }),
  component: AreaForm,
});

const STATUS_ICON: Record<StatusId, LucideIcon> = {
  conforme: Check,
  parcial: AlertTriangle,
  nao_conforme: X,
};

const STATUS_ACTIVE: Record<StatusId, string> = {
  conforme: "border-ok bg-ok/10 text-ok",
  parcial: "border-warn bg-warn/10 text-warn",
  nao_conforme: "border-bad bg-bad/10 text-bad",
};

function AreaForm() {
  const { id, areaId } = Route.useParams();
  const navigate = useNavigate();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [inspecao, setInspecao] = useState<Inspection | null>(null);
  const [entry, setEntry] = useState<AreaEntry>(emptyArea());
  const [processando, setProcessando] = useState(false);

  const load = useCallback(async () => {
    const found = await getInspection(id);
    if (!found) {
      void navigate({ to: "/" });
      return;
    }
    setInspecao(found);
    setEntry(found.areas[areaId as AreaId] ?? emptyArea());
  }, [id, areaId, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const salvar = async (next: AreaEntry, voltar = false) => {
    if (!inspecao) return;
    const updated: Inspection = {
      ...inspecao,
      areas: { ...inspecao.areas, [areaId as AreaId]: next },
    };
    setInspecao(updated);
    await saveInspection(updated);
    if (voltar) {
      toast.success("Área salva.");
      void navigate({ to: "/inspecao/$id", params: { id } });
    }
  };

  const patch = (p: Partial<AreaEntry>) => {
    const next = { ...entry, ...p };
    setEntry(next);
    void salvar(next);
  };

  const addFotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessando(true);
    try {
      const novas = await filesToDataUrls(files);
      patch({ fotos: [...entry.fotos, ...novas] });
    } catch {
      toast.error("Não foi possível adicionar as fotos.");
    } finally {
      setProcessando(false);
    }
  };

  if (!inspecao) {
    return (
      <AppShell title="Área" backTo={{ to: "/" }}>
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={areaLabel(areaId)}
      subtitle={inspecao.loja || "Loja sem nome"}
      backTo={{ to: "/inspecao/$id", params: { id } }}
    >
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Situação
        </h2>
        <div className="grid gap-2">
          {STATUS.map((s) => {
            const Icon = STATUS_ICON[s.id];
            const active = entry.status === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => patch({ status: s.id })}
                className={`flex h-14 items-center gap-3 rounded-2xl border-2 px-4 text-left font-semibold transition-colors ${
                  active
                    ? STATUS_ACTIVE[s.id]
                    : "border-border bg-card text-card-foreground"
                }`}
              >
                <Icon className="size-5 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="problemas">Problemas encontrados</Label>
          <Textarea
            id="problemas"
            rows={5}
            placeholder="Descreva o que foi encontrado…"
            value={entry.problemas}
            onChange={(e) => setEntry({ ...entry, problemas: e.target.value })}
            onBlur={() => void salvar(entry)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="oportunidades">Oportunidades</Label>
          <Textarea
            id="oportunidades"
            rows={5}
            placeholder="Sugestões de melhoria…"
            value={entry.oportunidades}
            onChange={(e) => setEntry({ ...entry, oportunidades: e.target.value })}
            onBlur={() => void salvar(entry)}
          />
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Fotos
          </h2>
          <span className="text-xs text-muted-foreground">
            {entry.fotos.length} anexada{entry.fotos.length === 1 ? "" : "s"}
          </span>
        </div>
        {entry.fotos.length > 0 && entry.fotos.length < 2 ? (
          <p className="mb-2 text-xs text-warn">Adicione pelo menos 2 fotos da área.</p>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {entry.fotos.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
              <img src={src} alt={`Foto ${i + 1} da área`} className="size-full object-cover" />
              <button
                type="button"
                aria-label={`Remover foto ${i + 1}`}
                onClick={() => patch({ fotos: entry.fotos.filter((_, j) => j !== i) })}
                className="absolute right-1 top-1 rounded-full bg-background/85 p-1.5 text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12"
            disabled={processando}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="size-4" /> Câmera
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12"
            disabled={processando}
            onClick={() => galleryRef.current?.click()}
          >
            <ImagePlus className="size-4" /> Galeria
          </Button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            void addFotos(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void addFotos(e.target.files);
            e.target.value = "";
          }}
        />
        {processando ? (
          <p className="mt-2 text-xs text-muted-foreground">Processando fotos…</p>
        ) : null}
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Button
            size="lg"
            className="h-13 w-full text-base"
            onClick={() => void salvar(entry, true)}
          >
            <Save className="size-5" /> Salvar área
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
