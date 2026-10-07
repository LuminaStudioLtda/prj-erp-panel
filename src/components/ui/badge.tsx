import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Badge genérico por tom. O mapeamento status -> tom pertence à feature do domínio. */
const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-border/60 text-ink",
        primary: "bg-primary text-primary-foreground",
        success: "bg-sage/25 text-sage-foreground",
        warning: "bg-ochre/25 text-ochre-foreground",
        critical: "bg-critical/10 text-critical",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
