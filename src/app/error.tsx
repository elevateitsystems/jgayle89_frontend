"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-4">
      <ErrorState onRetry={reset} className="w-full" />
      <Link href="/" className={`${buttonVariants({ variant: "ghost" })} mt-4`}>
        Go to homepage
      </Link>
    </div>
  );
}
