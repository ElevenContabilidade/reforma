import type { AnexoSimples } from './types';

export interface FaixaSimples {
  ate: number; // teto da faixa (RBT12)
  aliquotaNominal: number; // % nominal
  parcelaDeduzir: number; // R$
}

/**
 * Tabelas do Simples Nacional (LC 123/2006, redação da LC 155/2016),
 * vigentes desde 01/2018. Valores em R$ e alíquotas em %.
 */
export const TABELAS_SIMPLES: Record<AnexoSimples, FaixaSimples[]> = {
  I: [
    { ate: 180_000, aliquotaNominal: 4.0, parcelaDeduzir: 0 },
    { ate: 360_000, aliquotaNominal: 7.3, parcelaDeduzir: 5_940 },
    { ate: 720_000, aliquotaNominal: 9.5, parcelaDeduzir: 13_860 },
    { ate: 1_800_000, aliquotaNominal: 10.7, parcelaDeduzir: 22_500 },
    { ate: 3_600_000, aliquotaNominal: 14.3, parcelaDeduzir: 87_300 },
    { ate: 4_800_000, aliquotaNominal: 19.0, parcelaDeduzir: 378_000 },
  ],
  II: [
    { ate: 180_000, aliquotaNominal: 4.5, parcelaDeduzir: 0 },
    { ate: 360_000, aliquotaNominal: 7.8, parcelaDeduzir: 5_940 },
    { ate: 720_000, aliquotaNominal: 10.0, parcelaDeduzir: 13_860 },
    { ate: 1_800_000, aliquotaNominal: 11.2, parcelaDeduzir: 22_500 },
    { ate: 3_600_000, aliquotaNominal: 14.7, parcelaDeduzir: 85_500 },
    { ate: 4_800_000, aliquotaNominal: 30.0, parcelaDeduzir: 720_000 },
  ],
  III: [
    { ate: 180_000, aliquotaNominal: 6.0, parcelaDeduzir: 0 },
    { ate: 360_000, aliquotaNominal: 11.2, parcelaDeduzir: 9_360 },
    { ate: 720_000, aliquotaNominal: 13.5, parcelaDeduzir: 17_640 },
    { ate: 1_800_000, aliquotaNominal: 16.0, parcelaDeduzir: 35_640 },
    { ate: 3_600_000, aliquotaNominal: 21.0, parcelaDeduzir: 125_640 },
    { ate: 4_800_000, aliquotaNominal: 33.0, parcelaDeduzir: 648_000 },
  ],
  IV: [
    { ate: 180_000, aliquotaNominal: 4.5, parcelaDeduzir: 0 },
    { ate: 360_000, aliquotaNominal: 9.0, parcelaDeduzir: 8_100 },
    { ate: 720_000, aliquotaNominal: 10.2, parcelaDeduzir: 12_420 },
    { ate: 1_800_000, aliquotaNominal: 14.0, parcelaDeduzir: 39_780 },
    { ate: 3_600_000, aliquotaNominal: 22.0, parcelaDeduzir: 183_780 },
    { ate: 4_800_000, aliquotaNominal: 33.0, parcelaDeduzir: 828_000 },
  ],
  V: [
    { ate: 180_000, aliquotaNominal: 15.5, parcelaDeduzir: 0 },
    { ate: 360_000, aliquotaNominal: 18.0, parcelaDeduzir: 4_500 },
    { ate: 720_000, aliquotaNominal: 19.5, parcelaDeduzir: 9_900 },
    { ate: 1_800_000, aliquotaNominal: 20.5, parcelaDeduzir: 17_100 },
    { ate: 3_600_000, aliquotaNominal: 23.0, parcelaDeduzir: 62_100 },
    { ate: 4_800_000, aliquotaNominal: 30.5, parcelaDeduzir: 540_000 },
  ],
};

export const LIMITE_SIMPLES_NACIONAL = 4_800_000;

export function encontrarFaixa(anexo: AnexoSimples, rbt12: number): FaixaSimples {
  const tabela = TABELAS_SIMPLES[anexo];
  const faixa = tabela.find((f) => rbt12 <= f.ate);
  return faixa ?? tabela[tabela.length - 1];
}

/** Alíquota efetiva (%) = (RBT12 * Aliq. nominal - Parcela a deduzir) / RBT12 */
export function aliquotaEfetivaSimples(anexo: AnexoSimples, rbt12: number): number {
  if (rbt12 <= 0) return 0;
  const faixa = encontrarFaixa(anexo, rbt12);
  const aliquota = (rbt12 * (faixa.aliquotaNominal / 100) - faixa.parcelaDeduzir) / rbt12;
  return Math.max(aliquota * 100, 0);
}

/** Calcula o Fator R = folha de pagamento (12m) / RBT12. Usado para decidir Anexo III x V. */
export function fatorR(folhaPagamento12m: number, rbt12: number): number {
  if (rbt12 <= 0) return 0;
  return (folhaPagamento12m / rbt12) * 100;
}

export const FATOR_R_LIMITE = 28; // %

/**
 * Repartição aproximada dos tributos dentro do DAS por anexo, na 1ª faixa
 * (percentuais variam ligeiramente por faixa; usa-se média divulgada pela RFB
 * como referência para fins de simulação/planejamento).
 */
export interface ReparticaoDas {
  irpj: number;
  csll: number;
  cofins: number;
  pis: number;
  cpp: number;
  icms: number; // comércio/indústria
  iss: number; // serviços
  ipi: number; // indústria (Anexo II)
}

export const REPARTICAO_DAS: Record<AnexoSimples, ReparticaoDas> = {
  I: { irpj: 5.5, csll: 3.5, cofins: 12.74, pis: 2.76, cpp: 41.5, icms: 34.0, iss: 0, ipi: 0 },
  II: { irpj: 5.5, csll: 3.5, cofins: 12.74, pis: 2.76, cpp: 41.5, icms: 32.5, iss: 0, ipi: 1.5 },
  III: { irpj: 4.0, csll: 3.5, cofins: 12.82, pis: 2.78, cpp: 43.4, icms: 0, iss: 33.5, ipi: 0 },
  IV: { irpj: 18.8, csll: 15.2, cofins: 17.67, pis: 3.83, cpp: 0, icms: 0, iss: 44.5, ipi: 0 },
  V: { irpj: 25.5, csll: 15.0, cofins: 14.1, pis: 3.05, cpp: 0, icms: 0, iss: 42.35, ipi: 0 },
};
