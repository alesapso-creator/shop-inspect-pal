import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Droplets,
  FileDown,
  Flame,
  Plus,
  Share2,
  Timer,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressToDataUrl } from "@/lib/photo";
import { calcular, kg, num, pct, type Corte, type Rendimento } from "@/lib/rendimento";
import { getRendimento, saveRendimento } from "@/lib/rendimento-store";
import { downloadRendimentoPdf, shareRendimentoPdf } from "@/lib/rendimento-pdf";

export const Route = createFileRoute("/rendimento/$id")({
  head: () => ({
    meta: [
      { title: "Novo rendimento — Rendimento Bovino" },
      {
        name: "description",
        content:
          "Informe pesos, fotos e cortes para calcular exsudação, rendimento e perda total do corte bovino.",
      },
      { property: "og:title", content: "Novo rendimento — Rendimento Bovino" },
      {
        property: "og:description",
        content: "Cálculo automático de exsudação, rendimento e perda, com relatório em PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RendimentoForm,
});

type FotoKey = "fotoFechado" | "fotoInatura" | "fotoSebo";

function RendimentoForm() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<Rendimento | null>(null);
  const [mostrarCortes, setMostrarCortes] = useState(false);

  useEffect(() => {
    void getRendimento(id).then((found) => {
      if (found) {
        setItem(found);
        setMostrarCortes(found.cortes.length > 0);
      }
    });
  }, [id]);

  const update = useCallback((patch: Partial<Rendimento>) => {
    setItem((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch, updatedAt: Date.now() };
      void saveRendimento(next);
      return next;
    });
  }, []);

  if (!item) {
    return (
      <AppShell title="Rendimento" backTo={{ to: "/rendimento" }}>
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }

  const c = calcular(item);

  const setCorte = (corteId: string, patch: Partial<Corte>) =>
    update({ cortes: item.cortes.map((x) => (x.id === corteId ? { ...x, ...patch } : x)) });

  const addCorte = () =>
    update({
      cortes: [...item.cortes, { id: crypto.randomUUID(), nome: "", peso: "", sebo: "" }],
    });

  const gerarPdf = async () => {
    if (num(item.pesoFechado) <= 0) {
      toast.error("Informe o peso da peça fechada.");
      return;
    }
    await downloadRendimentoPdf(item);
    toast.success("PDF gerado.");
  };

  const compartilhar = async () => {
    if (num(item.pesoFechado) <= 0) {
      toast.error("Informe o peso da peça fechada.");
      return;
    }
    const ok = await shareRendimentoPdf(item);
    if (ok) {
      toast.success("Escolha o WhatsApp para enviar o relatório.");
      return;
    }
    const texto = `Relatório de rendimento — ${item.loja || "Loja"} (${item.rede || "Rede"})`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
    toast.success("PDF baixado. Anexe o arquivo na conversa do WhatsApp.");
  };

  return (
    <AppShell
      title={item.loja || "Novo rendimento"}
      subtitle={item.rede || "Preencha os dados da loja"}
      backTo={{ to: "/rendimento" }}
    >
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Rede" value={item.rede} onChange={(v) => update({ rede: v })} />
          <Campo label="Loja" value={item.loja} onChange={(v) => update({ loja: v })} />
          <Campo
            label="SIF"
            value={item.sif}
            placeholder="Nº SIF"
            onChange={(v) => update({ sif: v })}
          />
          <Campo label="Técnico" value={item.tecnico} onChange={(v) => update({ tecnico: v })} />
          <Campo
            label="Data de produção"
            type="date"
            value={item.dataProducao}
            onChange={(v) => update({ dataProducao: v })}
          />
          <Campo
            label="Data do rendimento"
            type="date"
            value={item.data}
            onChange={(v) => update({ data: v })}
          />
          <Campo
            label="Corte"
            value={item.corteBovino}
            onChange={(v) => update({ corteBovino: v })}
          />
          <Campo label="Marca" value={item.marca} onChange={(v) => update({ marca: v })} />
        </div>
      </section>

      <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Pesos e fotos
      </h2>
      <div className="space-y-3">
        <BlocoPeso
          titulo="Peça fechada (pesar com tara)"
          peso={item.pesoFechado}
          foto={item.fotoFechado}
          onPeso={(v) => update({ pesoFechado: v })}
          onFoto={(v) => update({ fotoFechado: v })}
          fotoKey="fotoFechado"
        />
        <BlocoPeso
          titulo="Produto inatura (produto sem a embalagem)"
          peso={item.pesoInatura}
          foto={item.fotoInatura}
          onPeso={(v) => update({ pesoInatura: v })}
          onFoto={(v) => update({ fotoInatura: v })}
          fotoKey="fotoInatura"
        />
        <BlocoPeso
          titulo="Sebo"
          peso={item.pesoSebo}
          foto={item.fotoSebo}
          onPeso={(v) => update({ pesoSebo: v })}
          onFoto={(v) => update({ fotoSebo: v })}
          fotoKey="fotoSebo"
        />
      </div>

      <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Resultados
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Resultado
          icon={Timer}
          label="Tempo de Produção"
          value={c.dias === null ? "Informe as datas" : `${c.dias} dia(s)`}
          tone="text-primary"
        />
        <Resultado
          icon={Droplets}
          label="Exsudação"
          value={`${kg(c.exsudacao)} · ${pct(c.percExsudacao)}`}
          tone="text-primary"
        />
        <Resultado icon={TrendingUp} label="Rendimento" value={pct(c.rendimento)} tone="text-ok" />
        <Resultado
          icon={Flame}
          label="Sebo dos cortes"
          value={kg(c.seboCortes)}
          tone="text-warn"
        />
        <Resultado
          icon={TrendingDown}
          label="Perda total"
          value={`${pct(c.perdaPerc)} · ${kg(c.perdaKg)}`}
          tone="text-bad"
        />
      </div>

      <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Cortes separados (opcional)
      </h2>
      {!mostrarCortes ? (
        <Button
          variant="outline"
          className="h-12 w-full"
          onClick={() => {
            setMostrarCortes(true);
            if (item.cortes.length === 0) addCorte();
          }}
        >
          <Plus className="size-5" /> Detalhar cortes
        </Button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          {item.cortes.map((corte) => (
            <div key={corte.id} className="flex items-center gap-2">
              <Input
                className="flex-[2]"
                placeholder="Nome do corte"
                value={corte.nome}
                onChange={(e) => setCorte(corte.id, { nome: e.target.value })}
              />
              <Input
                className="flex-1"
                type="number"
                inputMode="decimal"
                step="0.001"
                placeholder="kg"
                value={corte.peso}
                onChange={(e) => setCorte(corte.id, { peso: e.target.value })}
              />
              <Input
                className="flex-1"
                type="number"
                inputMode="decimal"
                step="0.001"
                placeholder="sebo"
                value={corte.sebo}
                onChange={(e) => setCorte(corte.id, { sebo: e.target.value })}
              />
              <button
                aria-label="Remover corte"
                className="rounded-full p-2 text-muted-foreground hover:bg-accent"
                onClick={() =>
                  update({ cortes: item.cortes.filter((x) => x.id !== corte.id) })
                }
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" className="h-11 w-full" onClick={addCorte}>
            <Plus className="size-4" /> Adicionar corte
          </Button>
          <div className="rounded-xl bg-muted p-3 text-sm">
            <p className="font-medium">Soma peso: {kg(c.somaCortes)}</p>
            <p className="font-medium">Soma sebo: {kg(c.seboCortes)}</p>
            <p className="text-muted-foreground">
              Diferença (inatura - soma): {kg(c.diferencaCortes)}
            </p>
          </div>
        </div>
      )}

      <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Outros rendimentos desta visita
      </h2>
      <div className="space-y-4">
        {extras.map((extra, i) => (
          <MedicaoExtra
            key={extra.id}
            index={i + 2}
            medicao={extra}
            data={item.data}
            onChange={(patch) => setExtra(extra.id, patch)}
            onRemove={() => update({ extras: extras.filter((x) => x.id !== extra.id) })}
          />
        ))}
        <Button
          variant="outline"
          className="h-12 w-full"
          onClick={() => update({ extras: [...extras, newMedicao()] })}
        >
          <Plus className="size-5" /> Adicionar outro rendimento
        </Button>
      </div>

      <div className="h-48" />

      <div className="fixed inset-x-0 bottom-0 space-y-2 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-2">
          <Button size="lg" className="h-13 w-full text-base" onClick={gerarPdf}>
            <FileDown className="size-5" /> Finalizar e gerar PDF
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-13 w-full text-base"
            onClick={compartilhar}
          >
            <Share2 className="size-5" /> Compartilhar no WhatsApp
          </Button>
        </div>
      </div>

    </AppShell>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function BlocoPeso({
  titulo,
  peso,
  foto,
  onPeso,
  onFoto,
  fotoKey,
}: {
  titulo: string;
  peso: string;
  foto: string | null;
  onPeso: (v: string) => void;
  onFoto: (v: string | null) => void;
  fotoKey: FotoKey;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const escolher = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      onFoto(await compressToDataUrl(file));
    } catch {
      toast.error("Não foi possível carregar a foto.");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="font-semibold text-card-foreground">{titulo}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor={`${fotoKey}-peso`}>Peso (kg)</Label>
          <Input
            id={`${fotoKey}-peso`}
            type="number"
            inputMode="decimal"
            step="0.001"
            placeholder="0,000"
            value={peso}
            onChange={(e) => onPeso(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11" onClick={() => inputRef.current?.click()}>
          <Camera className="size-5" /> {foto ? "Trocar foto" : "Adicionar foto"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void escolher(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {foto ? (
        <div className="relative mt-3 w-40">
          <img
            src={foto}
            alt={`Foto de ${titulo}`}
            className="h-28 w-40 rounded-xl object-cover"
            loading="lazy"
          />
          <button
            aria-label="Remover foto"
            onClick={() => onFoto(null)}
            className="absolute -right-2 -top-2 rounded-full bg-background p-1 shadow"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function Resultado({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className={`size-4 ${tone}`} /> {label}
      </p>
      <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
    </div>
  );
}
