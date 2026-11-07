import Image from "next/image";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .replace(/[&:]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Profile image, or an olive monogram when none was uploaded. */
export function BusinessAvatar({
  name,
  src,
  className,
  textClassName,
}: {
  name: string;
  src?: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-olive-700 text-sand-100",
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={`${name} profile`} fill sizes="128px" className="object-cover" />
      ) : (
        <span className={cn("font-heading font-semibold tracking-wide", textClassName)} aria-hidden>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
