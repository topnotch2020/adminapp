import type { Broker } from "@/types/domain";

/** Initials in a tinted circle; `size` is the diameter in px. */
export function BrokerAvatar({ broker, size = 36 }: { broker: Pick<Broker, "fname" | "lname">; size?: number }) {
  const initials = `${broker.fname?.[0] ?? ""}${broker.lname?.[0] ?? ""}`.toUpperCase() || "B";
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: "color-mix(in srgb, var(--primary) 15%, transparent)",
        color: "var(--primary)",
      }}
    >
      {initials}
    </span>
  );
}
