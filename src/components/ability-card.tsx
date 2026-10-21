import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { abilityCards } from "@/data/ability-cards";
import {
  applyRank,
  formatNumber,
  formatStat,
  shownScales,
  statVisible,
  upgradeState,
  type AbilityCard,
  type AbilityRank,
  type CardScale,
  type CardStat,
} from "@/lib/ability-card";

const ATTR: Record<string, [string, string]> = {
  SpiritDamage: ["spirit damage", "spirit"],
  SpiritDPS: ["spirit damage over time", "spirit"],
  BonusSpiritDamage: ["bonus spirit damage", "spirit"],
  Spirit: ["spirit", "spirit"],
  SpiritIcon: ["spirit", "spirit"],
  SpiritResist: ["spirit resist", "spirit"],
  Healing: ["healing", "heal"],
  Heal: ["heal", "heal"],
  Heals: ["heals", "heal"],
  Regen: ["regeneration", "heal"],
  FireRate: ["fire rate", "fire"],
  BonusFireRate: ["bonus fire rate", "fire"],
  ReducedFireRate: ["reduced fire rate", "fire"],
  Slow: ["slow", "slow"],
  SlowResistance: ["slow resistance", "slow"],
  Stun: ["stun", "control"],
  KnockUp: ["knockup", "control"],
  KnockBack: ["knockback", "control"],
  Immobilize: ["immobilize", "control"],
  Silence: ["silence", "control"],
  Pulling: ["pulling", "control"],
  Pulls: ["pulls", "control"],
  MeleeDamage: ["melee damage", "melee"],
  WeaponDamage: ["weapon damage", "weapon"],
  BulletDamage: ["bullet damage", "weapon"],
  WeaponDPS: ["weapon damage over time", "weapon"],
  BonusWeaponDamage: ["bonus weapon damage", "weapon"],
  BonusMoveSpeed: ["bonus move speed", "move"],
  MoveSpeed: ["move speed", "move"],
  BonusSprintSpeed: ["bonus sprint speed", "move"],
  CombatBarrier: ["barrier", "barrier"],
  MaxHealth: ["max health", "heal"],
  DamageAmp: ["damage amp", "spirit"],
  BulletResist: ["bullet resist", "weapon"],
  PureDamage: ["pure damage", "spirit"],
};

const BIND: Record<string, string> = {
  ADS: "Alt Fire",
  Attack: "Fire",
  Ability1: "Ability 1",
  ABILITY1: "Ability 1",
  Ability2: "Ability 2",
  Ability3: "Ability 3",
  Ability4: "Ability 4",
  AltCast: "Alt Cast",
  Mantle: "Mantle",
  MoveForward: "Forward",
  Crouch: "Crouch",
  Roll: "Roll",
};

type Seg =
  | { kind: "text"; text: string }
  | { kind: "br" }
  | { kind: "attr"; id: string }
  | { kind: "span"; cls: string; kids: Seg[] };

