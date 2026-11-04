// Where the access token lives on this device. Three choices:
// - device: plain copy in localStorage, the most convenient;
// - passphrase: AES-GCM sealed with a PBKDF2 key derived from a passphrase;
// - tab: sessionStorage only, forgotten when the tab closes.

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type TokenMode = "device" | "passphrase" | "tab";
export const TOKEN_MODES: readonly TokenMode[] = ["device", "passphrase", "tab"];

export interface SealedToken {
  salt: string;
  iv: string;
  data: string;
  iterations: number;
}

export interface RepoSettings {
  owner: string;
  repo: string;
  branch: string;
  dir: string;
}

export interface StoredAuth extends RepoSettings {
  mode: TokenMode;
  token: string | null;
  sealed: SealedToken | null;
}

export interface AuthStores {
  local: StorageLike;
  session: StorageLike;
}

export const AUTH_KEY = "private-page:auth";
const DEFAULT_ITERATIONS = 600_000;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const deriveKey = async (passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number) => {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt"
  ]);
};

export const sealToken = async (token: string, passphrase: string, iterations = DEFAULT_ITERATIONS): Promise<SealedToken> => {
  if (!passphrase) throw new Error("口令加密保存需要设置口令");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, iterations);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token)));
  return { salt: toBase64(salt), iv: toBase64(iv), data: toBase64(data), iterations };
};

export const openToken = async (sealed: SealedToken, passphrase: string) => {
  try {
    const key = await deriveKey(passphrase, fromBase64(sealed.salt), sealed.iterations);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(sealed.iv) }, key, fromBase64(sealed.data));
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error("口令不正确");
  }
};

const parseStored = (text: string | null): StoredAuth | null => {
  if (!text) return null;
  try {
    const value = JSON.parse(text) as Partial<StoredAuth> & { sealed?: Partial<SealedToken> | null };
    const mode = TOKEN_MODES.find((item) => item === value.mode);
    if (!mode || typeof value.owner !== "string" || typeof value.repo !== "string") return null;
    const sealedSource = value.sealed;
    const sealed =
      sealedSource && typeof sealedSource.data === "string" && typeof sealedSource.salt === "string" && typeof sealedSource.iv === "string"
        ? { salt: sealedSource.salt, iv: sealedSource.iv, data: sealedSource.data, iterations: Number(sealedSource.iterations) || DEFAULT_ITERATIONS }
        : null;
    const token = typeof value.token === "string" && value.token ? value.token : null;
    if (!token && !sealed) return null;
    return {
      owner: value.owner,
      repo: value.repo,
      branch: typeof value.branch === "string" && value.branch ? value.branch : "main",
      dir: typeof value.dir === "string" ? value.dir : "data",
      mode,
      token,
      sealed
    };
  } catch {
    return null;
  }
};

export const saveAuth = async (
  stores: AuthStores,
  settings: RepoSettings & { mode: TokenMode; token: string; passphrase?: string; iterations?: number }
) => {
  const base = { owner: settings.owner, repo: settings.repo, branch: settings.branch, dir: settings.dir, mode: settings.mode };
  if (settings.mode === "passphrase") {
    if (!settings.passphrase) throw new Error("口令加密保存需要设置口令");
    const sealed = await sealToken(settings.token, settings.passphrase, settings.iterations);
    stores.local.setItem(AUTH_KEY, JSON.stringify({ ...base, token: null, sealed }));
    stores.session.removeItem(AUTH_KEY);
    return;
  }
  const record = JSON.stringify({ ...base, token: settings.token, sealed: null });
  if (settings.mode === "device") {
    stores.local.setItem(AUTH_KEY, record);
    stores.session.removeItem(AUTH_KEY);
  } else {
    stores.session.setItem(AUTH_KEY, record);
    stores.local.removeItem(AUTH_KEY);
  }
};

export const loadAuth = (stores: AuthStores) => parseStored(stores.session.getItem(AUTH_KEY)) || parseStored(stores.local.getItem(AUTH_KEY));

export const clearAuth = (stores: AuthStores) => {
  stores.local.removeItem(AUTH_KEY);
  stores.session.removeItem(AUTH_KEY);
};
