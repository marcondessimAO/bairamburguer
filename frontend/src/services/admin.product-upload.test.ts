import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithAuth } from "./api";
import { adminService } from "./admin";

vi.mock("./api", () => ({ fetchWithAuth: vi.fn() }));

describe("product upload errors", () => {
  beforeEach(() => vi.resetAllMocks());

  it.each(["create", "update"])("explains upload size failure during %s", async (action) => {
    vi.mocked(fetchWithAuth).mockResolvedValue(new Response("<html>Request too large</html>", { status: 413 }));
    const request = action === "create"
      ? adminService.createProduct(new FormData())
      : adminService.updateProduct(7, new FormData());
    await expect(request).rejects.toThrow("5 MB");
  });

  it("shows the backend storage error", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValue(new Response("Não foi possível salvar a imagem no servidor.", {
      status: 500, headers: { "content-type": "text/plain" },
    }));
    await expect(adminService.updateProduct(7, new FormData())).rejects.toThrow("salvar a imagem no servidor");
  });

  it("does not show proxy HTML in the product form", async () => {
    vi.mocked(fetchWithAuth).mockResolvedValue(new Response("<html>Bad Gateway</html>", {
      status: 502, headers: { "content-type": "text/html" },
    }));
    await expect(adminService.createProduct(new FormData())).rejects.toThrow("Falha ao criar produto (HTTP 502)");
  });
});
