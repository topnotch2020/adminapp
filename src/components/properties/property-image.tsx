"use client";

import { ImageOff, ImagePlus } from "lucide-react";
import { useState } from "react";

const CLOUDINARY_UPLOAD = "/image/upload/";

/**
 * Asks Cloudinary for a copy cropped to exactly width×height (smart crop,
 * auto format/quality), so every card gets the same shape and a small file
 * no matter what was uploaded. Non-Cloudinary URLs are returned unchanged.
 * See playbook.md, "Property images".
 */
export function sizedImageUrl(url: string, width: number, height: number) {
  if (!url.includes("res.cloudinary.com") || !url.includes(CLOUDINARY_UPLOAD)) return url;
  const transform = `c_fill,g_auto,w_${width},h_${height},f_auto,q_auto`;
  return url.replace(CLOUDINARY_UPLOAD, `${CLOUDINARY_UPLOAD}${transform}/`);
}

type Variant = "banner" | "thumb";

/**
 * Listing photo in a fixed-size box. The parent decides the size through
 * `className` (e.g. "h-48 w-full"); the image always fills it with object-cover,
 * so tall or wide uploads never change the layout. Shows a shimmer while
 * loading and a fallback when there is no photo or it fails to load.
 */
export function PropertyImage({
  url,
  alt,
  className = "",
  width = 640,
  height = 400,
  variant = "banner",
  rounded = "",
}: {
  url?: string;
  alt: string;
  className?: string;
  /** Pixel size requested from Cloudinary; roughly 2× the displayed size. */
  width?: number;
  height?: number;
  variant?: Variant;
  rounded?: string;
}) {
  const src = url ? sizedImageUrl(url, width, height) : undefined;
  // Tracked per URL, so switching to another photo resets the state without an effect
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src) && failedSrc === src;
  const loaded = Boolean(src) && loadedSrc === src;

  return (
    <div className={`relative shrink-0 overflow-hidden ${rounded} ${className}`} style={{ background: "var(--surface-2)" }}>
      {src && !failed ? (
        <>
          {!loaded ? <div className="skeleton absolute inset-0 !rounded-none" /> : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoadedSrc(src)}
            onError={() => setFailedSrc(src)}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
            style={{ opacity: loaded ? 1 : 0 }}
          />
        </>
      ) : (
        <Fallback variant={variant} reason={src ? "failed" : "missing"} />
      )}
    </div>
  );
}

function Fallback({ variant, reason }: { variant: Variant; reason: "missing" | "failed" }) {
  const Icon = reason === "missing" ? ImagePlus : ImageOff;
  if (variant === "thumb") {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        title={reason === "missing" ? "No photos" : "Photo couldn't load"}
      >
        <Icon size={16} className="muted" />
      </div>
    );
  }
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, var(--surface-2)), color-mix(in srgb, var(--accent) 8%, var(--surface-2)))",
      }}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: "var(--surface)", color: "var(--primary)", boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}
      >
        <Icon size={20} />
      </span>
      <p className="text-sm font-medium">{reason === "missing" ? "No photos yet" : "Photo unavailable"}</p>
      <p className="text-xs muted">
        {reason === "missing" ? "The broker hasn't added photos" : "The image link is broken or was removed"}
      </p>
    </div>
  );
}
