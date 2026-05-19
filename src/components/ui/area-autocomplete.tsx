"use client";

import { metaApi, type AddressAreaItem } from "@/lib/api/modules/meta";
import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSelect?: (item: AddressAreaItem) => void;
};

export function AreaAutocomplete({
  value,
  onChange,
  placeholder = "Filter by area",
  className = "input",
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AddressAreaItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !value.trim()) {
      setItems([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await metaApi.searchAreas(value, 12);
        setItems(result.items);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [open, value]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && value.trim() ? (
        <div
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border shadow-lg"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {loading ? (
            <p className="px-3 py-2 text-sm muted">Searching areas...</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-sm muted">No matching areas</p>
          ) : (
            items.map((item) => (
              <button
                key={`${item.region}-${item.name}`}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(item.name);
                  onSelect?.(item);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-xs muted">{item.region}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
