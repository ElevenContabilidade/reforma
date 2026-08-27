import type { DadosEmpresa, LinhaTributo, ResultadoRegime } from '../types';
import { calcularIrpjComAdicional, calcularTributacaoIndireta } from './shared';

export function calcularLucroReal(dados: DadosEmpresa): ResultadoRegime {
  const baseLucro = dados.faturamentoMensal * (dados.margemLucroReal / 100);

  const irpjMensal = calcularIrpjComAdicional(baseLucro);
  const csllMensal = baseLucro * 0.09;

  const indireta = calcularTributacaoIndireta(dados, {
    pisCofinsCumulativo: false,
    aliquotaPisCofinsLegado: 9.25,
  });

  const linhas: LinhaTributo[] = [
    {
      tributo: 'IRPJ',
      valorMensal: irpjMensal,
      valorAnual: irpjMensal * 12,
      descricao: `15% + adicional de 10% sobre o lucro real (margem de ${dados.margemLucroReal}% informada)`,
    },
    {
      tributo: 'CSLL',
      valorMensal: csllMensal,
      valorAnual: csllMensal * 12,
      descricao: '9% sobre o lucro real',
    },
    ...indireta.linhas,
  ];

  const totalMensal = irpjMensal + csllMensal + indireta.totalMensal;

  const observacoes = [
    `Lucro real estimado a partir da margem informada (${dados.margemLucroReal}% da receita) — para uma apuração definitiva, utilize o resultado contábil ajustado (LALUR).`,
    'PIS/COFINS calculado pelo regime não cumulativo (9,25%), com crédito sobre compras/insumos informadas.',
    'CBS/IBS e ICMS/ISS seguem a mesma lógica de crédito não cumulativo sobre compras/insumos.',
    'Regime obrigatório para empresas com receita acima de R$ 78 milhões/ano ou que se enquadrem nas demais hipóteses legais do art. 14 da Lei 9.718/1998.',
  ];

  return {
    regime: 'real',
    nomeExibicao: 'Lucro Real',
    linhas,
    totalMensal,
    totalAnual: totalMensal * 12,
    aliquotaEfetivaTotal: dados.faturamentoMensal > 0 ? (totalMensal / dados.faturamentoMensal) * 100 : 0,
    observacoes,
  };
}
