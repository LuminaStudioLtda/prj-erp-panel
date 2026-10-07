import { Input } from "@/components/ui/input";

type AuthFieldProps = React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
};

/** Rótulo acima, campo e erro abaixo, com associação por aria. */
export function AuthField({ id, label, error, ...props }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-erro` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${id}-erro`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
