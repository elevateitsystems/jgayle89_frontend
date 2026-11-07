import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="topo-bg flex min-h-dvh flex-col items-center justify-center bg-sand-50 px-4 text-center">
      <Logo imgClassName="h-32" />
      <p className="eyebrow mt-10">Error 404</p>
      <h1 className="mt-2 text-4xl font-semibold text-olive-950 sm:text-5xl">This position isn&apos;t on the map</h1>
      <p className="mt-3 max-w-md text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on route.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants({ size: "lg" })}>Back to home</Link>
        <Link href="/directory" className={buttonVariants({ size: "lg", variant: "outline" })}>Browse directory</Link>
      </div>
    </div>
  );
}
