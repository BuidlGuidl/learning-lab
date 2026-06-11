// Main-thread wrapper around the solc web-worker. Lazily spawns the worker on
// first compile, then reuses it across requests so the soljson download (~7MB)
// only happens once per page load.

export type CompiledContract = { name: string; abi: unknown[]; bytecode: `0x${string}` };

export type CompileResult =
  | { ok: true; contracts: Record<string, CompiledContract>; warnings: string[] }
  | { ok: false; errors: string[] };

// What the compiler is doing right now, for callers that want to show progress.
export type CompilerPhase = "downloading" | "compiling";

let worker: Worker | null = null;
let ready = false;
let nextId = 0;
// id routes each response back to the right caller. without it, concurrent compiles race on arrival order.
const pending = new Map<string, (r: CompileResult) => void>();
// callers stuck behind the soljson download, flipped to "compiling" when ready lands.
const phaseWatchers = new Map<string, (phase: CompilerPhase) => void>();

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./solc-worker.ts", import.meta.url));
  worker.onmessage = (event: MessageEvent) => {
    const data = event.data as Record<string, unknown>;
    if (data.type === "ready") {
      ready = true;
      // every request queued during the download is about to actually compile
      for (const watch of phaseWatchers.values()) watch("compiling");
      phaseWatchers.clear();
      return;
    }
    const { id, ...rest } = data as { id: string } & Record<string, unknown>;
    const resolver = pending.get(id);
    if (!resolver) return;
    pending.delete(id);
    if (rest.ok === true) {
      resolver({
        ok: true,
        contracts: (rest.contracts as Record<string, CompiledContract>) ?? {},
        warnings: (rest.warnings as string[]) ?? [],
      });
    } else {
      resolver({ ok: false, errors: (rest.errors as string[]) ?? ["unknown error"] });
    }
  };
  return worker;
}

// Spawning the worker starts the soljson download immediately, so call this on
// lab mount and the compiler is usually in memory before the first submit.
export function warmCompiler(): void {
  ensureWorker();
}

export function compileContracts(
  sources: Record<string, string>,
  onPhase?: (phase: CompilerPhase) => void,
): Promise<CompileResult> {
  const w = ensureWorker();
  const id = String(nextId++);
  if (onPhase) {
    onPhase(ready ? "compiling" : "downloading");
    if (!ready) phaseWatchers.set(id, onPhase);
  }
  return new Promise(resolve => {
    pending.set(id, resolve);
    w.postMessage({ id, sources });
  });
}
