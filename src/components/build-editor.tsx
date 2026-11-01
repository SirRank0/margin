import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Search, X } from "lucide-react";
import { abilityOrders } from "@/data/ability-orders";
import { shopItems, type ShopItem, type ShopSlot } from "@/data/shop-items";
import { HeroPortrait } from "@/components/hero-portrait";
import { buildPath } from "@/lib/ability-path";
import { encodeBase64, encodeHeroBuild } from "@/lib/deadlock/build-codec";
import { HEROES, type Hero } from "@/lib/deadlock/heroes";
import { compressBuild } from "@/lib/deadlock/zstd";
import { compareHeroNames, heroSearchRank } from "@/lib/hero-order";

const STORAGE_KEY = "build-editor-draft";

const COLUMNS: Array<{ slot: ShopSlot; name: string }> = [
  { slot: "weapon", name: "Weapon" },
  { slot: "vitality", name: "Vitality" },
  { slot: "spirit", name: "Spirit" },
];

const SLOT_TEXT: Record<ShopSlot, string> = {
  weapon: "text-weapon",
  vitality: "text-vitality",
  spirit: "text-spirit",
};

const SLOT_BORDER: Record<ShopSlot, string> = {
  weapon: "border-weapon",
  vitality: "border-vitality",
  spirit: "border-spirit",
};

type Lists = Record<ShopSlot, number[]>;

type Draft = { heroId: number; name: string; lists: Lists };

const byId = new Map(shopItems.map((item) => [item.id, item]));

function emptyLists(): Lists {
  return { weapon: [], vitality: [], spirit: [] };
}

function cleanLists(value: unknown): Lists {
  const lists = emptyLists();
  if (!value || typeof value !== "object") return lists;
  const source = value as Partial<Lists>;
  for (const column of COLUMNS) {
    const ids = source[column.slot];
    if (!Array.isArray(ids)) continue;
    const seen = new Set<number>();
    for (const id of ids) {
      const item = byId.get(id);
      if (!item || item.slot !== column.slot || seen.has(id)) continue;
      seen.add(id);
      lists[column.slot].push(id);
    }
  }
  return lists;
}

