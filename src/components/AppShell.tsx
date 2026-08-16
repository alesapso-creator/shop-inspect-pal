import { Link } from "@tanstack/react-router";
import { ChevronLeft, ClipboardCheck } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({
  title,
  subtitle,
  backTo,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  backTo?: { to: string; params?: Record<string, string> };
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          {backTo ? (
            <Link
              to={backTo.to}
              params={backTo.params as never}
              aria-label="Voltar"
              className="-ml-2 rounded-full p-2 transition-colors hover:bg-primary-foreground/10"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : (
            <span className="rounded-full bg-primary-foreground/10 p-2">
              <ClipboardCheck className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-primary-foreground/70">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4">{children}</main>
    </div>
  );
}
