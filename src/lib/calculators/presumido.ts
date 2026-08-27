import type { DadosEmpresa, LinhaTributo, ResultadoRegime } from '../types';
import { calcularIrpjComAdicional, calcularTributacaoIndireta } from './shared';

const PRESUNCAO_IRPJ: Record<DadosEmpresa['setor'], number> = {
  comercio: 8,
  industria: 8,
  servicos: 32,
};

const PRESUNCAO_CSLL: Record<DadosEmpresa['setor'], number> = {
  comercio: 12,
  industria: 12,
  servicos: 32,
};

export function calcularLucroPresumido(dados: DadosEmpresa): ResultadoRegime {
  const baseIrpj = dados.faturamentoMensal * (PRESUNCAO_IRPJ[dados.setor] / 100);
  const baseCsll = dados.faturamentoMensal * (PRESUNCAO_CSLL[dados.setor] / 100);

  const irpjMensal = calcularIrpjComAdicional(baseIrpj);
  const csllMensal = baseCsll * 0.09;

  const indireta = calcularTributacaoIndireta(dados, {
    pisCofinsCumulativo: true,
    aliquotaPisCofinsLegado: 3.65,
  });

  const linhas: LinhaTributo[] = [
    {
      tributo: 'IRPJ',
      valorMensal: irpjMensal,
      valorAnual: irpjMensal * 12,
      descricao: `Base presumida de ${PRESUNCAO_IRPJ[dados.setor]}% da receita + adicional de 10%`,
    },
    {
      tributo: 'CSLL',
      valorMensal: csllMensal,
      valorAnual: csllMensal * 12,
      descricao: `Base presumida de ${PRESUNCAO_CSLL[dados.setor]}% da receita`,
    },
    ...indireta.linhas,
  ];

  const totalMensal = irpjMensal + csllMensal + indireta.totalMensal;

  const observacoes = [
    'Bases de presunção padrão: 8% (comércio/indústria) e 32% (serviços) para IRPJ e CSLL — ajuste conforme a atividade específica do cliente, se aplicável (ex.: transporte de carga usa base reduzida).',
    'PIS/COFINS calculado pelo regime cumulativo (3,65%) enquanto ainda vigente; sem direito a crédito sobre compras nesta fase.',
    'ICMS/ISS considerado pela alíquota efetiva informada, líquida de créditos já apropriados no regime atual.',
  ];

  return {
    regime: 'presumido',
    nomeExibicao: 'Lucro Presumido',
    linhas,
    totalMensal,
    totalAnual: totalMensal * 12,
    aliquotaEfetivaTotal: dados.faturamentoMensal > 0 ? (totalMensal / dados.faturamentoMensal) * 100 : 0,
    observacoes,
  };
}