function money(cost: number) {
  return `$${cost.toLocaleString("en-US")}`;
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
  const [heroQuery, setHeroQuery] = useState("");
  const [slot, setSlot] = useState<ShopSlot>("weapon");
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState("");
  const [packing, setPacking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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

  const hero = heroes.find((item) => item.id === heroId) ?? heroes[0];
  const orderHero = abilityOrders.heroes.find((item) => item.id === hero?.id);
  const clicks = useMemo(() => (orderHero ? buildPath(orderHero).clicks : []), [orderHero]);
  const taken = useMemo(() => new Set(COLUMNS.flatMap((column) => lists[column.slot])), [lists]);
  const listed = COLUMNS.reduce(
    (sum, column) => sum + lists[column.slot].reduce((inner, id) => inner + (byId.get(id)?.cost ?? 0), 0),
    0,
  );

  const shop = useMemo(() => {
    return shopItems
      .filter((item) => item.slot === slot)
      .filter((item) => heroSearchRank(item.name, query, item.id) !== null)
      .sort((a, b) => a.tier - b.tier || a.cost - b.cost || compareHeroNames(a.name, b.name));
  }, [query, slot]);

  const tiers = [...new Set(shop.map((item) => item.tier))];
  const heroChoices = heroes.filter((item) => heroSearchRank(item.name, heroQuery, item.id) !== null);

  function forgetCode() {
    setOutput("");
    setCopied(false);
    setError(null);
  }

  function addItem(item: ShopItem) {
    if (taken.has(item.id)) return;
    setLists((current) => ({ ...current, [item.slot]: [...current[item.slot], item.id] }));
    setSlot(item.slot);
    forgetCode();
  }

  function removeItem(column: ShopSlot, id: number) {
    setLists((current) => ({ ...current, [column]: current[column].filter((item) => item !== id) }));
    forgetCode();
  }

  function shift(column: ShopSlot, index: number, direction: -1 | 1) {
    setLists((current) => {
      const next = current[column].slice();
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const [moved] = next.splice(index, 1);
      if (moved === undefined) return current;
      next.splice(target, 0, moved);
      return { ...current, [column]: next };
    });
    forgetCode();
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
    <section className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <h2 className="font-display text-2xl text-fg">Build editor</h2>
        <p className="mt-1 text-pretty text-sm text-muted">
          Put together a build the way the in-game editor does: three shop columns, in the order you
          would buy them, plus this hero's ability order. Copy the code and paste it on that hero's
          build page, on the canvas rather than the title.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="builder-hero-search">
            Hero
            <span className="flex items-center gap-2 rounded-card border border-line bg-bg px-3">
              <Search className="size-4" aria-hidden="true" />
              <input
                id="builder-hero-search"
                value={heroQuery}
                onChange={(event) => setHeroQuery(event.target.value)}
                placeholder="Search"
                className="min-h-11 w-full bg-transparent text-sm text-fg outline-none"
              />
            </span>
          </label>
          <ul className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto lg:grid-cols-1">
            {heroChoices.map((item) => (
              <li key={item.id}>
                <HeroButton hero={item} selected={item.id === hero?.id} onChoose={() => { setHeroId(item.id); forgetCode(); }} />
              </li>
            ))}
          </ul>
          <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="builder-name">
            Build name
            <input
              id="builder-name"
              value={name}
              onChange={(event) => { setName(event.target.value); forgetCode(); }}
              maxLength={64}
              className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Sum of listed prices <span className="text-fg">{money(listed)}</span>
            </p>
            <button
              type="button"
              onClick={() => void copyBuild()}
              disabled={!hero || packing}
              className="inline-flex min-h-11 items-center gap-2 rounded-card bg-fg px-4 text-sm text-bg disabled:opacity-40"
            >
              <Copy className="size-4" aria-hidden="true" />
              {packing ? "Packing…" : copied ? "Copied" : "Copy build"}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {COLUMNS.map((column) => (
              <BuildColumn
                key={column.slot}
                name={column.name}
                slot={column.slot}
                active={slot === column.slot}
                ids={lists[column.slot]}
                onFocus={() => setSlot(column.slot)}
                onRemove={(id) => removeItem(column.slot, id)}
                onShift={(index, direction) => shift(column.slot, index, direction)}
              />
            ))}
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
          <details className="text-sm text-muted">
            <summary className="min-h-11 cursor-pointer text-sm text-muted">
              {orderHero
                ? "Ability order included in the code"
                : "This hero has no ability order yet, so the code only carries items."}
            </summary>
            {clicks.length > 0 ? <AbilityStrip clicks={clicks} heroId={hero?.id ?? 0} /> : null}
          </details>
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-1" role="tablist" aria-label="Shop category">
            {COLUMNS.map((column) => {
              const selected = slot === column.slot;
              return (
                <button
                  key={column.slot}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setSlot(column.slot)}
                  className={
                    "min-h-11 border-b-2 px-3 text-sm " +
                    (selected ? `border-current ${SLOT_TEXT[column.slot]}` : "border-transparent text-muted")
                  }
                >
                  {column.name}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 rounded-card border border-line bg-bg px-3 sm:w-64" htmlFor="builder-item-search">
            <Search className="size-4 text-muted" aria-hidden="true" />
            <input
              id="builder-item-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search items"
              className="min-h-11 w-full bg-transparent text-sm text-fg outline-none"
            />
          </label>
        </div>
        {tiers.length === 0 ? <p className="mt-4 text-sm text-muted">No items match.</p> : null}
        <div className="mt-4 flex flex-col gap-5">
          {tiers.map((tier) => (
            <div key={tier}>
              <h3 className="text-sm text-muted">Tier {tier}</h3>
              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {shop
                  .filter((item) => item.tier === tier)
                  .map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        disabled={taken.has(item.id)}
                        className="flex min-h-14 w-full items-center gap-3 rounded-card border border-line bg-raised px-2 text-left disabled:opacity-40"
                      >
                        <ItemIcon item={item} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-fg">{item.name}</span>
                          <span className="text-xs text-muted">
                            {money(item.cost)}
                            {item.active ? " · Active" : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroButton({ hero, selected, onChoose }: { hero: Hero; selected: boolean; onChoose: () => void }) {
  return (
    <button
      type="button"
      onClick={onChoose}
      aria-pressed={selected}
      className={
        "flex min-h-14 w-full items-center gap-2 rounded-card border px-2 text-left text-sm " +
        (selected ? "border-fg bg-fg text-bg" : "border-line bg-raised text-fg")
      }
    >
      <HeroPortrait id={hero.id} name={hero.name} />
      <span className="truncate">{hero.name}</span>
    </button>
  );
}

function BuildColumn({
  name,
  slot,
  active,
  ids,
  onFocus,
  onRemove,
  onShift,
}: {
  name: string;
  slot: ShopSlot;
  active: boolean;
  ids: number[];
  onFocus: () => void;
  onRemove: (id: number) => void;
  onShift: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <div className={"rounded-card border bg-surface p-3 " + (active ? SLOT_BORDER[slot] : "border-line")}>
      <button type="button" onClick={onFocus} className={"min-h-11 text-sm " + SLOT_TEXT[slot]}>
        {name}
        <span className="ml-2 text-muted">{ids.length}</span>
      </button>
      {ids.length === 0 ? <p className="text-sm text-muted">Nothing in this column yet.</p> : null}
      <ol className="mt-2 flex flex-col gap-2">
        {ids.map((id, index) => {
          const item = byId.get(id);
          if (!item) return null;
          return (
            <li key={id} className="flex items-center gap-2">
              <ItemIcon item={item} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-fg">{item.name}</span>
                <span className="text-xs text-muted">{money(item.cost)}</span>
              </span>
              <button type="button" className="grid size-11 place-items-center text-muted" aria-label={`Move ${item.name} up`} onClick={() => onShift(index, -1)} disabled={index === 0}>
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className="grid size-11 place-items-center text-muted" aria-label={`Move ${item.name} down`} onClick={() => onShift(index, 1)} disabled={index === ids.length - 1}>
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className="grid size-11 place-items-center text-muted" aria-label={`Remove ${item.name}`} onClick={() => onRemove(id)}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ItemIcon({ item }: { item: ShopItem }) {
  const [failed, setFailed] = useState(false);
  if (!item.image || failed) {
    return <span className={`grid size-10 shrink-0 place-items-center rounded-card bg-bg text-xs ${SLOT_TEXT[item.slot]}`}>{item.tier}</span>;
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
      className="size-10 shrink-0 rounded-card bg-bg object-contain"
    />
  );
}

function AbilityStrip({ clicks, heroId }: { clicks: Array<{ ability: number; rank: 0 | 1 | 2 | 5 }>; heroId: number }) {
  const hero = abilityOrders.heroes.find((item) => item.id === heroId);
  const names = new Map(hero?.abilities.map((ability) => [ability.id, ability.name]) ?? []);
  return (
    <ol className="flex flex-wrap gap-1">
      {clicks.map((click, index) => (
        <li key={`${click.ability}-${click.rank}-${index}`} className="rounded-card border border-line bg-bg px-2 py-1 text-xs text-muted">
          <span className="text-fg">{names.get(click.ability) ?? "Ability"}</span>
          {click.rank === 0 ? " unlock" : ` ${click.rank}`}
        </li>
      ))}
    </ol>
  );
}
