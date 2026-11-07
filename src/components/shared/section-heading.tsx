import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
  inverted?: boolean;
  id?: string;
}

export function SectionHeading({ eyebrow, title, description, align = "left", action, className, inverted, id }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center sm:flex-col sm:items-center sm:justify-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className={cn("eyebrow", inverted && "text-olive-300")}>{eyebrow}</p>}
        <h2
          id={id}
          className={cn(
            "mt-2 text-3xl font-semibold leading-[1.1] sm:text-4xl",
            inverted ? "text-white" : "text-olive-950",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-3 text-base leading-relaxed sm:text-lg", inverted ? "text-olive-100/80" : "text-muted-foreground")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
