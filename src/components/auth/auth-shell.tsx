import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo imgClassName="h-16" priority />
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-olive-700 hover:text-olive-900">
            <ArrowLeft className="size-4" aria-hidden /> Back to site
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-semibold text-olive-950 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Demo only — no real accounts are created and no data leaves your browser.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-olive-950 text-white lg:block" aria-hidden>
        <Image src="/images/flag.jpg" alt="" fill sizes="50vw" priority className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-olive-950 via-olive-950/60 to-olive-950/30" />
        <div className="topo-bg absolute inset-0 opacity-[0.14]" />
        <div className="relative flex h-full flex-col justify-end p-14 xl:p-20">
          <ShieldCheck className="size-9 text-sand-300" />
          <blockquote className="mt-6 max-w-lg font-heading text-3xl font-medium leading-snug xl:text-4xl">
            “Serve first. Build second. Keep the community close.”
          </blockquote>
          <p className="mt-4 text-sm text-olive-200">Mission: SITREP — the veteran community directory</p>
        </div>
      </aside>
    </div>
  );
}
