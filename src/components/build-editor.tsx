import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from "react";
import { Copy, Search } from "lucide-react";
import { abilityOrders } from "@/data/ability-orders";
import { abilityCards } from "@/data/ability-cards";
import { shopItems, type ShopItem, type ShopSlot } from "@/data/shop-items";
import { HeroPortrait } from "@/components/hero-portrait";
import { ItemTip, money } from "@/components/item-tip";
import { buildPath } from "@/lib/ability-path";
import { encodeBase64, encodeHeroBuild } from "@/lib/deadlock/build-codec";
import { HEROES } from "@/lib/deadlock/heroes";
import { compressBuild } from "@/lib/deadlock/zstd";
import { compareHeroNames, heroSearchRank } from "@/lib/hero-order";

const STORAGE_KEY = "build-editor-draft";

const COLUMNS: Array<{ slot: ShopSlot; name: string }> = [
  { slot: "weapon", name: "Weapon" },
  { slot: "vitality", name: "Vitality" },
  { slot: "spirit", name: "Spirit" },
];

const VIEWS: Array<{ id: "builds" | ShopSlot; label: string; fill: string }> = [
  { id: "builds", label: "Builds", fill: "bg-enemy" },
  { id: "weapon", label: "Weapon", fill: "bg-weapon" },
  { id: "vitality", label: "Vitality", fill: "bg-vitality" },
  { id: "spirit", label: "Spirit", fill: "bg-spirit" },
];

const SLOT_TEXT: Record<ShopSlot, string> = {
  weapon: "text-weapon",
  vitality: "text-vitality",
  spirit: "text-spirit",
};

type Lists = Record<ShopSlot, number[]>;
type Draft = { heroId: number; name: string; lists: Lists };
type Tip = { id: number; pinned: boolean; anchor: HTMLElement };

const byId = new Map(shopItems.map((item) => [item.id, item]));

function emptyLists(): Lists {
  return { weapon: [], vitality: [], spirit: [] };
}

function cleanLists(value: unknown): Lists {
  const lists = emptyLists();
  if (!value || typeof value !== "object") return lists;
  const source = value as Partial<Lists>;
  const seen = new Set<number>();
  for (const column of COLUMNS) {
    const ids = source[column.slot];
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      const item = byId.get(id);
      if (!item || item.slot !== column.slot || seen.has(id)) continue;
      seen.add(id);
      lists[column.slot].push(id);
    }
  }
  return lists;
}

