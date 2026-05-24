export function safeFilename(prefix: string, suffix: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const safe = `${prefix}-${ts}${suffix}`.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
  return safe;
}
