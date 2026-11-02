import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { shopItems, type ShopCast, type ShopItem, type ShopScale, type ShopStat } from "@/data/shop-items";

const byId = new Map(shopItems.map((item) => [item.id, item]));

type Seg = { kind: "text"; text: string } | { kind: "br" } | { kind: "span"; cls: string; kids: Seg[] };

function parseRich(input: string): Seg[] {
  const src = input.replace(/<svg\b[\s\S]*?<\/svg>/gi, "");
  const root: Seg[] = [];
  const stack: Seg[][] = [root];
  let i = 0;
  const push = (seg: Seg) => stack[stack.length - 1]?.push(seg);
  while (i < src.length) {
    if (src.startsWith("<br", i)) {
      const end = src.indexOf(">", i);
      if (end < 0) break;
      push({ kind: "br" });
      i = end + 1;
      continue;
    }
    if (src.startsWith("</span>", i)) {
      if (stack.length > 1) stack.pop();
      i += 7;
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
    if (src[i] === "<") {
      const end = src.indexOf(">", i);
      if (end < 0) break;
      i = end + 1;
      continue;
    }
    let j = i;
    while (j < src.length && src[j] !== "<") j += 1;
    push({ kind: "text", text: src.slice(i, j) });
    i = j;
  }
  return root;
}

function tone(cls: string) {
  const id = cls.toLowerCase();
  if (id.includes("diminish")) return "opacity-70";
  if (id.includes("spirit") || id.includes("tech")) return "font-semibold text-spirit";
  if (id.includes("weapon") || id.includes("bullet") || id.includes("fire") || id.includes("melee")) {
    return "font-semibold text-weapon";
  }
  if (id.includes("heal") || id.includes("regen")) return "font-semibold text-vitality";
  if (id.includes("slow") || id.includes("move")) return "font-semibold text-enemy";
  if (id.includes("stun")) return "font-semibold text-amber";
  if (id.includes("highlight")) return "font-semibold text-fg";
  return "";
}

function RichText({ text }: { text: string }) {
  const render = (segs: Seg[], keyBase: string): ReactNode[] =>
    segs.map((seg, index) => {
      const key = `${keyBase}-${index}`;
      if (seg.kind === "br") return <br key={key} />;
      if (seg.kind === "text") return <span key={key}>{seg.text}</span>;
      return (
        <span key={key} className={tone(seg.cls)}>
          {render(seg.kids, key)}
        </span>
      );
    });
  return <>{render(parseRich(text), "r")}</>;
}

export function money(cost: number) {
  return `$${cost.toLocaleString("en-US")}`;
}

function castLabel(cast: ShopCast) {
  if (cast === "passive") return "Passive";
  if (cast === "toggle") return "Toggle";
  return "Active";
}

function ScaleMark({ scale }: { scale: ShopScale }) {
  const className = scale.t === "boon" ? "text-vitality" : scale.t === "weapon" ? "text-weapon" : "text-spirit";
  const label = scale.t === "boon" ? "boon" : scale.t === "weapon" ? "weapon" : "spirit";
  return (
    <span className={`text-xs font-semibold ${className}`}>
      ×{scale.v} {label}
    </span>
  );
}

function StatRow({ stat }: { stat: ShopStat }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {stat.icon ? (
        <img src={stat.icon} alt="" width={16} height={16} className="size-4 shrink-0" referrerPolicy="no-referrer" />
      ) : (
        <span className="size-4 shrink-0" />
      )}
      <span className="font-semibold text-stat">{stat.v}</span>
      <span className="min-w-0 flex-1">{stat.n}</span>
      {stat.sc ? <ScaleMark scale={stat.sc} /> : null}
    </div>
  );
}

