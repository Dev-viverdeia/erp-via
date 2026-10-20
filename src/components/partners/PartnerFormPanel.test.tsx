import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PartnerFormPanel } from "./PartnerFormPanel";
import type { Partner } from "@/hooks/usePartners";
const { create, update } = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));
vi.mock("@/hooks/usePartners", () => ({
  useCreatePartner: () => ({ mutateAsync: create, isPending: false }),
  useUpdatePartner: () => ({ mutateAsync: update, isPending: false }),
}));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
afterEach(cleanup);
beforeEach(() => { create.mockReset().mockResolvedValue({}); update.mockReset().mockResolvedValue({}); });
describe("cadastro no contexto do módulo", () => {
  it("salva fornecedor sem exigir escolher o tipo", async () => {
    render(<PartnerFormPanel open onOpenChange={() => {}} defaultType="vendor" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Fornecedor");
    fireEvent.change(screen.getByLabelText("Nome *"), { target: { value: "Fornecedor do teste" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar Parceiro" }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({name:"Fornecedor do teste",type:"vendor"})));
  });
  it("mantém cliente como padrão nas outras telas", () => {
    render(<PartnerFormPanel open onOpenChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Cliente");
  });
  it("preserva o tipo do registro editado e repõe fornecedor ao criar outro", () => {
    const props = { open: true, onOpenChange: () => {}, defaultType: "vendor" as const };
    const partner = { id:"existing",name:"Existente",type:"both" } as Partner;
    const { rerender } = render(<PartnerFormPanel {...props} partner={partner} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Ambos");
    rerender(<PartnerFormPanel {...props} partner={null} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Fornecedor");
    expect(screen.getByLabelText("Nome *")).toHaveValue("");
  });
});
