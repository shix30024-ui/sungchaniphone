/** Owner-only recovery for KKT/IG data. Never deletes; always snapshots current data before restoring. */
const BACKUP_KEY = "phone-backup-before-completion-v1";
const SCOPE = /^(kkt-|ig-)/;

export type RecoveryRow = { key: string; current: number; backup: number; differs: boolean };

const count = (raw: string | null | undefined) => {
  if (!raw) return 0;
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v.length : 1; } catch { return 0; }
};

export function readBackup(): Record<string, string> | null {
  try { const raw = localStorage.getItem(BACKUP_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function inspectRecovery(): RecoveryRow[] {
  const backup = readBackup() || {};
  const keys = new Set<string>(Object.keys(backup).filter((k) => SCOPE.test(k)));
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && SCOPE.test(k)) keys.add(k); }
  return [...keys].sort().map((key) => {
    const cur = localStorage.getItem(key);
    return { key, current: count(cur), backup: count(backup[key]), differs: key in backup && backup[key] !== cur };
  });
}

/** Copy current KKT/IG data aside, then put the backup values back. Returns the safety-copy key. */
export function restoreFromBackup(): string | null {
  const backup = readBackup();
  if (!backup) return null;
  const safety: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && SCOPE.test(k)) { const v = localStorage.getItem(k); if (v !== null) safety[k] = v; }
  }
  const safetyKey = `phone-backup-before-restore-${Date.now()}`;
  localStorage.setItem(safetyKey, JSON.stringify(safety));
  for (const [k, v] of Object.entries(backup)) if (SCOPE.test(k)) localStorage.setItem(k, v);
  return safetyKey;
}

export function exportPhoneData() {
  const all: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) { const v = localStorage.getItem(k); if (v !== null) all[k] = v; } }
  const url = URL.createObjectURL(new Blob([JSON.stringify(all)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = `phone-data-${Date.now()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
