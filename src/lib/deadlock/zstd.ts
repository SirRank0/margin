type Simple = {
  compress(data: Uint8Array, level?: number): Uint8Array;
  decompress(data: Uint8Array): Uint8Array | null;
};

let simplePromise: Promise<Simple> | null = null;

function loadSimple(): Promise<Simple> {
  if (!simplePromise) {
    simplePromise = import("zstd-codec").then(
      (mod) =>
        new Promise((resolve, reject) => {
          mod.ZstdCodec.run((zstd) => {
            try {
              resolve(new zstd.Simple());
            } catch (error) {
              reject(error instanceof Error ? error : new Error("Couldn't start the compressor."));
            }
          });
        }),
    );
  }
  return simplePromise;
}

export async function decompressBuild(bytes: Uint8Array): Promise<Uint8Array> {
  const simple = await loadSimple();
  const out = simple.decompress(bytes);
  if (!out || out.length === 0) {
    throw new Error("Couldn't unpack that build. Copy it again from the build page.");
  }
  return out;
}

export async function compressBuild(bytes: Uint8Array): Promise<Uint8Array> {
  const simple = await loadSimple();
  return simple.compress(bytes);
}
