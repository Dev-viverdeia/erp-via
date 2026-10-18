import { afterEach, describe, expect, it } from "vitest";
import { aplicarNegocio, NEGOCIO, temaDaMarca, tintaLegivel } from "./negocio";

const cores = { ...NEGOCIO.cores };
afterEach(() => { Object.assign(NEGOCIO.cores, cores); document.documentElement.removeAttribute("style"); document.documentElement.className = ""; });

describe("identidade do negócio", () => {
  it("troca o fundo e a tinta juntos mesmo quando o navegador estava escuro", () => {
    Object.assign(NEGOCIO.cores, { primaria: "#0A1F3B", destaque: "#2E4C76", fundo: "#FFFFFF" });
    document.documentElement.className = "dark";
    aplicarNegocio();
    expect(temaDaMarca()).toBe("light");
    expect(document.documentElement.className).toBe("light");
    expect(document.documentElement.style.getPropertyValue("--foreground")).toBe("214 71% 14%");
    expect(document.documentElement.style.getPropertyValue("--background")).toBe("0 0% 100%");
    expect(document.documentElement.lang).toBe("pt-BR");
  });
  it("mantém a escolha livre sem fundo da marca e trata fundo escuro", () => {
    expect(temaDaMarca("")).toBeUndefined();
    expect(temaDaMarca("inválido")).toBeUndefined();
    expect(temaDaMarca("#080808")).toBe("dark");
    expect(temaDaMarca("#FFFFFF")).toBe("light");
  });
  it("não coloca texto claro sobre ação clara nem escuro sobre fundo escuro", () => {
    expect(tintaLegivel("#BF95FF")).toBe("#000000");
    expect(tintaLegivel("#0A1F3B")).toBe("#FFFFFF");
    expect(tintaLegivel("#FFFFFF", "#0A1F3B")).toBe("#0A1F3B");
    expect(tintaLegivel("#080808", "#0A1F3B")).toBe("#FFFFFF");
  });
});
