import type { UserAvatar } from "@/lib/userProfile";

export const BP_REMEMBER_KEY = "bp_remember_session";
export const BP_GUEST_MODE_KEY = "bp_guest_mode";
export const BP_REMEMBERED_ACCOUNT_KEY = "bp_remembered_account";

export type RememberedAccount = {
  name: string;
  email: string;
  avatar: UserAvatar;
};

export function readRememberPreference(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(BP_REMEMBER_KEY) !== "0";
}

export function readGuestMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BP_GUEST_MODE_KEY) === "1";
}

export function setGuestMode(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) localStorage.setItem(BP_GUEST_MODE_KEY, "1");
  else localStorage.removeItem(BP_GUEST_MODE_KEY);
}

export function readRememberedAccount(): RememberedAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BP_REMEMBERED_ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedAccount;
    if (!parsed?.email || !parsed?.avatar) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeRememberedAccount(account: RememberedAccount) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BP_REMEMBERED_ACCOUNT_KEY, JSON.stringify(account));
}

export function clearRememberedAccount() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BP_REMEMBERED_ACCOUNT_KEY);
  localStorage.removeItem(BP_GUEST_MODE_KEY);
}
