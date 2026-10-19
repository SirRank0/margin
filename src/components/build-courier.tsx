import { useMemo, useState } from "react";
import { decompress as fzstd } from "fzstd";
import { abilityOrders } from "@/data/ability-orders";
import { decodeCode, encodeCode, readBuild, retarget } from "@/lib/build-courier";

type Simple = {
  compress(data: Uint8Array): Uint8Array | null;
};

let packer: Promise<Simple> | null = null;

function pack(): Promise<Simple> {
  packer ??= import("zstd-codec").then(
    (mod) =>
      new Promise((resolve, reject) => {
        const run = mod.ZstdCodec?.run ?? mod.default?.ZstdCodec?.run;
        if (!run) {
          reject(new Error("The build packer did not load."));
          return;
        }
        run((zstd: { Simple: new () => Simple }) => resolve(new zstd.Simple()));
      }),
  );
  return packer;
}

const heroes = [...abilityOrders.heroes].sort((a, b) => a.name.localeCompare(b.name));

function inflate(data: Uint8Array): Uint8Array {
  return fzstd(data);
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const simple = await pack();
  const packed = simple.compress(data);
  if (!packed) throw new Error("The new code could not be packed.");
  return packed;
}

export function BuildCourier() {
  const [code, setCode] = useState("");
  const [heroId, setHeroId] = useState(heroes.find((hero) => hero.name === "Haze")?.id ?? heroes[0]?.id ?? 0);
  const [name, setName] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [from, setFrom] = useState<string | null>(null);

  const names = useMemo(() => new Map(heroes.map((hero) => [hero.id, hero.name])), []);

  async function read() {
    setError(null);
    setFrom(null);
    if (!code.trim()) return;
    try {
      const raw = inflate(decodeCode(code));
      const read = readBuild(raw);
      setFrom(read.heroId != null ? names.get(read.heroId) ?? `hero ${read.heroId}` : "a build with no hero");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That code could not be read.");
    }
  }

  async function make() {
    setError(null);
    setCopied(false);
    setBusy(true);
    try {
      const raw = inflate(decodeCode(code));
      const read = readBuild(raw);
      setFrom(read.heroId != null ? names.get(read.heroId) ?? `hero ${read.heroId}` : "a build with no hero");
      const packed = await deflate(retarget(raw, heroId, name));
      setOutput(encodeCode(packed));
    } catch (caught) {
      setOutput("");
      setError(caught instanceof Error ? caught.message : "That code could not be read.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl text-fg">Build Courier</h2>
        <p className="mt-1 text-pretty text-sm text-muted">
          Paste a build code. Pick who it should belong to. The new code pastes onto that hero, not
          whoever it was copied from. This does not change the odds or the ability order above.
        </p>
      </div>
      <label className="mt-4 flex flex-col gap-1 text-sm text-muted">
        Build code
        <textarea
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setOutput("");
            setError(null);
            setFrom(null);
          }}
          onBlur={read}
          rows={4}
          placeholder="Nothing pasted yet."
          className="min-h-28 rounded-card border border-line bg-bg px-3 py-2 font-mono text-xs text-fg"
        />
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Build name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Leave blank to keep the copied name"
            className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Hero
          <select
            value={heroId}
            onChange={(event) => setHeroId(Number(event.target.value))}
            className="min-h-11 rounded-card border border-line bg-bg px-3 text-sm text-fg"
          >
            {heroes.map((hero) => (
              <option key={hero.id} value={hero.id}>
                {hero.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={make}
          disabled={busy || !code.trim()}
          className="min-h-11 rounded-card border border-line bg-fg px-4 text-sm text-bg disabled:opacity-50"
        >
          {busy ? "Reading…" : "New code"}
        </button>
        <button
          type="button"
          onClick={copy}
          disabled={!output}
          className="min-h-11 rounded-card border border-line bg-raised px-4 text-sm text-fg disabled:opacity-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <span className="text-sm text-muted">
          {from ? `Copied from ${from}. ` : ""}
          {code.trim() ? `For ${names.get(heroId) ?? "that hero"}.` : "Nothing pasted yet."}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">
        Pick a hero. Paste the result on their build page, on the canvas, not the title.
      </p>
      {error ? <p className="mt-2 text-sm text-fg">{error}</p> : null}
      {output ? (
        <textarea
          readOnly
          value={output}
          rows={4}
          className="mt-3 w-full rounded-card border border-line bg-bg px-3 py-2 font-mono text-xs text-fg"
        />
      ) : null}
    </section>
  );
}
