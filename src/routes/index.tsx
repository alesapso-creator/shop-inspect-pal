import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, Beef, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";

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
        content: "Acesse relatórios de inspeção e rendimento bovino em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell title="Gestão de Loja" subtitle="Relatórios e reconhecimentos">
      <section className="py-4">
        <p className="text-sm font-medium text-primary">Bem-vindo</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">O que deseja consultar?</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Escolha uma opção para abrir os relatórios já realizados ou iniciar um novo registro.
        </p>
      </section>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Link
          to="/inspecoes"
          className="group flex min-h-44 flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:bg-accent"
        >
          <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardCheck className="size-6" />
          </span>
          <span className="mt-8 flex items-end justify-between gap-3">
            <span>
              <span className="block text-lg font-bold text-card-foreground">Inspeção</span>
              <span className="mt-1 block text-sm text-muted-foreground">Histórico de visitas e conformidades</span>
            </span>
            <ArrowRight className="mb-1 size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

      <Link
        to="/rendimento"
          className="group flex min-h-44 flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:bg-accent"
      >
          <span className="flex size-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Beef className="size-6" />
          </span>
          <span className="mt-8 flex items-end justify-between gap-3">
            <span>
              <span className="block text-lg font-bold text-card-foreground">Rendimento</span>
              <span className="mt-1 block text-sm text-muted-foreground">Histórico de pesos, perdas e resultados</span>
            </span>
            <ArrowRight className="mb-1 size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </span>
      </Link>

        <Link
          to="/acougueiro-valor"
          className="group flex min-h-44 flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:bg-accent sm:col-span-2"
        >
          <span className="flex size-12 items-center justify-center rounded-lg bg-warn text-foreground">
            <Award className="size-6" />
          </span>
          <span className="mt-8 flex items-end justify-between gap-3">
            <span>
              <span className="block text-lg font-bold text-card-foreground">Açougueiro de Valor</span>
              <span className="mt-1 block text-sm text-muted-foreground">Reconheça colaboradores e valorize seus destaques</span>
            </span>
            <ArrowRight className="mb-1 size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </AppShell>
  );
}
