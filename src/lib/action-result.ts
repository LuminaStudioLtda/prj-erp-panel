export type FieldErrors = Record<string, string[]>;

export type ActionError = {
  code: string;
  message: string;
  fieldErrors?: FieldErrors;
};

export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: ActionError };

export function success<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function failure(error: ActionError): ActionResult<never> {
  return { ok: false, error };
}
