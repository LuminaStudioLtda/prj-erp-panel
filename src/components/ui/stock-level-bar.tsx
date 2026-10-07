import { cn } from "@/lib/utils";

type StockLevelBarProps = {
  value: number;
  max: number;
  /** Proporção (0-1) até a qual o nível é considerado baixo. */
  lowRatio?: number;
  /** Proporção (0-1) até a qual o nível é considerado crítico. */
  criticalRatio?: number;
  label: string;
  className?: string;
};

function StockLevelBar({
  value,
  max,
  lowRatio = 0.35,
  criticalRatio = 0.15,
  label,
  className,
}: StockLevelBarProps) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const tone =
    ratio <= criticalRatio
      ? "bg-critical"
      : ratio <= lowRatio
        ? "bg-ochre"
        : "bg-sage";

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      data-slot="stock-level-bar"
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-border",
        className,
      )}
    >
      <div
        className={cn(
          "h-full origin-left rounded-full transition-transform duration-200",
          tone,
        )}
        style={{ transform: `scaleX(${ratio})` }}
      />
    </div>
  );
}

export { StockLevelBar };
