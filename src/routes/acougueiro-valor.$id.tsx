import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, FileDown, ImagePlus, Share2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { compressToDataUrl, filesToDataUrls } from "@/lib/photo";
import { NIVEIS } from "@/lib/inspection";
import { acougueiroValorSchema, COMENTARIOS_SUGERIDOS, DESTAQUES_ATENDIMENTO, DESTAQUES_AUTOSSERVICO, type AcougueiroValor } from "@/lib/acougueiro-valor";
import { getAcougueiroValor, saveAcougueiroValor } from "@/lib/acougueiro-valor-store";
import { downloadAcougueiroValorPdf, shareAcougueiroValorPdf } from "@/lib/acougueiro-valor-pdf";

export const Route = createFileRoute("/acougueiro-valor/$id")({
  head: () => ({ meta: [
    { title: "Novo reconhecimento — Açougueiro de Valor" },
    { name: "description", content: "Registre o colaborador, seus destaques e fotos do trabalho para gerar um reconhecimento em PDF." },
    { property: "og:title", content: "Novo reconhecimento — Açougueiro de Valor" },
    { property: "og:description", content: "Valorize colaboradores com destaques profissionais, fotos e relatório em PDF." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AcougueiroValorForm,
});

function AcougueiroValorForm() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<AcougueiroValor | null>(null);
  const profileCamera = useRef<HTMLInputElement>(null);
  const profileGallery = useRef<HTMLInputElement>(null);
  const workCamera = useRef<HTMLInputElement>(null);
  const workGallery = useRef<HTMLInputElement>(null);
  useEffect(() => { void getAcougueiroValor(id).then((found) => { if (found) setItem(found); }); }, [id]);
  const update = useCallback((patch: Partial<AcougueiroValor>) => {
    setItem((previous) => {
      if (!previous) return previous;
      const next = { ...previous, ...patch, updatedAt: Date.now() };
      void saveAcougueiroValor(next);
      return next;
    });
  }, []);

  if (!item) return <AppShell title="Açougueiro de Valor" backTo={{ to: "/acougueiro-valor" }}><p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p></AppShell>;

  const toggle = (key: "destaquesAtendimento" | "destaquesAutosservico", value: string) => {
    const current = item[key];
    update({ [key]: current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value] });
  };
  const validate = () => {
    const result = acougueiroValorSchema.safeParse({ ...item, destaques: [...item.destaquesAtendimento, ...item.destaquesAutosservico] });
    if (result.success) return true;
    toast.error(result.error.issues[0]?.message ?? "Revise os dados do reconhecimento.");
    return false;
  };
  const pickProfile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try { update({ fotoPerfil: await compressToDataUrl(file) }); } catch { toast.error("Não foi possível carregar a foto."); }
  };
  const pickWork = async (files: FileList | null) => {
    if (!files?.length) return;
    try { update({ fotosTrabalho: [...item.fotosTrabalho, ...(await filesToDataUrls(files))] }); } catch { toast.error("Não foi possível carregar as fotos."); }
  };
  const gerar = async () => { if (!validate()) return; await downloadAcougueiroValorPdf(item); toast.success("PDF de reconhecimento gerado."); };
  const compartilhar = async () => {
    if (!validate()) return;
    const shared = await shareAcougueiroValorPdf(item);
    if (shared) { toast.success("Escolha o WhatsApp para enviar o reconhecimento."); return; }
    const text = `Açougueiro de Valor — reconhecimento de ${item.colaborador.slice(0, 120)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    toast.success("PDF baixado. Anexe o arquivo na conversa do WhatsApp.");
  };

  return (
    <AppShell title={item.colaborador || "Novo reconhecimento"} subtitle="Açougueiro de Valor" backTo={{ to: "/acougueiro-valor" }}>
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="font-semibold text-card-foreground">Dados do reconhecimento</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Rede" value={item.rede} maxLength={100} onChange={(rede) => update({ rede })} />
          <Field label="Loja" value={item.loja} maxLength={100} onChange={(loja) => update({ loja })} />
          <div className="col-span-2"><Field label="Nome do colaborador" value={item.colaborador} maxLength={120} onChange={(colaborador) => update({ colaborador })} /></div>
          <Field label="Data" type="date" value={item.data} onChange={(data) => update({ data })} />
          <Field label="Técnico" value={item.tecnico} maxLength={120} onChange={(tecnico) => update({ tecnico })} />
        </div>
        <div className="mt-4 grid gap-2"><Label>Nível do colaborador</Label><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{NIVEIS.map((nivel) => <Button key={nivel.id} type="button" variant={item.nivel === nivel.id ? "default" : "outline"} className="h-11" onClick={() => update({ nivel: nivel.id })}>{item.nivel === nivel.id ? <Check /> : null}{nivel.label}</Button>)}</div></div>
      </section>

      <SectionTitle>Foto de perfil</SectionTitle>
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-4">
          {item.fotoPerfil ? <div className="relative"><img src={item.fotoPerfil} alt="Foto do colaborador" className="h-36 w-28 rounded-md object-cover" /><Button type="button" size="icon" variant="secondary" aria-label="Remover foto de perfil" className="absolute -right-2 -top-2 rounded-full" onClick={() => update({ fotoPerfil: null })}><X /></Button></div> : <div className="flex h-36 w-28 shrink-0 items-center justify-center rounded-md bg-muted"><Camera className="size-8 text-muted-foreground" /></div>}
          <div className="grid flex-1 gap-2"><Button type="button" variant="outline" className="h-11" onClick={() => profileCamera.current?.click()}><Camera /> Tirar foto</Button><Button type="button" variant="outline" className="h-11" onClick={() => profileGallery.current?.click()}><ImagePlus /> Galeria</Button></div>
        </div>
        <PhotoInput ref={profileCamera} capture onFiles={pickProfile} /><PhotoInput ref={profileGallery} onFiles={pickProfile} />
      </section>

      <SectionTitle>Destaques do colaborador</SectionTitle>
      <ChoiceGroup title="Balcão de Atendimento" values={DESTAQUES_ATENDIMENTO} selected={item.destaquesAtendimento} onToggle={(value) => toggle("destaquesAtendimento", value)} />
      <div className="mt-3"><ChoiceGroup title="Balcão de Autosserviço" values={DESTAQUES_AUTOSSERVICO} selected={item.destaquesAutosservico} onToggle={(value) => toggle("destaquesAutosservico", value)} /></div>

      <SectionTitle>Comentário de reconhecimento</SectionTitle>
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <Label htmlFor="comentario">Comentário</Label>
        <Textarea id="comentario" className="mt-2 min-h-28" maxLength={1200} value={item.comentario} placeholder="Descreva por que este colaborador merece reconhecimento…" onChange={(event) => update({ comentario: event.target.value })} />
        <p className="mb-2 mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5" /> Sugestões</p>
        <div className="grid gap-2">{COMENTARIOS_SUGERIDOS.map((suggestion) => <Button key={suggestion} type="button" variant="outline" className="h-auto min-h-11 justify-start whitespace-normal px-3 py-2 text-left" onClick={() => update({ comentario: suggestion })}>{suggestion}</Button>)}</div>
      </section>

      <SectionTitle>Fotos do trabalho</SectionTitle>
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="h-11" onClick={() => workCamera.current?.click()}><Camera /> Câmera</Button><Button type="button" variant="outline" className="h-11" onClick={() => workGallery.current?.click()}><ImagePlus /> Galeria</Button></div>
        <PhotoInput ref={workCamera} capture onFiles={pickWork} /><PhotoInput ref={workGallery} multiple onFiles={pickWork} />
        {item.fotosTrabalho.length ? <div className="mt-4 grid grid-cols-3 gap-2">{item.fotosTrabalho.map((photo, index) => <div key={`${photo.slice(-20)}-${index}`} className="relative aspect-square"><img src={photo} alt={`Trabalho ${index + 1}`} className="size-full rounded-md object-cover" /><Button type="button" size="icon" variant="secondary" aria-label={`Remover foto ${index + 1}`} className="absolute right-1 top-1 size-7 rounded-full" onClick={() => update({ fotosTrabalho: item.fotosTrabalho.filter((_, photoIndex) => photoIndex !== index) })}><X /></Button></div>)}</div> : <p className="mt-3 text-center text-sm text-muted-foreground">Adicione fotos que mostrem a qualidade do trabalho.</p>}
      </section>

      <div className="h-48" />
      <div className="fixed inset-x-0 bottom-0 space-y-2 border-t border-border bg-background/95 p-4 backdrop-blur"><div className="mx-auto max-w-3xl space-y-2"><Button size="lg" className="h-13 w-full text-base" onClick={() => void gerar()}><FileDown /> Finalizar e gerar PDF</Button><Button size="lg" variant="outline" className="h-13 w-full text-base" onClick={() => void compartilhar()}><Share2 /> Compartilhar no WhatsApp</Button></div></div>
    </AppShell>
  );
}

function Field({ label, value, onChange, type = "text", maxLength }: { label: string; value: string; onChange: (value: string) => void; type?: string; maxLength?: number }) { const id = `valor-${label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}`; return <div className="grid gap-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} /></div>; }
function SectionTitle({ children }: { children: React.ReactNode }) { return <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>; }
function ChoiceGroup({ title, values, selected, onToggle }: { title: string; values: readonly string[]; selected: string[]; onToggle: (value: string) => void }) { return <section className="rounded-lg border border-border bg-card p-4 shadow-sm"><h3 className="font-semibold text-card-foreground">{title}</h3><div className="mt-3 grid grid-cols-2 gap-2">{values.map((value) => { const active = selected.includes(value); return <Button key={value} type="button" variant={active ? "default" : "outline"} className="h-auto min-h-11 whitespace-normal px-3 py-2" onClick={() => onToggle(value)}>{active ? <Check /> : null}{value}</Button>; })}</div></section>; }
const PhotoInput = ({ ref, capture, multiple, onFiles }: { ref: React.RefObject<HTMLInputElement | null>; capture?: boolean; multiple?: boolean; onFiles: (files: FileList | null) => void | Promise<void> }) => <input ref={ref} type="file" accept="image/*" capture={capture ? "environment" : undefined} multiple={multiple} className={cn("hidden")} onChange={(event) => { void onFiles(event.target.files); event.target.value = ""; }} />;