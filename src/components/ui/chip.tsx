import { cn } from "@/lib/utils";

type ChipProps = React.ComponentProps<"button"> & {
  selected?: boolean;
};

function Chip({
  className,
  selected = false,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      data-slot="chip"
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-[background-color,color] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:min-h-9",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-ink hover:bg-border/40",
        className,
      )}
      {...props}
    />
  );
}

export { Chip };
