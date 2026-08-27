import type { AnexoSimples, DadosEmpresa, LinhaTributo, ResultadoRegime } from '../types';
import { REPARTICAO_DAS, aliquotaEfetivaSimples, fatorR, FATOR_R_LIMITE, LIMITE_SIMPLES_NACIONAL } from '../simplesTables';

/** Define o anexo efetivo, aplicando a regra do Fator R (Anexo III x V) quando cabível. */
export function anexoEfetivo(dados: DadosEmpresa): { anexo: AnexoSimples; fatorRPercentual: number | null } {
  if (!dados.atividadeSujeitaFatorR) {
    return { anexo: dados.anexoSimples, fatorRPercentual: null };
  }
  const fr = fatorR(dados.folhaPagamento12m, dados.rbt12);
  return { anexo: fr >= FATOR_R_LIMITE ? 'III' : 'V', fatorRPercentual: fr };
}

export function calcularSimplesPuro(dados: DadosEmpresa): ResultadoRegime {
  const { anexo, fatorRPercentual } = anexoEfetivo(dados);
  const aliquota = aliquotaEfetivaSimples(anexo, dados.rbt12);
  const dasMensal = dados.faturamentoMensal * (aliquota / 100);
  const reparticao = REPARTICAO_DAS[anexo];

  const linhas: LinhaTributo[] = (
    [
      ['IRPJ', reparticao.irpj],
      ['CSLL', reparticao.csll],
      ['COFINS', reparticao.cofins],
      ['PIS/PASEP', reparticao.pis],
      ['CPP (Previdência)', reparticao.cpp],
      ['ICMS', reparticao.icms],
      ['ISS', reparticao.iss],
      ['IPI', reparticao.ipi],
    ] as [string, number][]
  )
    .filter(([, pct]) => pct > 0)
    .map(([tributo, pct]) => ({
      tributo,
      valorMensal: dasMensal * (pct / 100),
      valorAnual: dasMensal * (pct / 100) * 12,
      descricao: `${pct.toFixed(2)}% do DAS`,
    }));

  const observacoes = [
    `Anexo aplicado: ${anexo}${dados.atividadeSujeitaFatorR ? ` (Fator R = ${fatorRPercentual?.toFixed(1)}%, limite 28%)` : ''}.`,
    'No Simples Nacional "puro" a Reforma Tributária não altera a forma de recolhimento: o DAS permanece unificado e sua composição interna passa a contemplar CBS/IBS no lugar de PIS/COFINS/ICMS/ISS, sem mudar a carga total apurada por este regime.',
    'A empresa não aproveita nem transfere créditos de CBS/IBS a seus clientes B2B nesta opção — ponto relevante se a carteira de clientes for majoritariamente empresas do regime regular.',
    ...(dados.rbt12 > LIMITE_SIMPLES_NACIONAL
      ? [`Atenção: RBT12 (${dados.rbt12.toLocaleString('pt-BR')}) excede o limite de R$ 4.800.000,00 do Simples Nacional — a empresa estaria sujeita à exclusão do regime.`]
      : []),
  ];

  return {
    regime: 'simples',
    nomeExibicao: 'Simples Nacional (puro)',
    linhas,
    totalMensal: dasMensal,
    totalAnual: dasMensal * 12,
    aliquotaEfetivaTotal: aliquota,
    observacoes,
  };
}
