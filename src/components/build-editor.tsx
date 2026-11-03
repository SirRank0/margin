import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from "react";
import { Copy, Search } from "lucide-react";
import { abilityOrders } from "@/data/ability-orders";
import { abilityCards } from "@/data/ability-cards";
import { shopItems, type ShopItem, type ShopSlot } from "@/data/shop-items";
import { HeroPortrait } from "@/components/hero-portrait";
import { ItemTip, money } from "@/components/item-tip";
import { buildPath } from "@/lib/ability-path";
import {
  decodeBase64,
  encodeBase64,
  encodeHeroBuild,
  extractCode,
  readHeroBuild,
  readPublicBuild,
  type DecodedBuild,
  type PublicHeroBuild,
  type SkillClick,
} from "@/lib/deadlock/build-codec";
import { HEROES } from "@/lib/deadlock/heroes";
import { compressBuild, decompressBuild } from "@/lib/deadlock/zstd";
import { compareHeroNames, heroSearchRank } from "@/lib/hero-order";

const STORAGE_KEY = "build-editor-draft";

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

type Mod = {
  id: number;
  annotation: string;
  flexSlots: number;
  sellPriority: number;
  imbueTarget: number;
};

type Category = {
  key: number;
  name: string;
  description: string;
  optional: boolean;
  width: number;
  height: number;
  mods: Mod[];
};

type Draft = {
  heroId: number;
  name: string;
  description: string;
  categories: Category[];
  clicks: SkillClick[];
  tags: number[];
};

type Tip = { id: number; pinned: boolean; anchor: HTMLElement };
type Pick = { key: number; index: number };

const byId = new Map(shopItems.map((item) => [item.id, item]));

let nextKey = 1;

function blankCategory(name: string): Category {
  nextKey += 1;
  return { key: nextKey, name, description: "", optional: false, width: 1100, height: 88, mods: [] };
}

function emptyMod(id: number): Mod {
  return { id, annotation: "", flexSlots: 0, sellPriority: 0, imbueTarget: 0 };
}

function boxHeight(count: number, width: number) {
  const perRow = Math.max(1, Math.floor((width || 1100) / 92));
  const rows = Math.max(1, Math.ceil(Math.max(count, 1) / perRow));
  return Math.max(72, 28 + rows * 86);
}

function cleanMod(value: unknown): Mod | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Mod>;
  if (typeof source.id !== "number" || source.id <= 0) return null;
  return {
    id: source.id,
    annotation: typeof source.annotation === "string" ? source.annotation : "",
    flexSlots: typeof source.flexSlots === "number" ? source.flexSlots : 0,
    sellPriority: typeof source.sellPriority === "number" ? source.sellPriority : 0,
    imbueTarget: typeof source.imbueTarget === "number" ? source.imbueTarget : 0,
  };
}

