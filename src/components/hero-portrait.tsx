import { useState } from "react";
import { heroPortrait } from "@/data/hero-portraits";

function monogram(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function HeroPortrait({
  id,
  name,
  size = "icon",
}: {
  id: number;
  name: string;
  size?: "icon" | "card";
}) {
  const shot = heroPortrait(id);
  const src = size === "card" ? (shot?.card ?? shot?.icon) : shot?.icon;
  const [failed, setFailed] = useState(false);
  const box = size === "card" ? "h-28 w-20 text-lg" : "size-10 text-xs";
  if (!src || failed) {
    return (
      <span className={`grid shrink-0 place-items-center rounded-card bg-bg font-medium text-amber ${box}`}>
        {monogram(name)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={size === "card" ? 80 : 40}
      height={size === "card" ? 112 : 40}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-card bg-bg object-cover object-top ${box}`}
    />
  );
}