function Clock() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className="text-fg">
      <circle cx="8" cy="8" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.8V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ItemTip({
  item,
  anchor,
  pinned,
  actionLabel,
  onAction,
  onClose,
  onEnter,
  onLeave,
}: {
  item: ShopItem;
  anchor: HTMLElement;
  pinned: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 8, top: 8, width: 300, maxHeight: 420, ready: false });
  const components = item.from.map((id) => byId.get(id)).filter((entry): entry is ShopItem => Boolean(entry));
  const showCast = Boolean(item.body || item.effects.length || item.cooldown);

  useLayoutEffect(() => {
    function place() {
      const node = ref.current;
      if (!node) return;
      const box = anchor.getBoundingClientRect();
      const margin = 8;
      const gap = 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(320, vw - margin * 2);
      const maxHeight = Math.min(460, vh - margin * 2);
      const spaceRight = vw - box.right - gap - margin;
      const spaceLeft = box.left - gap - margin;
      let left = margin;
      let top = box.top;
      if (vw >= 720 && (spaceRight >= width || spaceLeft >= width)) {
        left = spaceRight >= spaceLeft ? box.right + gap : box.left - gap - width;
      } else {
        left = Math.max(margin, Math.min(box.left, vw - width - margin));
        const below = vh - box.bottom - gap - margin;
        top = below > 160 ? box.bottom + gap : Math.max(margin, box.top - gap - maxHeight);
      }
      left = Math.max(margin, Math.min(left, vw - width - margin));
      top = Math.max(margin, Math.min(top, vh - margin - 120));
      const nextHeight = Math.max(120, Math.min(maxHeight, vh - top - margin));
      setPos((current) => {
        if (
          current.ready &&
          current.left === left &&
          current.top === top &&
          current.width === width &&
          current.maxHeight === nextHeight
        ) {
          return current;
        }
        return { left, top, width, maxHeight: nextHeight, ready: true };
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
  }, [anchor, item.id]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      data-item-tip
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        left: pos.left,
        top: pos.top,
        width: pos.width,
        maxHeight: pos.maxHeight,
        visibility: pos.ready ? "visible" : "hidden",
      }}
      className={`item-tip fixed z-[80] overflow-y-auto overscroll-contain rounded-card shadow-lg ${pinned ? "" : "pointer-events-none"}`}
      data-slot={item.slot}
    >
      <div className="item-tip-head px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">{item.name}</h3>
          {pinned && onClose ? (
            <button type="button" onClick={onClose} className="min-h-11 shrink-0 px-2 text-sm">
              Close
            </button>
          ) : null}
        </div>
      </div>
      <div className="item-tip-body flex flex-col gap-1 px-3 py-2 text-sm">
        <p className="font-semibold text-soul">{money(item.cost)}</p>
        {item.imbue ? <p className="text-xs text-spirit">{item.imbue}</p> : null}
        {item.innate.map((stat) => (
          <p key={`${stat.n}-${stat.v}`} className="font-medium text-stat">
            {stat.v} {stat.n}
            {stat.sc ? (
              <>
                {" "}
                <ScaleMark scale={stat.sc} />
              </>
            ) : null}
          </p>
        ))}
        {showCast ? (
          <div className="mt-1 flex items-center justify-between gap-2 font-semibold">
            <span>{castLabel(item.cast)}</span>
            {item.cooldown ? (
              <span className="inline-flex items-center gap-1 font-medium">
                <Clock />
                {item.cooldown}
              </span>
            ) : null}
          </div>
        ) : null}
        {item.body ? (
          <p className="text-pretty leading-snug">
            <RichText text={item.body} />
          </p>
        ) : null}
        {item.effects.length > 0 ? (
          <div className="mt-1 flex flex-col gap-1">
            {item.effects.map((stat) => (
              <StatRow key={`${stat.n}-${stat.v}`} stat={stat} />
            ))}
          </div>
        ) : null}
        {components.length > 0 ? (
          <div className="mt-2 border-t border-fg/25 pt-2">
            <p className="text-xs font-semibold tracking-wide">Upgrades from</p>
            <ul className="mt-1 flex flex-col gap-1">
              {components.map((component) => (
                <li key={component.id} className="flex items-center gap-2">
                  <img
                    src={component.image}
                    alt=""
                    width={22}
                    height={22}
                    className="size-6 rounded-card bg-fg object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <span>{component.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {pinned && actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="mt-2 min-h-11 rounded-card bg-fg px-3 text-sm font-semibold text-ink">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
