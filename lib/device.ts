"use client";
// A local id for tries made before sign-up; attached to the account at sign-up.
export function deviceId(): string {
  try {
    let id = localStorage.getItem("mf_device");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("mf_device", id);
    }
    return id;
  } catch {
    return "nostorage";
  }
}
export function lastTry(): string | null {
  try {
    return localStorage.getItem("mf_last_sheet");
  } catch {
    return null;
  }
}
export function setLastTry(id: string | null) {
  try {
    if (id) localStorage.setItem("mf_last_sheet", id);
    else localStorage.removeItem("mf_last_sheet");
  } catch {}
}
