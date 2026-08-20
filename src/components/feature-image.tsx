"use client";

import Image from "next/image";
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
    <div className="relative w-full aspect-[5/4] sm:max-h-[420px] md:max-h-[520px]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
        className="object-contain"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}