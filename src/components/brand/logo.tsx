"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

// Intrinsic size of /public/logo.png (the official logo, trimmed of its empty
// transparent border and resized — the artwork itself is untouched).
const LOGO_WIDTH = 640;
const LOGO_HEIGHT = 585;

interface LogoProps {
  className?: string;
  /** Tailwind height classes for the image, e.g. "h-12 lg:h-14". Width follows the aspect ratio. */
  imgClassName?: string;
  href?: string | null;
  priority?: boolean;
}

/**
 * Renders the official Mission: SITREP logo from `siteConfig.logoSrc`.
 * The logo is never recoloured or distorted; place it on a light surface
 * (its wordmark is dark). A text wordmark is only a fallback if the file is missing.
 */
export function Logo({ className, imgClassName = "h-12", href = "/", priority }: LogoProps) {
  const [failed, setFailed] = useState(false);

  const ref = useCallback((img: HTMLImageElement | null) => {
    // Catches an image that already failed before hydration attached onError.
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  const content = failed ? (
    <span className="font-heading text-xl font-semibold leading-none tracking-tight text-olive-900">
      Mission<span className="text-brass">:</span> SITREP
    </span>
  ) : (
    <Image
      ref={ref}
      src={siteConfig.logoSrc}
      alt="Mission: SITREP"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      sizes="160px"
      className={cn("w-auto", imgClassName)}
      onError={() => setFailed(true)}
    />
  );

  if (!href) return <span className={cn("inline-flex items-center", className)}>{content}</span>;
  return (
    <Link href={href} aria-label="Mission: SITREP home" className={cn("inline-flex items-center", className)}>
      {content}
    </Link>
  );
}
