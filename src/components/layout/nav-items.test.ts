import { describe, expect, it } from "vitest";
import { isActivePath, navItems } from "./nav-items";

describe("isActivePath", () => {
  it("marca a rota exata e suas sub-rotas", () => {
    expect(isActivePath("/habits", "/habits")).toBe(true);
    expect(isActivePath("/habits/123", "/habits")).toBe(true);
  });

  it("não confunde rotas com o mesmo prefixo", () => {
    expect(isActivePath("/habits-archive", "/habits")).toBe(false);
    expect(isActivePath("/", "/today")).toBe(false);
  });
});

describe("navItems", () => {
  it("tem Hoje como primeiro item e no máximo 4 atalhos diretos no celular", () => {
    expect(navItems[0]?.href).toBe("/today");
    expect(navItems.filter((item) => item.mobile).length).toBeLessThanOrEqual(4);
  });
});