function useFinePointer() {
  const [fine, setFine] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFine(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return fine;
}

export function BuildEditor() {
  const heroes = useMemo(
    () => HEROES.filter((hero) => hero.released).sort((a, b) => compareHeroNames(a.name, b.name)),
    [],
  );
  const [heroId, setHeroId] = useState(heroes[0]?.id ?? 0);
  const [name, setName] = useState("New build");
  const [lists, setLists] = useState<Lists>(emptyLists);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("builds");
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState("");
  const [packing, setPacking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const fine = useFinePointer();
  const hideTimer = useRef(0);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw) as Partial<Draft>;
        if (typeof draft.heroId === "number" && heroes.some((hero) => hero.id === draft.heroId)) {
          setHeroId(draft.heroId);
        }
        if (typeof draft.name === "string") setName(draft.name);
        setLists(cleanLists(draft.lists));
      } catch {
        // A bad draft just starts empty.
      }
    }
    setReady(true);
  }, [heroes]);

  useEffect(() => {
    if (!ready) return;
    const draft: Draft = { heroId, name, lists };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [heroId, name, lists, ready]);

  useEffect(() => {
    if (!tip || !tip.pinned) return;
    const pinned = tip;
    function onDoc(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (pinned.anchor.contains(target)) return;
      if (target instanceof Element && target.closest("[data-item-tip]")) return;
      setTip(null);
    }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [tip]);

  const hero = heroes.find((item) => item.id === heroId) ?? heroes[0];
  const orderHero = abilityOrders.heroes.find((item) => item.id === hero?.id);
  const clicks = useMemo(() => (orderHero ? buildPath(orderHero).clicks : []), [orderHero]);
  const taken = useMemo(() => new Set(COLUMNS.flatMap((column) => lists[column.slot])), [lists]);
  const listed = COLUMNS.reduce(
    (sum, column) => sum + lists[column.slot].reduce((inner, id) => inner + (byId.get(id)?.cost ?? 0), 0),
    0,
  );
  const tipItem = tip ? byId.get(tip.id) : undefined;

  const shop = useMemo(() => {
    if (view === "builds") return [];
    return shopItems
      .filter((item) => item.slot === view)
      .filter((item) => heroSearchRank(item.name, query, item.id) !== null)
      .sort((a, b) => a.tier - b.tier || a.cost - b.cost || compareHeroNames(a.name, b.name));
  }, [query, view]);
  const tiers = [...new Set(shop.map((item) => item.tier))];

  function forgetCode() {
    setOutput("");
    setCopied(false);
    setError(null);
  }

  function addItem(item: ShopItem) {
    if (taken.has(item.id)) return;
    setLists((current) => ({ ...current, [item.slot]: [...current[item.slot], item.id] }));
    setSelected(item.id);
    forgetCode();
  }

  function removeItem(id: number) {
    const item = byId.get(id);
    if (!item) return;
    setLists((current) => ({ ...current, [item.slot]: current[item.slot].filter((entry) => entry !== id) }));
    setSelected((current) => (current === id ? null : current));
    forgetCode();
  }

  function toggleItem(item: ShopItem) {
    if (taken.has(item.id)) removeItem(item.id);
    else addItem(item);
  }

  function moveItem(slot: ShopSlot, from: number, to: number) {
    setLists((current) => {
      const next = current[slot].slice();
      if (from === to || from < 0 || to < 0 || from >= next.length || to >= next.length) return current;
      const [moved] = next.splice(from, 1);
      if (moved === undefined) return current;
      next.splice(to, 0, moved);
      return { ...current, [slot]: next };
    });
    forgetCode();
  }

  function shiftSelected(slot: ShopSlot, direction: -1 | 1) {
    if (selected === null) return;
    const index = lists[slot].indexOf(selected);
    moveItem(slot, index, index + direction);
  }

  function cancelHide() {
    window.clearTimeout(hideTimer.current);
  }

  function scheduleHide() {
    cancelHide();
    hideTimer.current = window.setTimeout(() => {
      setTip((current) => (current?.pinned ? current : null));
    }, 140);
  }

  function showTip(id: number, anchor: HTMLElement, pinned: boolean) {
    cancelHide();
    setTip({ id, anchor, pinned });
  }

  function onShopClick(item: ShopItem, event: MouseEvent<HTMLButtonElement>) {
    if (!fine) {
      showTip(item.id, event.currentTarget, true);
      return;
    }
    toggleItem(item);
  }

  async function copyBuild() {
    if (!hero) return;
    setPacking(true);
    setError(null);
    try {
      const encoded = encodeHeroBuild({
        heroId: hero.id,
        name,
        columns: COLUMNS.map((column) => ({ name: column.name, itemIds: lists[column.slot] })),
        clicks,
      });
      const packed = encodeBase64(await compressBuild(encoded));
      setOutput(packed);
      try {
        await navigator.clipboard.writeText(packed);
        setCopied(true);
      } catch {
        setCopied(false);
        setError("Couldn't copy automatically. Select the code below.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't pack that build.");
    } finally {
      setPacking(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="max-w-3xl">
        <h2 className="font-display text-2xl text-fg">Build editor</h2>
        <p className="mt-1 text-pretty text-sm text-muted">
          Builds is the page you paste in game. Weapon, Vitality, and Spirit are the shop. Hover an item
          for its card. On a phone, tap the item, then add it from the card. Paste the code on the canvas,
          not the title.
        </p>
      </div>

      <div className="shop-frame flex flex-col gap-3 rounded-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            {hero ? <HeroPortrait id={hero.id} name={hero.name} /> : null}
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-fg" htmlFor="builder-hero">
              Hero
              <select
                id="builder-hero"
                value={hero?.id ?? ""}
                onChange={(event) => {
                  setHeroId(Number(event.target.value));
                  forgetCode();
                }}
                className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
              >
                {heroes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-fg" htmlFor="builder-name">
              Build name
              <input
                id="builder-name"
                value={name}
                maxLength={64}
                onChange={(event) => {
                  setName(event.target.value);
                  forgetCode();
                }}
                className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-soul">{money(listed)} souls</p>
            <button
              type="button"
              onClick={() => void copyBuild()}
              disabled={!hero || packing}
              className="inline-flex min-h-11 items-center gap-2 rounded-card bg-amber px-4 text-sm font-semibold text-ink disabled:opacity-40"
            >
              <Copy className="size-4" aria-hidden="true" />
              {packing ? "Packing…" : copied ? "Copied" : "Copy build"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Build or shop">
            {VIEWS.map((item) => {
              const selectedTab = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`builder-tab-${item.id}`}
                  aria-selected={selectedTab}
                  onClick={() => setView(item.id)}
                  className={
                    "min-h-11 rounded-card px-3 text-sm font-semibold text-ink " +
                    (selectedTab ? item.fill : "bg-fg")
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-card bg-shop-deep px-3 sm:w-64">
            <Search className="size-4 text-fg" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search items"
              className="min-h-11 w-full bg-transparent text-sm text-fg outline-none"
            />
          </label>
        </div>

        <div role="tabpanel" aria-labelledby={`builder-tab-${view}`}>
          {view === "builds" ? (
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 lg:grid-cols-3">
                {COLUMNS.map((column) => (
                  <CategoryBox
                    key={column.slot}
                    name={column.name}
                    slot={column.slot}
                    ids={lists[column.slot]}
                    query={query}
                    selected={selected}
                    fine={fine}
                    onOpenShop={() => setView(column.slot)}
                    onShow={showTip}
                    onHide={scheduleHide}
                    onSelect={(id, anchor) => {
                      setSelected(id);
                      if (!fine) showTip(id, anchor, true);
                    }}
                    onMove={moveItem}
                    onShift={shiftSelected}
                    onRemove={removeItem}
                  />
                ))}
              </div>
              {hero ? <AbilityTray heroId={hero.id} /> : null}
            </div>
          ) : tiers.length === 0 ? (
            <p className="text-sm text-fg">No items match.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {tiers.map((tier) => {
                const rows = shop.filter((item) => item.tier === tier);
                const cost = rows[0]?.cost ?? 0;
                return (
                  <div key={tier}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="bg-ink px-2 py-1 text-sm font-semibold text-fg">{money(cost)}</span>
                      <span className="text-xs font-semibold tracking-wide text-fg">
                        {tier >= 5 ? "Street Brawl" : `Tier ${tier}`}
                      </span>
                    </div>
                    <ul className="item-grid">
                      {rows.map((item) => (
                        <li key={item.id}>
                          <ItemTile
                            item={item}
                            owned={taken.has(item.id)}
                            selected={selected === item.id}
                            onClick={(event) => onShopClick(item, event)}
                            onShow={(anchor) => {
                              if (fine) showTip(item.id, anchor, false);
                            }}
                            onHide={scheduleHide}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error ? <p className="text-sm text-fg">{error}</p> : null}
        {output ? (
          <textarea
            readOnly
            value={output}
            spellCheck={false}
            aria-label="Build code"
            className="min-h-24 w-full rounded-card border border-line bg-bg px-3 py-2 font-mono text-xs text-fg"
          />
        ) : null}
      </div>

      {tip && tipItem ? (
        <ItemTip
          item={tipItem}
          anchor={tip.anchor}
          pinned={tip.pinned}
          actionLabel={tip.pinned ? (taken.has(tipItem.id) ? "Remove" : "Add") : undefined}
          onAction={
            tip.pinned
              ? () => {
                  toggleItem(tipItem);
                  setTip(null);
                }
              : undefined
          }
          onClose={() => setTip(null)}
          onEnter={cancelHide}
          onLeave={scheduleHide}
        />
      ) : null}
    </section>
  );
}

function CategoryBox({
  name,
  slot,
  ids,
  query,
  selected,
  fine,
  onOpenShop,
  onShow,
  onHide,
  onSelect,
  onMove,
  onShift,
  onRemove,
}: {
  name: string;
  slot: ShopSlot;
  ids: number[];
  query: string;
  selected: number | null;
  fine: boolean;
  onOpenShop: () => void;
  onShow: (id: number, anchor: HTMLElement, pinned: boolean) => void;
  onHide: () => void;
  onSelect: (id: number, anchor: HTMLElement) => void;
  onMove: (slot: ShopSlot, from: number, to: number) => void;
  onShift: (slot: ShopSlot, direction: -1 | 1) => void;
  onRemove: (id: number) => void;
}) {
  const visible = ids.filter((id) => {
    const item = byId.get(id);
    return item ? heroSearchRank(item.name, query, item.id) !== null : false;
  });
  const spent = ids.reduce((sum, id) => sum + (byId.get(id)?.cost ?? 0), 0);
  const selectedId = selected !== null && ids.includes(selected) ? selected : null;
  const selectedIndex = selectedId === null ? -1 : ids.indexOf(selectedId);

  function readDrag(event: DragEvent) {
    const [fromSlot, fromRaw] = event.dataTransfer.getData("text/plain").split(":");
    const from = Number(fromRaw);
    if (fromSlot !== slot || !Number.isInteger(from)) return null;
    return from;
  }

  return (
    <div
      className="shop-box flex flex-col rounded-card p-2"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const from = readDrag(event);
        if (from === null || ids.length === 0) return;
        onMove(slot, from, ids.length - 1);
      }}
    >
      <div className="flex items-center justify-between gap-2 px-1 py-1">
        <h3 className={`text-sm font-semibold ${SLOT_TEXT[slot]}`}>{name}</h3>
        <p className="text-xs font-semibold text-soul">{money(spent)}</p>
      </div>
      {visible.length === 0 ? (
        <button type="button" onClick={onOpenShop} className="min-h-11 rounded-card px-2 text-left text-sm text-fg">
          {ids.length === 0 ? `Add ${name.toLowerCase()} items` : "No items match."}
        </button>
      ) : (
        <ul className="item-grid">
          {visible.map((id) => {
            const item = byId.get(id);
            if (!item) return null;
            const index = ids.indexOf(id);
            return (
              <li key={id}>
                <ItemTile
                  item={item}
                  owned={false}
                  selected={selected === id}
                  draggable={fine}
                  onClick={(event) => onSelect(id, event.currentTarget)}
                  onShow={(anchor) => {
                    if (fine) onShow(id, anchor, false);
                  }}
                  onHide={onHide}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", `${slot}:${index}`);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const from = readDrag(event);
                    if (from === null) return;
                    onMove(slot, from, index);
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
      {selectedId !== null ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {ids.length > 1 ? (
            <>
              <button
                type="button"
                className="min-h-11 rounded-card bg-fg px-3 text-sm text-ink disabled:opacity-40"
                disabled={selectedIndex === 0}
                onClick={() => onShift(slot, -1)}
              >
                Earlier
              </button>
              <button
                type="button"
                className="min-h-11 rounded-card bg-fg px-3 text-sm text-ink disabled:opacity-40"
                disabled={selectedIndex === ids.length - 1}
                onClick={() => onShift(slot, 1)}
              >
                Later
              </button>
            </>
          ) : null}
          <button type="button" className="min-h-11 rounded-card bg-fg px-3 text-sm text-ink" onClick={() => onRemove(selectedId)}>
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ItemTile({
  item,
  owned,
  selected,
  draggable = false,
  onClick,
  onShow,
  onHide,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: ShopItem;
  owned: boolean;
  selected: boolean;
  draggable?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onShow: (anchor: HTMLButtonElement) => void;
  onHide: () => void;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      draggable={draggable}
      data-owned={owned ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
      className="item-tile"
      aria-label={`${item.name}, ${money(item.cost)}${owned ? ", already in the build" : ""}`}
      onClick={onClick}
      onMouseEnter={(event) => onShow(event.currentTarget)}
      onMouseLeave={onHide}
      onFocus={(event) => onShow(event.currentTarget)}
      onBlur={onHide}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span className="relative grid size-11 place-items-center">
        <ItemArt item={item} />
        {item.active ? <span className="item-active">ACTIVE</span> : null}
      </span>
      <span className="item-tile-name">{item.name}</span>
    </button>
  );
}

function ItemArt({ item }: { item: ShopItem }) {
  const [failed, setFailed] = useState(false);
  if (!item.image || failed) {
    return <span className={`text-xs font-semibold ${SLOT_TEXT[item.slot]}`}>{item.tier}</span>;
  }
  return (
    <img
      src={item.image}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="size-10 object-contain"
    />
  );
}

function AbilityTray({ heroId }: { heroId: number }) {
  const hero = abilityOrders.heroes.find((item) => item.id === heroId);
  if (!hero) return <p className="text-sm text-fg">This hero has no ability order yet, so the code only carries items.</p>;
  const abilities = [...hero.abilities].sort((a, b) => a.slot - b.slot);
  return (
    <div className="shop-well rounded-card p-3">
      <p className="text-xs text-fg">The copied code includes the recommended ability order.</p>
      <ol className="mt-2 flex flex-wrap gap-3">
        {abilities.map((ability) => {
          const icon = abilityCards[ability.name]?.icon;
          const src = icon ? `${import.meta.env.BASE_URL}abilities/${icon}` : null;
          return (
            <li key={ability.id} className="flex w-20 flex-col items-center gap-1 text-center">
              {src ? (
                <img src={src} alt="" width={48} height={48} className="size-12 rounded-full bg-bg object-cover" />
              ) : (
                <span className="grid size-12 place-items-center rounded-full bg-bg text-xs text-fg">{ability.slot}</span>
              )}
              <span className="text-xs leading-tight text-fg">{ability.name}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
