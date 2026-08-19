"use client";

import { useState } from "react";

/**
 * A feature-guide illustration image. If the asset hasn't been added yet, the
 * image fails to load and we hide it entirely so the card degrades to a clean
 * headline + description instead of showing a broken-image icon.
 */
export function FeatureImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="flex justify-center">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full max-h-[320px] sm:max-h-[420px] md:max-h-[520px] object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
