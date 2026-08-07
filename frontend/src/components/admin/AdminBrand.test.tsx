import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ADMIN_LOGO_SRC, AdminBrand } from "./AdminBrand";

describe("AdminBrand", () => {
  it("shows the official logo and administrator label in the sidebar brand", () => {
    render(<AdminBrand />);
    const logo = screen.getByRole("img", { name: "Logo Bairam Burguer" });
    expect(decodeURIComponent(logo.getAttribute("src") ?? "")).toContain(ADMIN_LOGO_SRC);
    expect(screen.getByText("Painel do Administrador")).toBeInTheDocument();
  });

  it("keeps the official PNG asset and a valid ICO in the Next app convention", () => {
    const logoPath = resolve(process.cwd(), "public/images/bairam-logo-admin.png");
    const faviconPath = resolve(process.cwd(), "src/app/favicon.ico");
    const faviconHeader = readFileSync(faviconPath).subarray(0, 4);

    expect(statSync(logoPath).size).toBeGreaterThan(0);
    expect([...faviconHeader]).toEqual([0, 0, 1, 0]);
  });
});
