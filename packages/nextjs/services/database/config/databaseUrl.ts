// One place to answer "which database is this URL?", so the driver pick, the
// drizzle-kit prompt and the seed guard can't drift apart (matching on a "neon"
// substring routed local `neondb` restores through the WebSocket driver).
export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isNeonUrl(url: string): boolean {
  return hostnameOf(url)?.endsWith(".neon.tech") ?? false;
}

export function isLocalUrl(url: string): boolean {
  const hostname = hostnameOf(url);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
