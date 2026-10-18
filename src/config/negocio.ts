/**
 * O NEGÓCIO DESTE APP — o único lugar para trocar o nome, as cores e os
 * módulos.
 *
 * Todas as telas leem daqui: o título da aba, a entrada, o menu lateral, o
 * cabeçalho e as rotas. Para adaptar o sistema a um negócio, edite SÓ este
 * arquivo (e troque os logos em `public/` se houver um logo próprio). Não é
 * preciso varrer as telas.
 *
 * Cores em hexadecimal (#rrggbb): a tela converte para o formato do tema.
 * Um módulo desligado some do menu e das rotas; os dados dele continuam
 * guardados e voltam quando ele for religado.
 */

export type ModuloDoNegocio = {
  /** Aparece no menu? */
  ativo: boolean;
  /** O nome que a pessoa lê no menu e no título da tela. */
  titulo: string;
};

export const NEGOCIO = {
  /** O nome do negócio: título da aba, entrada, menu e cabeçalho. */
  nome: "ERP Via",
  /** A frase de abertura na tela de entrada. */
  slogan: "Gestão financeira inteligente.",
  /** O texto de apoio na tela de entrada. */
  descricao:
    "Controle receitas, despesas, contabilidade e fiscal em uma plataforma única, feita para empresas que querem crescer com clareza financeira.",
  /** As cores da marca. `fundo` vazio mantém o fundo escuro do tema. */
  cores: {
    primaria: "#bf95ff",
    destaque: "#64d2ff",
    fundo: "",
  },
  /**
   * Os logos, relativos a `public/`. Vazios, o nome do negócio aparece
   * escrito no lugar do logo.
   */
  logos: {
    claro: "/logo-black.svg",
    escuro: "/logo-white.svg",
    iconeClaro: "/icon-black.svg",
    iconeEscuro: "/icon-white.svg",
  },
  /** Os módulos, na ordem do menu. */
  modulos: {
    dashboard: { ativo: true, titulo: "Dashboard" },
    vendas: { ativo: true, titulo: "Vendas" },
    receitas: { ativo: true, titulo: "Receitas" },
    despesas: { ativo: true, titulo: "Despesas" },
    fluxoDeCaixa: { ativo: true, titulo: "Fluxo de Caixa" },
    clientes: { ativo: true, titulo: "Clientes" },
    fornecedores: { ativo: true, titulo: "Fornecedores" },
    contasBancarias: { ativo: true, titulo: "Contas Bancárias" },
    pessoas: { ativo: true, titulo: "Pessoas" },
    contabilidade: { ativo: true, titulo: "Contabilidade" },
    controladoria: { ativo: true, titulo: "Controladoria" },
    fiscal: { ativo: true, titulo: "Fiscal" },
    conciliacao: { ativo: true, titulo: "Conciliação" },
    configuracoes: { ativo: true, titulo: "Configurações" },
  } satisfies Record<string, ModuloDoNegocio>,
};

export type IdDoModulo = keyof typeof NEGOCIO.modulos;

/** O módulo aparece no menu e nas rotas? */
export function moduloAtivo(id: IdDoModulo): boolean {
  return NEGOCIO.modulos[id].ativo;
}

/** O título do módulo como a pessoa lê. */
export function tituloDoModulo(id: IdDoModulo): string {
  return NEGOCIO.modulos[id].titulo;
}

/** "#bf95ff" → "263 100% 79%", o formato das variáveis do tema. */
export function hexParaHsl(hex: string): string | null {
  const limpo = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(limpo)) return null;
  const r = parseInt(limpo.slice(0, 2), 16) / 255;
  const g = parseInt(limpo.slice(2, 4), 16) / 255;
  const b = parseInt(limpo.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return `${Number(h.toFixed(4))} ${Number((s * 100).toFixed(4))}% ${Number((l * 100).toFixed(4))}%`;
}

/** A marca com fundo definido mantém o mesmo tema em todos os dispositivos. */
function luminancia(hex: string): number | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex.trim())) return null;
  const rgb = [1, 3, 5].map((offset) => {
    const c = parseInt(hex.trim().slice(offset, offset + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

export function temaDaMarca(fundo = NEGOCIO.cores.fundo): "light" | "dark" | undefined {
  const luz = luminancia(fundo);
  return luz === null ? undefined : luz > 0.179 ? "light" : "dark";
}

/** Preserva a tinta da marca quando legível; senão escolhe texto com contraste. */
export function tintaLegivel(fundo: string, preferida?: string): string {
  const luz = luminancia(fundo);
  if (luz === null) return "#FFFFFF";
  const tinta = preferida ? luminancia(preferida) : null;
  if (tinta !== null && (Math.max(luz, tinta) + 0.05) / (Math.min(luz, tinta) + 0.05) >= 4.5) {
    return preferida!;
  }
  return luz > 0.179 ? "#000000" : "#FFFFFF";
}

/** Nome, fundo e contraste são aplicados juntos, antes da primeira tela. */
export function aplicarNegocio(documento: Document = document): void {
  documento.title = NEGOCIO.nome;
  documento.documentElement.lang = "pt-BR";
  const raiz = documento.documentElement;
  const definir = (nome: string, hex: string) => {
    const hsl = hexParaHsl(hex);
    if (hsl) raiz.style.setProperty(nome, hsl);
  };
  for (const nome of ["--primary", "--ring", "--sidebar-primary", "--sidebar-ring"]) definir(nome, NEGOCIO.cores.primaria);
  for (const nome of ["--primary-foreground", "--sidebar-primary-foreground"]) definir(nome, tintaLegivel(NEGOCIO.cores.primaria));
  definir("--accent", NEGOCIO.cores.destaque);
  definir("--accent-foreground", tintaLegivel(NEGOCIO.cores.destaque));
  const tema = temaDaMarca();
  if (tema) {
    raiz.classList.remove("light", "dark");
    raiz.classList.add(tema);
    definir("--background", NEGOCIO.cores.fundo);
    definir("--foreground", tintaLegivel(NEGOCIO.cores.fundo, NEGOCIO.cores.primaria));
  }
}