function cleanCategories(value: unknown): Category[] {
  if (!Array.isArray(value)) return [];
  const categories: Category[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const source = entry as Partial<Category> & { itemIds?: number[] };
    const mods = Array.isArray(source.mods)
      ? source.mods.map(cleanMod).filter((mod): mod is Mod => mod !== null)
      : Array.isArray(source.itemIds)
        ? source.itemIds.filter((id): id is number => typeof id === "number" && id > 0).map(emptyMod)
        : [];
    nextKey += 1;
    categories.push({
      key: nextKey,
      name: typeof source.name === "string" && source.name.trim() ? source.name : "Category",
      description: typeof source.description === "string" ? source.description : "",
      optional: Boolean(source.optional),
      width: typeof source.width === "number" && source.width > 0 ? source.width : 1100,
      height: typeof source.height === "number" && source.height > 0 ? source.height : boxHeight(mods.length, 1100),
      mods,
    });
  }
  return categories;
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
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>(() => [
    blankCategory("Weapon"),
    blankCategory("Vitality"),
    blankCategory("Spirit"),
  ]);
  const [clicks, setClicks] = useState<SkillClick[]>([]);
  const [tags, setTags] = useState<number[]>([]);
  const [tagNames, setTagNames] = useState<Map<number, string>>(new Map());
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("builds");
  const [selected, setSelected] = useState<Pick | null>(null);
  const [source, setSource] = useState("");
  const [loaded, setLoaded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState("");
  const [packing, setPacking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const fine = useFinePointer();
  const hideTimer = useRef(0);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw) as Partial<Draft> & {
          lists?: Partial<Record<ShopSlot, number[]>>;
        };
        if (typeof draft.heroId === "number") setHeroId(draft.heroId);
        if (typeof draft.name === "string") setName(draft.name);
        if (typeof draft.description === "string") setDescription(draft.description);
        if (Array.isArray(draft.clicks)) setClicks(draft.clicks);
        if (Array.isArray(draft.tags)) setTags(draft.tags.filter((tag) => typeof tag === "number" && tag > 0));
        const restored = cleanCategories(draft.categories);
        if (restored.length > 0) {
          setCategories(restored);
          setActiveKey(restored[0]?.key ?? null);
        } else if (draft.lists) {
          const migrated = (["weapon", "vitality", "spirit"] as const).map((slot) => {
            const category = blankCategory(slot[0]?.toUpperCase() + slot.slice(1));
            const ids = draft.lists?.[slot];
            category.mods = Array.isArray(ids)
              ? ids.filter((id): id is number => typeof id === "number").map(emptyMod)
              : [];
            return category;
          });
          setCategories(migrated);
          setActiveKey(migrated[0]?.key ?? null);
        }
      } catch {
        // A bad draft just starts empty.
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const draft: Draft = { heroId, name, description, categories, clicks, tags };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [heroId, name, description, categories, clicks, tags, ready]);

  useEffect(() => {
    let cancel = false;
    fetch("https://api.deadlock-api.com/v1/assets/build-tags")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Array<{ id?: number; label?: string }>) => {
        if (cancel) return;
        setTagNames(new Map(rows.flatMap((row) => (typeof row.id === "number" && row.label ? [[row.id, row.label] as const] : []))));
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

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

  const heroOptions = useMemo(() => {
    if (heroes.some((hero) => hero.id === heroId)) return heroes;
    return [...heroes, { id: heroId, name: `Hero ${heroId}`, released: true }];
  }, [heroes, heroId]);
  const hero = heroOptions.find((item) => item.id === heroId) ?? heroOptions[0];
  const orderHero = abilityOrders.heroes.find((item) => item.id === hero?.id);
  const recommended = useMemo(() => (orderHero ? buildPath(orderHero).clicks : []), [orderHero]);
  const shownClicks = clicks.length > 0 ? clicks : recommended;
  const abilityById = useMemo(() => {
    const map = new Map<number, { name: string; icon?: string }>();
    for (const entry of abilityOrders.heroes) {
      for (const ability of entry.abilities) {
        map.set(ability.id, { name: ability.name, icon: abilityCards[ability.name]?.icon });
      }
    }
    return map;
  }, []);
  const active = categories.find((category) => category.key === activeKey) ?? categories[0];
  const taken = useMemo(() => new Set(categories.flatMap((category) => category.mods.map((mod) => mod.id))), [categories]);
  const listed = categories.reduce(
    (sum, category) => sum + category.mods.reduce((inner, mod) => inner + (byId.get(mod.id)?.cost ?? 0), 0),
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

  function applyDecoded(build: DecodedBuild, note: string) {
    const next = build.columns.map((column) => {
      nextKey += 1;
      return {
        key: nextKey,
        name: column.name || "Category",
        description: column.description,
        optional: column.optional,
        width: column.width > 0 ? column.width : 1100,
        height: column.height > 0 ? column.height : boxHeight(column.mods.length, column.width || 1100),
        mods: column.mods.map((mod) => ({ ...mod })),
      };
    });
    const cats = next.length > 0 ? next : [blankCategory("Weapon"), blankCategory("Vitality"), blankCategory("Spirit")];
    setHeroId(build.heroId);
    setName(build.name || "Imported build");
    setDescription(build.description);
    setTags(build.tags);
    setCategories(cats);
    setActiveKey(cats[0]?.key ?? null);
    setClicks(build.clicks);
    setSelected(null);
    setView("builds");
    setLoaded(note);
    setOutput("");
    setCopied(false);
    setError(heroes.some((item) => item.id === build.heroId) ? null : `Hero ${build.heroId} isn't in the hero list. The items are still shown.`);
  }

  function addItem(item: ShopItem) {
    const key = active?.key;
    if (key === undefined) return;
    setCategories((current) =>
      current.map((category) => {
        if (category.key !== key) return category;
        if (category.mods.some((mod) => mod.id === item.id)) return category;
        const mods = [...category.mods, emptyMod(item.id)];
        return { ...category, mods, height: boxHeight(mods.length, category.width) };
      }),
    );
    setSelected(null);
    forgetCode();
  }

  function removeAt(key: number, index: number) {
    setCategories((current) =>
      current.map((category) => {
        if (category.key !== key) return category;
        const mods = category.mods.filter((_, modIndex) => modIndex !== index);
        return { ...category, mods, height: boxHeight(mods.length, category.width) };
      }),
    );
    setSelected((current) => (current?.key === key && current.index === index ? null : current));
    forgetCode();
  }

  function toggleItem(item: ShopItem) {
    const key = active?.key;
    const index = key === undefined ? -1 : (categories.find((category) => category.key === key)?.mods.findIndex((mod) => mod.id === item.id) ?? -1);
    if (key !== undefined && index >= 0) removeAt(key, index);
    else addItem(item);
  }

  function moveMod(fromKey: number, fromIndex: number, toKey: number, toIndex: number) {
    setCategories((current) => {
      const source = current.find((category) => category.key === fromKey);
      const mod = source?.mods[fromIndex];
      if (!mod) return current;
      return current.map((category) => {
        if (category.key === fromKey && category.key === toKey) {
          const mods = category.mods.slice();
          const [moved] = mods.splice(fromIndex, 1);
          if (!moved) return category;
          const target = toIndex > fromIndex ? toIndex - 1 : toIndex;
          mods.splice(Math.max(0, Math.min(target, mods.length)), 0, moved);
          return { ...category, mods };
        }
        if (category.key === fromKey) {
          return { ...category, mods: category.mods.filter((_, index) => index !== fromIndex) };
        }
        if (category.key === toKey) {
          const mods = category.mods.slice();
          mods.splice(Math.max(0, Math.min(toIndex, mods.length)), 0, mod);
          return { ...category, mods, height: boxHeight(mods.length, category.width) };
        }
        return category;
      });
    });
    setSelected(null);
    forgetCode();
  }

  function shiftSelected(direction: -1 | 1) {
    if (!selected) return;
    moveMod(selected.key, selected.index, selected.key, selected.index + direction);
  }

  function patchCategory(key: number, recipe: (category: Category) => Category) {
    setCategories((current) => current.map((category) => (category.key === key ? recipe(category) : category)));
    forgetCode();
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

  async function loadSource() {
    const raw = source.trim();
    if (!raw) return;
    setLoading(true);
    setError(null);
    try {
      if (/^\d+$/.test(raw)) {
        const res = await fetch(
          `https://api.deadlock-api.com/v1/builds?build_id=${raw}&only_latest=true&limit=5`,
        );
        if (!res.ok) throw new Error("Couldn't load that public build.");
        const rows = (await res.json()) as Array<{
          hero_build?: PublicHeroBuild & { version?: number };
          num_favorites?: number | null;
        }>;
        const row = [...rows].sort((a, b) => (b.hero_build?.version ?? 0) - (a.hero_build?.version ?? 0))[0];
        if (!row?.hero_build) throw new Error("No public build uses that id.");
        const build = readPublicBuild(row.hero_build);
        const fav = row.num_favorites ? ` · ${row.num_favorites.toLocaleString()} favorites` : "";
        applyDecoded(build, `Public build ${raw}${fav}`);
      } else {
        const bytes = await decompressBuild(decodeBase64(extractCode(raw)));
        const build = readHeroBuild(bytes);
        applyDecoded(build, build.name ? `Imported “${build.name}”` : "Imported build");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't read that build.");
    } finally {
      setLoading(false);
    }
  }

  async function copyBuild() {
    if (!hero) return;
    setPacking(true);
    setError(null);
    try {
      const encoded = encodeHeroBuild({
        heroId: hero.id,
        name,
        description,
        tags,
        columns: categories.map((category) => ({
          name: category.name,
          description: category.description,
          optional: category.optional,
          width: category.width,
          height: category.height,
          mods: category.mods.map((mod) => ({
            id: mod.id,
            annotation: mod.annotation,
            flexSlots: mod.flexSlots,
            sellPriority: mod.sellPriority,
            imbueTarget: mod.imbueTarget,
          })),
        })),
        clicks: clicks.length > 0 ? clicks : recommended,
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
          Paste a game build code, or a public build id, and the shop opens on that build. Categories, item
          notes, and the ability order come from the build. Weapon, Vitality, and Spirit add into the
          highlighted category.
        </p>
      </div>

      <div className="shop-frame flex flex-col gap-3 rounded-card p-3 sm:p-4">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void loadSource();
          }}
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-fg">
            Build code or public id
            <textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              rows={2}
              spellCheck={false}
              placeholder="KLUv/… or 1084"
              className="min-h-11 w-full rounded-card border border-line bg-bg px-3 py-2 font-mono text-xs text-fg"
            />
          </label>
          <button
            type="submit"
            disabled={loading || source.trim().length === 0}
            className="min-h-11 self-end rounded-card bg-fg px-4 text-sm font-semibold text-ink disabled:opacity-40"
          >
            {loading ? "Loading…" : "Load"}
          </button>
        </form>
        {loaded ? <p className="text-sm text-fg">{loaded}</p> : null}

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
                  setClicks([]);
                  forgetCode();
                }}
                className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
              >
                {heroOptions.map((item) => (
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

        <label className="flex flex-col gap-1 text-sm text-fg" htmlFor="builder-description">
          Description
          <input
            id="builder-description"
            value={description}
            maxLength={280}
            onChange={(event) => {
              setDescription(event.target.value);
              forgetCode();
            }}
            className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
          />
        </label>
        {tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1" aria-label="Build tags">
            {tags.map((tag) => (
              <li key={tag} className="rounded-card bg-shop-deep px-2 py-1 text-xs font-semibold text-fg">
                {tagNames.get(tag) ?? `Tag ${tag}`}
              </li>
            ))}
          </ul>
        ) : null}

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
        {view !== "builds" && active ? (
          <p className="text-xs text-fg">
            Adding to <span className="font-semibold">{active.name}</span>. Switch that on the Builds tab.
          </p>
        ) : null}

        <div role="tabpanel" aria-labelledby={`builder-tab-${view}`}>
          {view === "builds" ? (
            <div className="flex flex-col gap-3">
              {categories.map((category, categoryIndex) => (
                <CategoryBox
                  key={category.key}
                  category={category}
                  active={active?.key === category.key}
                  query={query}
                  selected={selected?.key === category.key ? selected.index : null}
                  fine={fine}
                  first={categoryIndex === 0}
                  last={categoryIndex === categories.length - 1}
                  abilityName={(id) => abilityById.get(id)?.name}
                  onActivate={() => setActiveKey(category.key)}
                  onRename={(value) => patchCategory(category.key, (current) => ({ ...current, name: value }))}
                  onDescribe={(value) => patchCategory(category.key, (current) => ({ ...current, description: value }))}
                  onOptional={(value) => patchCategory(category.key, (current) => ({ ...current, optional: value }))}
                  onMoveCategory={(direction) => {
                    setCategories((current) => {
                      const index = current.findIndex((entry) => entry.key === category.key);
                      const swap = index + direction;
                      if (index < 0 || swap < 0 || swap >= current.length) return current;
                      const next = current.slice();
                      const [moved] = next.splice(index, 1);
                      if (!moved) return current;
                      next.splice(swap, 0, moved);
                      return next;
                    });
                    forgetCode();
                  }}
                  onRemoveCategory={() => {
                    setCategories((current) => current.filter((entry) => entry.key !== category.key));
                    setSelected(null);
                    forgetCode();
                  }}
                  onShow={showTip}
                  onHide={scheduleHide}
                  onSelect={(index, anchor, id) => {
                    setSelected({ key: category.key, index });
                    setActiveKey(category.key);
                    if (!fine) showTip(id, anchor, true);
                  }}
                  onAnnotate={(index, annotation) =>
                    patchCategory(category.key, (current) => ({
                      ...current,
                      mods: current.mods.map((mod, modIndex) => (modIndex === index ? { ...mod, annotation } : mod)),
                    }))
                  }
                  onMove={moveMod}
                  onShift={shiftSelected}
                  onRemove={(index) => removeAt(category.key, index)}
                />
              ))}
              <button
                type="button"
                className="min-h-11 self-start rounded-card bg-fg px-3 text-sm font-semibold text-ink"
                onClick={() => {
                  const category = blankCategory(`Category ${categories.length + 1}`);
                  setCategories((current) => [...current, category]);
                  setActiveKey(category.key);
                  forgetCode();
                }}
              >
                Add category
              </button>
              <AbilityStrip
                clicks={shownClicks}
                imported={clicks.length > 0}
                abilityById={abilityById}
              />
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
                            place="shop"
                            owned={taken.has(item.id)}
                            selected={false}
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
          actionLabel={
            tip.pinned
              ? active?.mods.some((mod) => mod.id === tipItem.id)
                ? "Remove"
                : "Add"
              : undefined
          }
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
  category,
  active,
  query,
  selected,
  fine,
  first,
  last,
  abilityName,
  onActivate,
  onRename,
  onDescribe,
  onOptional,
  onMoveCategory,
  onRemoveCategory,
  onShow,
  onHide,
  onSelect,
  onAnnotate,
  onMove,
  onShift,
  onRemove,
}: {
  category: Category;
  active: boolean;
  query: string;
  selected: number | null;
  fine: boolean;
  first: boolean;
  last: boolean;
  abilityName: (id: number) => string | undefined;
  onActivate: () => void;
  onRename: (value: string) => void;
  onDescribe: (value: string) => void;
  onOptional: (value: boolean) => void;
  onMoveCategory: (direction: -1 | 1) => void;
  onRemoveCategory: () => void;
  onShow: (id: number, anchor: HTMLElement, pinned: boolean) => void;
  onHide: () => void;
  onSelect: (index: number, anchor: HTMLElement, id: number) => void;
  onAnnotate: (index: number, annotation: string) => void;
  onMove: (fromKey: number, fromIndex: number, toKey: number, toIndex: number) => void;
  onShift: (direction: -1 | 1) => void;
  onRemove: (index: number) => void;
}) {
  const visible = category.mods
    .map((mod, index) => ({ mod, index }))
    .filter(({ mod }) => {
      const item = byId.get(mod.id);
      return item ? heroSearchRank(item.name, query, item.id) !== null : heroSearchRank(String(mod.id), query, mod.id) !== null;
    });
  const selectedMod = selected !== null ? category.mods[selected] : undefined;

  function readDrag(event: DragEvent) {
    const [keyRaw, indexRaw] = event.dataTransfer.getData("text/plain").split(":");
    const key = Number(keyRaw);
    const index = Number(indexRaw);
    if (!Number.isInteger(key) || !Number.isInteger(index)) return null;
    return { key, index };
  }

  return (
    <div
      className="build-cat shop-box flex flex-col gap-2 rounded-card p-2"
      data-active={active ? "true" : "false"}
      data-optional={category.optional ? "true" : "false"}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const from = readDrag(event);
        if (!from) return;
        onMove(from.key, from.index, category.key, category.mods.length);
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={category.name}
          aria-label="Category name"
          onFocus={onActivate}
          onChange={(event) => onRename(event.target.value)}
          className="min-h-11 min-w-32 flex-1 bg-transparent text-sm font-semibold text-fg outline-none"
        />
        {category.optional && !active ? <span className="text-xs font-semibold text-fg">Optional</span> : null}
        {active ? (
          <label className="flex min-h-11 items-center gap-2 text-xs text-fg">
            <input
              type="checkbox"
              checked={category.optional}
              onChange={(event) => onOptional(event.target.checked)}
            />
            Optional
          </label>
        ) : null}
        {active ? (
          <>
            <button type="button" className="min-h-11 rounded-card bg-fg px-2 text-sm text-ink disabled:opacity-40" disabled={first} onClick={() => onMoveCategory(-1)}>
              Up
            </button>
            <button type="button" className="min-h-11 rounded-card bg-fg px-2 text-sm text-ink disabled:opacity-40" disabled={last} onClick={() => onMoveCategory(1)}>
              Down
            </button>
            <button type="button" className="min-h-11 rounded-card bg-fg px-2 text-sm text-ink" onClick={onRemoveCategory}>
              Remove
            </button>
          </>
        ) : null}
      </div>
      <input
        value={category.description}
        aria-label={`${category.name} note`}
        placeholder="Category note"
        onFocus={onActivate}
        onChange={(event) => onDescribe(event.target.value)}
        className="min-h-11 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
      />
      {visible.length === 0 ? (
        <button type="button" onClick={onActivate} className="min-h-11 rounded-card px-2 text-left text-sm text-fg">
          {category.mods.length === 0 ? "Add items from Weapon, Vitality, or Spirit." : "No items match."}
        </button>
      ) : (
        <ul className="item-grid">
          {visible.map(({ mod, index }) => {
            const item = byId.get(mod.id);
            return (
              <li key={`${category.key}-${index}`}>
                <ItemTile
                  item={item}
                  fallbackId={mod.id}
                  place="build"
                  note={mod.annotation}
                  extra={modDetail(mod, abilityName)}
                  owned={false}
                  selected={selected === index}
                  draggable={fine}
                  onClick={(event) => onSelect(index, event.currentTarget, mod.id)}
                  onShow={(anchor) => {
                    if (fine && item) onShow(mod.id, anchor, false);
                  }}
                  onHide={onHide}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", `${category.key}:${index}`);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const from = readDrag(event);
                    if (!from) return;
                    onMove(from.key, from.index, category.key, index);
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
      {selectedMod ? (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-xs text-fg">
            Item note
            <textarea
              value={selectedMod.annotation}
              rows={2}
              onChange={(event) => onAnnotate(selected as number, event.target.value)}
              className="min-h-11 rounded-card border border-line bg-bg px-3 py-2 text-sm text-fg"
            />
          </label>
          <div className="flex flex-wrap gap-1">
            {category.mods.length > 1 ? (
              <>
                <button type="button" className="min-h-11 rounded-card bg-fg px-3 text-sm text-ink disabled:opacity-40" disabled={selected === 0} onClick={() => onShift(-1)}>
                  Earlier
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-card bg-fg px-3 text-sm text-ink disabled:opacity-40"
                  disabled={selected === category.mods.length - 1}
                  onClick={() => onShift(1)}
                >
                  Later
                </button>
              </>
            ) : null}
            <button type="button" className="min-h-11 rounded-card bg-fg px-3 text-sm text-ink" onClick={() => onRemove(selected as number)}>
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function modDetail(mod: Mod, abilityName: (id: number) => string | undefined) {
  const bits: string[] = [];
  if (mod.imbueTarget > 0) bits.push(`Imbue ${abilityName(mod.imbueTarget) ?? mod.imbueTarget}`);
  if (mod.flexSlots > 0) bits.push(`${mod.flexSlots} open slot${mod.flexSlots === 1 ? "" : "s"}`);
  if (mod.sellPriority > 0) bits.push(`Sell ${mod.sellPriority}`);
  return bits.join(" · ");
}

function ItemTile({
  item,
  fallbackId,
  place,
  note,
  extra,
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
  item?: ShopItem;
  fallbackId?: number;
  place: "shop" | "build";
  note?: string;
  extra?: string;
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
  const slot = item?.slot ?? "weapon";
  const label = item ? item.name : `Item ${fallbackId ?? ""}`;
  return (
    <button
      type="button"
      draggable={draggable}
      data-owned={owned ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
      data-place={place}
      data-slot={slot}
      className="item-tile"
      aria-label={`${label}${item ? `, ${money(item.cost)}` : ""}${owned ? ", already in the build" : ""}${note ? `, ${note}` : ""}`}
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
        {item ? <ItemArt item={item} /> : <span className="text-xs font-semibold">{fallbackId}</span>}
        {item?.active ? <span className="item-active">ACTIVE</span> : null}
      </span>
      <span className="item-tile-name">{label}</span>
      {note ? <span className="item-note">{note}</span> : null}
      {extra ? <span className="item-note">{extra}</span> : null}
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

function AbilityStrip({
  clicks,
  imported,
  abilityById,
}: {
  clicks: SkillClick[];
  imported: boolean;
  abilityById: Map<number, { name: string; icon?: string }>;
}) {
  if (clicks.length === 0) return null;
  return (
    <div className="shop-well rounded-card p-3">
      <p className="text-xs text-fg">
        {imported ? "Ability order from this build." : "No ability order in this build, so the copied code uses the recommended one."}
      </p>
      <ol className="mt-2 flex flex-wrap gap-2">
        {clicks.map((click, index) => {
          const ability = abilityById.get(click.ability);
          const src = ability?.icon ? `${import.meta.env.BASE_URL}abilities/${ability.icon}` : null;
          const rank = click.rank === 0 ? "Unlock" : String(click.rank);
          return (
            <li key={`${click.ability}-${index}`} className="flex w-16 flex-col items-center gap-1 text-center">
              <span className="relative">
                {src ? (
                  <img src={src} alt="" width={40} height={40} className="size-10 rounded-full bg-bg object-cover" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-full bg-bg text-xs text-fg">{ability?.name.slice(0, 1) ?? "?"}</span>
                )}
                <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-ink text-[0.65rem] font-semibold text-fg">
                  {click.rank === 0 ? "·" : click.rank}
                </span>
              </span>
              <span className="text-[0.65rem] leading-tight text-fg">{ability?.name ?? "Ability"}</span>
              <span className="sr-only">{rank}</span>
              {click.annotation ? <span className="text-[0.65rem] leading-tight text-muted">{click.annotation}</span> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
