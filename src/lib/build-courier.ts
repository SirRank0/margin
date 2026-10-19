/** Rewrite a Deadlock build clipboard code onto a different hero.

The game copies a zstd-compressed protobuf. Field 2 of the top message is the
hero. Nested field 2s are category names and currency types, so only the top
level is changed. Only the top-level hero is changed. The build id is left alone, because
dropping it makes the game reject the paste.
*/

export type CourierRead = {
  heroId: number | null;
  name: string | null;
};

const text = new TextEncoder();
const textOut = new TextDecoder();

function readVarint(buf: Uint8Array, at: number): [number, number] {
  let value = 0;
  let shift = 0;
  while (at < buf.length) {
    const byte = buf[at];
    at += 1;
    value += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) return [value, at];
    shift += 7;
    if (shift > 28) break;
  }
  throw new Error("The build code is cut off.");
}

function writeVarint(value: number): number[] {
  const out: number[] = [];
  let left = value >>> 0;
  while (left > 0x7f) {
    out.push((left & 0x7f) | 0x80);
    left >>>= 7;
  }
  out.push(left);
  return out;
}

function skip(buf: Uint8Array, at: number, wire: number): number {
  if (wire === 0) return readVarint(buf, at)[1];
  if (wire === 1) return at + 8;
  if (wire === 5) return at + 4;
  if (wire === 2) {
    const [len, next] = readVarint(buf, at);
    return next + len;
  }
  throw new Error("This build code uses a field the courier does not read.");
}

/** Top-level fields only. Nested messages are copied through untouched. */
function rewrite(buf: Uint8Array, heroId: number, name: string | null): Uint8Array {
  const out: number[] = [];
  let at = 0;
  let sawHero = false;
  let sawName = false;
  while (at < buf.length) {
    const start = at;
    const [tag, afterTag] = readVarint(buf, at);
    const field = tag >> 3;
    const wire = tag & 7;
    const end = skip(buf, afterTag, wire);
    if (field === 2 && wire === 0) {
      out.push(...writeVarint(tag), ...writeVarint(heroId));
      sawHero = true;
    } else if (field === 5 && wire === 2 && name) {
      const bytes = text.encode(name);
      out.push(...writeVarint(tag), ...writeVarint(bytes.length), ...bytes);
      sawName = true;
    } else {
      out.push(...buf.subarray(start, end));
    }
    at = end;
  }
  if (!sawHero) out.unshift(...writeVarint((2 << 3) | 0), ...writeVarint(heroId));
  if (name && !sawName) {
    const bytes = text.encode(name);
    out.push(...writeVarint((5 << 3) | 2), ...writeVarint(bytes.length), ...bytes);
  }
  return Uint8Array.from(out);
}

export function readBuild(buf: Uint8Array): CourierRead {
  let at = 0;
  let heroId: number | null = null;
  let name: string | null = null;
  while (at < buf.length) {
    const [tag, afterTag] = readVarint(buf, at);
    const field = tag >> 3;
    const wire = tag & 7;
    if (field === 2 && wire === 0) {
      const [value, next] = readVarint(buf, afterTag);
      heroId = value;
      at = next;
      continue;
    }
    if (field === 5 && wire === 2) {
      const [len, next] = readVarint(buf, afterTag);
      name = textOut.decode(buf.subarray(next, next + len));
      at = next + len;
      continue;
    }
    at = skip(buf, afterTag, wire);
  }
  return { heroId, name };
}

export function retarget(buf: Uint8Array, heroId: number, name: string | null): Uint8Array {
  return rewrite(buf, heroId, name && name.trim() ? name.trim() : null);
}

export function decodeCode(code: string): Uint8Array {
  const cleaned = code.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!cleaned) throw new Error("Paste a build code first.");
  const padded = cleaned + "=".repeat((4 - (cleaned.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function encodeCode(buf: Uint8Array): string {
  let binary = "";
  for (const byte of buf) binary += String.fromCharCode(byte);
  return btoa(binary);
}
