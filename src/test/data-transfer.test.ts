import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ images: new Map<string, string>(), kv: new Map<string, string>() }));

vi.mock("@/components/phone/photo-db", () => ({
  listPhotoImages: async () => Object.fromEntries(store.images),
  putPhotoImageWithId: async (id: string, url: string) => { store.images.set(id, url); },
  putKv: async (id: string, v: string) => { store.kv.set(id, v); },
  getKv: async (id: string) => store.kv.get(id) ?? null,
}));

const { parsePhoneBundle, buildPhoneBundle, importPhoneDataFile, undoLastImport } = await import("@/components/phone/recovery");

const bundle = (local: Record<string, string>, images: Record<string, string> = {}) =>
  JSON.stringify({ ...local, "__phone-images-v1": JSON.stringify(images) });

const file = (text: string) => new File([text], "phone-data.json", { type: "application/json" });

describe("Moving phone data between devices", () => {
  beforeEach(() => { localStorage.clear(); store.images.clear(); store.kv.clear(); });

  it("refuses anything that is not a data file", () => {
    expect(parsePhoneBundle("not json")).toBeNull();
    expect(parsePhoneBundle("[]")).toBeNull();
    expect(parsePhoneBundle(JSON.stringify({ "__phone-images-v1": "[]" }))).toBeNull();
  });

  it("keeps text records and photos apart when reading a file back", () => {
    const p = parsePhoneBundle(bundle({ "kkt-msgs-v1": "[{\"id\":\"a\"}]" }, { img1: "data:image/png;base64,AAA" }));
    expect(p?.local["kkt-msgs-v1"]).toBe('[{"id":"a"}]');
    expect(p?.images["img1"]).toBe("data:image/png;base64,AAA");
    expect(p?.local["__phone-images-v1"]).toBeUndefined();
  });

  it("exports saved text together with saved photos", async () => {
    localStorage.setItem("sb-example-auth-token", "SECRET");
    localStorage.setItem("phone-owner-v1", '{"unlocked":true}');
    localStorage.setItem("kkt-msgs-v1", "[{\"id\":\"a\"}]");
    store.images.set("img1", "data:image/png;base64,AAA");
    const p = parsePhoneBundle(await buildPhoneBundle());
    expect(p?.local["kkt-msgs-v1"]).toBe('[{"id":"a"}]');
    expect(p?.images["img1"]).toBe("data:image/png;base64,AAA");
    expect(p?.local["sb-example-auth-token"]).toBeUndefined();
    expect(p?.local["phone-owner-v1"]).toBeUndefined();
  });

  it("copies current data aside before writing an imported file", async () => {
    localStorage.setItem("kkt-msgs-v1", "[{\"id\":\"old\"}]");
    const r = await importPhoneDataFile(file(bundle({ "kkt-msgs-v1": "[{\"id\":\"new\"}]" }, { img1: "data:image/png;base64,AAA" })));
    expect(r).toEqual({ keys: 1, images: 1, failed: 0 });
    expect(localStorage.getItem("kkt-msgs-v1")).toBe('[{"id":"new"}]');
    expect(store.images.get("img1")).toBe("data:image/png;base64,AAA");
    const safety = parsePhoneBundle(store.kv.get("phone-last-import-safety") ?? "");
    expect(safety?.local["kkt-msgs-v1"]).toBe('[{"id":"old"}]');
  });

  it("goes back to exactly the data from before the import", async () => {
    localStorage.setItem("kkt-msgs-v1", "[{\"id\":\"old\"}]");
    await importPhoneDataFile(file(bundle({ "kkt-msgs-v1": "[{\"id\":\"new\"}]" })));
    expect(await undoLastImport()).toBe(true);
    expect(localStorage.getItem("kkt-msgs-v1")).toBe('[{"id":"old"}]');
  });

  it("says there is nothing to undo when no import happened here", async () => {
    expect(await undoLastImport()).toBe(false);
  });
});