function parseRich(input: string): Seg[] {
  const src = input.replace(/<Panel\b[^>]*>/gi, "").replace(/<\/Panel>/gi, "");
  const root: Seg[] = [];
  const stack: Seg[][] = [root];
  let i = 0;
  const push = (seg: Seg) => stack[stack.length - 1].push(seg);
  const attrPrefix = "{g:citadel_inline_attribute:'";
  const bindPrefix = "{g:citadel_binding:'";
  while (i < src.length) {
    if (src.startsWith(attrPrefix, i)) {
      const end = src.indexOf("'}", i);
      if (end < 0) break;
      push({ kind: "attr", id: src.slice(i + attrPrefix.length, end) });
      i = end + 2;
      continue;
    }
    if (src.startsWith(bindPrefix, i)) {
      const end = src.indexOf("'}", i);
      if (end < 0) break;
      const id = src.slice(i + bindPrefix.length, end);
      let label = BIND[id] ?? id;
      const prev = i > 0 ? src[i - 1] : "";
      const next = src[end + 2] ?? "";
      if (/[A-Za-z0-9]/.test(prev)) label = ` ${label}`;
      if (/[A-Za-z0-9]/.test(next)) label = `${label} `;
      push({ kind: "text", text: label });
      i = end + 2;
      continue;
    }
    if (src.startsWith("<br", i)) {
      const end = src.indexOf(">", i);
      if (end < 0) break;
      push({ kind: "br" });
      i = end + 1;
      continue;
    }
    if (src.startsWith("<span", i)) {
      const end = src.indexOf(">", i);
      if (end < 0) break;
      const cls = /class="([^"]*)"/.exec(src.slice(i, end))?.[1] ?? "";
      const node: Seg = { kind: "span", cls, kids: [] };
      push(node);
      stack.push(node.kids);
      i = end + 1;
      continue;
    }
    if (src.startsWith("</span>", i)) {
      if (stack.length > 1) stack.pop();
      i += 7;
      continue;
    }
    if (src[i] === "{") {
      const end = src.indexOf("}", i);
      if (end < 0) break;
      i = end + 1;
      continue;
    }
    if (src[i] === "<") {
      const end = src.indexOf(">", i);
      if (end < 0) break;
      i = end + 1;
      continue;
    }
    let j = i;
    while (j < src.length && src[j] !== "<" && src[j] !== "{") j += 1;
    push({ kind: "text", text: src.slice(i, j) });
    i = j;
  }
  return root;
}

const TONE: Record<string, string> = {
  spirit: "font-semibold text-[#d7a6ff]",
  heal: "font-semibold text-[#5ee6a0]",
  fire: "font-semibold text-[#ffb14a]",
  weapon: "font-semibold text-[#ffb14a]",
  melee: "font-semibold text-[#ff8b6a]",
  slow: "font-semibold text-[#9ec7ff]",
  control: "font-semibold text-[#f0d78c]",
  move: "font-semibold text-[#9ec7ff]",
  barrier: "font-semibold text-[#8eb6ff]",
};

function attrLabel(id: string): [string, string] {
  const known = ATTR[id];
  if (known) return known;
  const words = id
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase();
  return [words, "spirit"];
}

function spanClass(cls: string) {
  if (cls.includes("small_diminish")) return "text-[12px] text-[#a39888]";
  if (cls.includes("diminish")) return "text-[#a39888]";
  if (cls.includes("highlight_spirit")) return "font-semibold text-[#d7a6ff]";
  if (cls.includes("highlight_courage")) return "font-semibold text-[#ffb14a]";
  if (cls.includes("highlight")) return "font-semibold text-[#f6f1e6]";
  return "";
}

function RichText({ text, className }: { text: string; className?: string }) {
  const render = (segs: Seg[], keyBase: string): ReactNode[] =>
    segs.map((seg, index) => {
      const key = `${keyBase}-${index}`;
      if (seg.kind === "br") return <br key={key} />;
      if (seg.kind === "text") return <span key={key}>{seg.text}</span>;
      if (seg.kind === "attr") {
        const [label, tone] = attrLabel(seg.id);
        return (
          <span key={key} className={TONE[tone] ?? TONE.spirit}>
            {label}
          </span>
        );
      }
      return (
        <span key={key} className={spanClass(seg.cls)}>
          {render(seg.kids, key)}
        </span>
      );
    });
  return <span className={className}>{render(parseRich(text), "r")}</span>;
}

function Diamond({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.2 14.2 8 8 14.8 1.8 8 Z" fill={active ? "#d9ccff" : "#8d7bb8"} />
    </svg>
  );
}

