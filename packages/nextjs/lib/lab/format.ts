// Truncate an address or tx hash to head…tail for display.
export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
