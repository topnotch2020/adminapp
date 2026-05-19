export type ApiEnvelope<T> =
  | T
  | {
      success?: boolean;
      data?: T;
      message?: string;
    };

export const unwrapEnvelope = <T>(payload: ApiEnvelope<T>): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    const nested = (payload as { data?: T }).data;
    return (nested ?? (payload as unknown as T)) as T;
  }
  return payload as T;
};