function IconCrosshair() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="text-[#d9d3c8]">
      <circle cx="8" cy="8" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1.5v2.2M8 12.3v2.2M1.5 8h2.2M12.3 8h2.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconHourglass() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="text-[#c9b0ff]">
      <path d="M4 2h8M4 14h8M5 2c0 3 3 4 3 6s-3 3-3 6M11 2c0 3-3 4-3 6s3 3 3 6" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="text-[#d9d3c8]">
      <circle cx="8" cy="8" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.8V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.4 9.4 6h4.8L10.6 8.9l1.4 4.7L8 10.8 4 13.6l1.4-4.7L1.8 6h4.8Z" fill="currentColor" />
    </svg>
  );
}

function IconBoon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.5 9.2 6H14l-3.8 2.8 1.4 4.7L8 10.8 4.4 13.5l1.4-4.7L2 6h4.8Z" fill="currentColor" />
    </svg>
  );
}

function scaleTone(type: string) {
  if (type === "power_increase") return "text-[#7dffb0]";
  if (type === "weapon_power" || type === "weapon_damage_increase") return "text-[#ffb14a]";
  if (type === "melee" || type === "heavy_melee") return "text-[#ff8b6a]";
  return "text-[#d7a6ff]";
}

function ScaleMarks({ scales }: { scales: CardScale[] }) {
  if (scales.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      {scales.map((scale) => (
        <span key={scale.t} className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${scaleTone(scale.t)}`}>
          {scale.t === "power_increase" ? <IconBoon /> : <IconStar />}
          x{formatNumber(scale.v)}
        </span>
      ))}
    </span>
  );
}

function boxTheme(stat: CardStat) {
  if (stat.ty === "healing" || stat.ty === "health") {
    return "border-[#3d7a52] bg-[#163024]";
  }
  if (stat.ty === "tech_damage" || stat.ty === "spirit") {
    return "border-[#7a5aa3] bg-[#2a1c3d]";
  }
  if (stat.ty === "bullet_damage" || stat.ty === "melee_damage" || stat.ty === "fire_rate") {
    return "border-[#8a6230] bg-[#2a2116]";
  }
  return "border-[#3e3a36] bg-[#1b1917]";
}

function StatBox({ stat }: { stat: CardStat }) {
  const scales = shownScales(stat);
  return (
    <div className={`relative flex min-h-[76px] flex-1 flex-col items-center justify-center rounded-md border px-2 py-2 ${boxTheme(stat)}`}>
      {scales.length > 0 && (
        <div className="absolute -top-2 right-2 rounded bg-[#100e12]/90 px-1">
          <ScaleMarks scales={scales} />
        </div>
      )}
      <div className="text-lg font-semibold tabular-nums text-[#f4efe6]">{formatStat(stat.v, stat.u)}</div>
      <div className="mt-0.5 text-center text-[11px] leading-tight text-[#b7ad9e]">{stat.n}</div>
    </div>
  );
}

function pillIcon(stat: CardStat) {
  const label = `${stat.n} ${stat.k}`.toLowerCase();
  if (label.includes("range") || label.includes("radius") || label.includes("distance")) return <IconCrosshair />;
  if (label.includes("duration") || label.includes("time") || label.includes("linger")) return <IconHourglass />;
  return null;
}

export function AbilityCardView({ card, rank }: { card: AbilityCard; rank: AbilityRank }) {
  const view = applyRank(card, rank);
  const [brokenIcon, setBrokenIcon] = useState(false);
  return (
    <div className="rounded-lg border border-[#3a332c] bg-[#100e0c] p-3 text-[#f3eadc] shadow-2xl">
      <div className="flex items-start gap-3">
        {view.icon && !brokenIcon ? (
          <img
            src={`/abilities/${view.icon}`}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 object-contain"
            onError={() => setBrokenIcon(true)}
          />
        ) : (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#241c33] text-[#d7a6ff]">
            <Diamond active />
          </div>
        )}
        <h3 className="min-w-0 flex-1 pt-1 text-[22px] font-semibold leading-none tracking-tight text-[#f6f1e4]">
          {view.name}
        </h3>
        {view.cooldown && statVisible(view.cooldown) && (
          <div className="flex shrink-0 flex-col items-center rounded-md bg-[#2a2826] px-2.5 py-1.5">
            <IconClock />
            <span className="mt-0.5 text-sm font-semibold tabular-nums">{formatStat(view.cooldown.v, view.cooldown.u)}</span>
            {view.charge && statVisible(view.charge) && (
              <span className="text-[10px] text-[#b7ad9e]">{formatStat(view.charge.v, view.charge.u)}</span>
            )}
          </div>
        )}
      </div>
      {(view.pills.length > 0 || (view.charges != null && view.charges > 1)) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {view.charges != null && view.charges > 1 && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2a2826] px-2 py-1 text-sm font-semibold">
              ×{view.charges}
            </span>
          )}
          {view.pills.filter(statVisible).map((stat) => (
            <span
              key={stat.k}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#2a2826] px-2 py-1 text-sm font-semibold tabular-nums"
            >
              {pillIcon(stat)}
              {formatStat(stat.v, stat.u)}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 space-y-3">
        {view.sections.map((section, index) => {
          const boxes = section.main.filter(statVisible);
          const extras = section.alt.filter(statVisible);
          if (!section.desc && boxes.length === 0 && extras.length === 0) return null;
          return (
            <div key={index} className="space-y-2.5">
              {section.desc && (
                <p className="text-[15px] leading-snug text-[#f3eadc]">
                  <RichText text={section.desc} />
                </p>
              )}
              {boxes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {boxes.map((stat) => (
                    <StatBox key={stat.k} stat={stat} />
                  ))}
                </div>
              )}
              {extras.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-md bg-[#1a1816] px-3 py-2 text-[13px]">
                  {extras.map((stat) => (
                    <span key={stat.k} className="inline-flex items-center gap-1.5">
                      <span className="font-semibold tabular-nums">{formatStat(stat.v, stat.u)}</span>
                      <span className="text-[#d9d0c3]">{stat.n}</span>
                      <ScaleMarks scales={shownScales(stat)} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {view.upgrades.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {view.upgrades.map((upgrade, index) => {
            const state = upgradeState(index, rank);
            const shell =
              state === "active"
                ? "border-[#8d79d6] bg-[#1a1528]"
                : state === "owned"
                  ? "border-[#5c5180] bg-[#14121a]"
                  : "border-[#3c3648] bg-[#141218]";
            const head =
              state === "active" ? "bg-[#5b4a96] text-[#f4efff]" : state === "owned" ? "bg-[#3a3158] text-[#e4dcf6]" : "bg-[#2a2438] text-[#c9bddf]";
            return (
              <div key={upgrade.cost} className={`overflow-hidden rounded-md border ${shell}`}>
                <div className={`flex items-center justify-center gap-1 py-1.5 ${head}`}>
                  <Diamond active={state !== "idle"} />
                  <span className="text-sm font-semibold tabular-nums">{upgrade.cost}</span>
                </div>
                {upgrade.desc && (
                  <div
                    className={`px-1.5 py-2 text-center text-[12px] leading-snug ${state === "active" ? "text-[#f7f4ff]" : "text-[#e7e0d4]"}`}
                  >
                    <RichText text={upgrade.desc} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AbilityTip({
  target,
  row,
  list,
  name,
  rank,
  pinned = false,
  onTogglePin,
  onEnter,
  onLeave,
}: {
  target: HTMLElement;
  row?: HTMLElement | null;
  list?: HTMLElement | null;
  name: string;
  rank: AbilityRank;
  pinned?: boolean;
  onTogglePin?: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  const card = abilityCards[name];
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 8, top: 8, width: 420, maxHeight: 640, ready: false, overlaps: false });

  useLayoutEffect(() => {
    if (!card) return;
    function place() {
      const node = ref.current;
      if (!node) return;
      const hovered = (row ?? target).getBoundingClientRect();
      const anchor = target.getBoundingClientRect();
      const listBox = (list ?? target).getBoundingClientRect();
      const margin = 8;
      const gap = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const spaceListLeft = hovered.left - listBox.left;
      const spaceListRight = listBox.right - hovered.right;
      const otherIsRight = spaceListRight >= spaceListLeft;
      const otherSpace = Math.max(spaceListRight, spaceListLeft);
      const singleColumn = otherSpace < 80;

      let left = margin;
      let top = margin;
      let width = Math.min(420, vw - margin * 2);
      let maxHeight = vh - margin * 2;

      const beside = () => {
        if (otherIsRight) {
          const start = hovered.right + gap;
          const end = Math.min(listBox.right, vw - margin);
          width = Math.min(420, end - start);
          left = start;
        } else {
          const end = hovered.left - gap;
          const start = Math.max(listBox.left, margin);
          width = Math.min(420, end - start);
          left = end - width;
        }
        top = anchor.top;
        if (top < margin) top = margin;
        if (top > vh - margin - 180) top = Math.max(margin, vh - margin - 180);
        maxHeight = vh - top - margin;
      };

      const stack = () => {
        width = Math.min(420, vw - margin * 2);
        left = Math.max(margin, Math.min(hovered.left, vw - width - margin));
        const spaceBelow = vh - hovered.bottom - gap - margin;
        const spaceAbove = hovered.top - gap - margin;
        if (spaceBelow >= spaceAbove) {
          top = hovered.bottom + gap;
          maxHeight = Math.max(120, spaceBelow);
        } else {
          maxHeight = Math.max(120, spaceAbove);
          top = Math.max(margin, hovered.top - gap - maxHeight);
        }
      };

      let stacked = singleColumn;
      if (!singleColumn) beside();
      else stack();

      if (width < 180) {
        stack();
        stacked = true;
      }

      if (!stacked && otherIsRight) left = Math.max(left, hovered.right + gap);
      else if (!stacked) left = Math.min(left, hovered.left - gap - width);
      else left = Math.max(margin, Math.min(left, vw - width - margin));
      if (top < margin) top = margin;
      maxHeight = Math.max(120, Math.min(maxHeight, vh - top - margin));

      const hitsRow = () =>
        left < hovered.right - 1 &&
        left + width > hovered.left + 1 &&
        top < hovered.bottom - 1 &&
        top + maxHeight > hovered.top + 1;

      if (hitsRow()) {
        stack();
        stacked = true;
        left = Math.max(margin, Math.min(left, vw - width - margin));
        maxHeight = Math.max(120, Math.min(maxHeight, vh - top - margin));
      }

      const overlaps = stacked || hitsRow();
      setPos((current) => {
        if (
          current.ready &&
          current.left === left &&
          current.top === top &&
          current.width === width &&
          current.maxHeight === maxHeight &&
          current.overlaps === overlaps
        ) {
          return current;
        }
        return { left, top, width, maxHeight, ready: true, overlaps };
      });
    }
    place();
    const node = ref.current;
    const observer = node ? new ResizeObserver(() => place()) : null;
    if (node && observer) observer.observe(node);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [card, target, row, list, name, rank]);

  if (!card || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        left: pos.left,
        top: pos.top,
        width: pos.width,
        maxHeight: pos.maxHeight,
        visibility: pos.ready ? "visible" : "hidden",
      }}
      className={`fixed z-[80] overflow-y-auto overscroll-contain ${pinned || !pos.overlaps ? "" : "pointer-events-none"}`}
    >
      <div className="relative">
        <AbilityCardView key={name} card={card} rank={rank} />
        {onTogglePin && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onTogglePin();
            }}
            className="absolute right-2 top-2 z-10 rounded-md border border-[#5c5180] bg-[#1a1528]/90 px-2 py-1 text-[11px] font-medium text-[#e4dcf6] hover:bg-[#2a2438]"
            title={pinned ? "Unpin" : "Pin this card"}
          >
            {pinned ? "Unpin" : "Pin"}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
