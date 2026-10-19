import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Copy, Search } from "lucide-react";
import {
  decodeBase64,
  encodeBase64,
  extractCode,
  inspectBuild,
  retargetBuild,
  type BuildInfo,
} from "@/lib/deadlock/build-codec";
import { HEROES, heroLabel, type Hero } from "@/lib/deadlock/heroes";
import { compressBuild, decompressBuild } from "@/lib/deadlock/zstd";

const STORAGE_KEY = "courier-target-hero";

type ReadyBuild = {
  decoded: Uint8Array;
  info: BuildInfo;
  sourceCode: string;
};

type ReadState =
  | { phase: "idle" }
  | { phase: "reading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; build: ReadyBuild };

export function BuildCourier() {
  const [raw, setRaw] = useState("");
  const [read, setRead] = useState<ReadState>({ phase: "idle" });
  const [target, setTarget] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [output, setOutput] = useState("");
  const [packing, setPacking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showComing, setShowComing] = useState(false);
  const [customId, setCustomId] = useState("");

  const ready = read.phase === "ready" ? read.build : null;

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const id = saved ? Number(saved) : NaN;
    if (Number.isInteger(id) && id > 0) setTarget(id);
  }, []);

  useEffect(() => {
    const text = raw.trim();
    if (!text) {
      setRead({ phase: "idle" });
      setName("");
      setOutput("");
      setCopied(false);
      setCopyError(null);
      return;
    }
    let cancelled = false;
    setRead({ phase: "reading" });
    void (async () => {
      try {
        const sourceCode = extractCode(text);
        const decoded = await decompressBuild(decodeBase64(sourceCode));
        const info = inspectBuild(decoded);
        if (cancelled) return;
        setRead({ phase: "ready", build: { decoded, info, sourceCode } });
        setName(info.name);
        setOutput("");
        setCopied(false);
        setCopyError(null);
      } catch (cause) {
        if (cancelled) return;
        setName("");
        setOutput("");
        setRead({
          phase: "error",
          message: cause instanceof Error ? cause.message : "Couldn't read that code.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [raw]);

  const released = useMemo(() => filterHeroes(HEROES.filter((hero) => hero.released), query), [query]);
  const coming = useMemo(() => filterHeroes(HEROES.filter((hero) => !hero.released), query), [query]);

  function forgetPacked() {
    setOutput("");
    setCopied(false);
    setCopyError(null);
  }

  function choose(id: number) {
    setTarget(id);
    setCustomId("");
    forgetPacked();
    window.localStorage.setItem(STORAGE_KEY, String(id));
  }

  async function copyOutput() {
    if (!ready || target == null || packing) return;
    setPacking(true);
    setCopied(false);
    setCopyError(null);
    try {
      const trimmed = name.trim();
      const rename = trimmed !== ready.info.name ? trimmed : undefined;
      const code =
        target === ready.info.heroId && rename === undefined
          ? ready.sourceCode
          : encodeBase64(await compressBuild(retargetBuild(ready.decoded, target, rename)));
      setOutput(code);
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      } catch {
        setCopyError("Clipboard blocked. The code is in the box.");
        requestAnimationFrame(() => {
          const area = document.getElementById("courier-output");
          if (area instanceof HTMLTextAreaElement) {
            area.focus();
            area.select();
          }
        });
      }
    } catch (cause) {
      setOutput("");
      setCopyError(cause instanceof Error ? cause.message : "Couldn't rewrite that build.");
    } finally {
      setPacking(false);
    }
  }

  const targetName = target == null ? null : heroLabel(target);
  const canCopy = ready != null && target != null && !packing;

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl text-fg">Build Courier</h2>
        <p className="mt-1 text-pretty text-sm text-muted">
          Paste a build code. Pick who it should belong to. The new code pastes onto that hero, not
          whoever it was copied from. This does not change the odds or the ability order above.
        </p>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="courier-code">
            Build code
            <textarea
              id="courier-code"
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              rows={5}
              spellCheck={false}
              placeholder="Nothing pasted yet."
              className="min-h-28 rounded-card border border-line bg-bg px-3 py-2 font-mono text-xs text-fg"
            />
          </label>
          <Status read={read} />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">New code</span>
            <button
              type="button"
              onClick={() => void copyOutput()}
              disabled={!canCopy}
              className="inline-flex min-h-11 items-center gap-2 rounded-card bg-fg px-4 text-sm text-bg disabled:opacity-40"
            >
              <Copy className="size-4" aria-hidden="true" />
              {packing ? "Packing…" : copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            id="courier-output"
            readOnly
            value={output}
            placeholder="Packed when you copy."
            spellCheck={false}
            className="min-h-24 w-full rounded-card border border-line bg-bg px-3 py-2 font-mono text-xs text-fg"
          />
          {copyError ? <p className="text-sm text-fg">{copyError}</p> : null}
          <p className="text-sm text-muted">
            {ready && targetName ? (
              <>
                <span className="text-fg">{ready.info.heroName}</span>
                <ArrowRight className="mx-1 inline size-3.5" aria-hidden="true" />
                <span className="text-fg">{targetName}</span>
                <span>. Skill order stays {ready.info.heroName}'s. Set it again after you paste.</span>
              </>
            ) : (
              "Pick a hero. Paste the result on their build page, on the canvas, not the title."
            )}
          </p>
          <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="courier-name">
            Build name
            <input
              id="courier-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                forgetPacked();
              }}
              disabled={!ready}
              className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg disabled:opacity-50"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="courier-search">
            Hero
            <span className="flex items-center gap-2 rounded-card border border-line bg-bg px-3">
              <Search className="size-4 text-muted" aria-hidden="true" />
              <input
                id="courier-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="min-h-11 w-full bg-transparent text-sm text-fg outline-none"
              />
            </span>
          </label>
          <HeroGrid heroes={released} current={ready?.info.heroId ?? null} target={target} onChoose={choose} />
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm text-muted">
              Id
              <input
                value={customId}
                onChange={(event) => setCustomId(event.target.value.replace(/\D/g, "").slice(0, 3))}
                inputMode="numeric"
                placeholder="87"
                className="h-11 w-20 rounded-card border border-line bg-bg px-3 text-sm text-fg"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const id = Number(customId);
                if (Number.isInteger(id) && id >= 1 && id <= 255) choose(id);
              }}
              disabled={!customId}
              className="min-h-11 rounded-card border border-line bg-raised px-3 text-sm text-fg disabled:opacity-40"
            >
              Use id
            </button>
          </div>
          {coming.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowComing((value) => !value)}
              className="self-start text-sm text-muted underline"
            >
              {showComing ? "Hide" : "Heroes not in the game yet"}
            </button>
          ) : null}
          {showComing ? (
            <HeroGrid heroes={coming} current={ready?.info.heroId ?? null} target={target} onChoose={choose} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Status({ read }: { read: ReadState }) {
  if (read.phase === "reading") return <p className="text-sm text-muted">Reading the code…</p>;
  if (read.phase === "error") return <p className="text-sm text-fg">{read.message}</p>;
  if (read.phase !== "ready") return <p className="text-sm text-muted">Nothing pasted yet.</p>;
  const { info } = read.build;
  return (
    <p className="text-sm text-muted">
      This code belongs to <span className="text-fg">{info.heroName}</span>
      <span className="font-mono"> #{info.heroId}</span>
      {info.name ? (
        <>
          {" "}
          · <span className="text-fg">{info.name}</span>
        </>
      ) : null}
    </p>
  );
}

function HeroGrid({
  heroes,
  current,
  target,
  onChoose,
}: {
  heroes: Hero[];
  current: number | null;
  target: number | null;
  onChoose: (id: number) => void;
}) {
  if (heroes.length === 0) return <p className="text-sm text-muted">No heroes match.</p>;
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {heroes.map((hero) => {
        const selected = hero.id === target;
        const from = hero.id === current;
        return (
          <li key={hero.id}>
            <button
              type="button"
              onClick={() => onChoose(hero.id)}
              aria-pressed={selected}
              className={
                "flex h-11 w-full items-center justify-between gap-2 rounded-card border px-3 text-left text-sm " +
                (selected ? "border-fg bg-fg text-bg" : "border-line bg-raised text-fg")
              }
            >
              <span className="truncate">{hero.name}</span>
              {from ? <span className="font-mono text-xs">from</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function filterHeroes(heroes: Hero[], query: string): Hero[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return heroes;
  return heroes.filter(
    (hero) => hero.name.toLowerCase().includes(needle) || String(hero.id).includes(needle),
  );
}
