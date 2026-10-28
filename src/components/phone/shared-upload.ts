/** Bound uploads and reuse identical references without changing the source records. */
export async function mapSharedMedia(
  value: unknown,
  upload: (source: string) => Promise<string>,
  progress: (done: number, total: number) => void,
): Promise<unknown> {
  const sources = new Set<string>();
  const collect = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === "object") Object.values(v).forEach(collect);
    else if (typeof v === "string" && (v.startsWith("idb:") || v.startsWith("data:image/"))) sources.add(v);
  };
  collect(value);
  const queue = [...sources];
  const results = new Map<string, string>();
  let index = 0;
  let done = 0;
  progress(done, queue.length);
  const worker = async () => {
    while (index < queue.length) {
      const source = queue[index++];
      if (source === undefined) return;
      results.set(source, await upload(source));
      progress(++done, queue.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, queue.length) }, worker));
  const replace = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(replace);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, child]) => [k, replace(child)]));
    return typeof v === "string" ? results.get(v) ?? v : v;
  };
  return replace(value);
}

export async function boundedSharingStep<T>(step: PromiseLike<T>, milliseconds = 60000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([Promise.resolve(step), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Upload timed out; original content is safe. / 上传等待超时，原内容仍保留，将重试")), milliseconds);
    })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}