import type { DadosEmpresa } from './types';

export function novaDadosEmpresa(): DadosEmpresa {
  return {
    nomeCliente: '',
    cnpj: '',
    setor: 'servicos',
    anexoSimples: 'III',
    atividadeSujeitaFatorR: true,
    faturamentoMensal: 50_000,
    rbt12: 600_000,
    folhaPagamento12m: 150_000,
    margemLucroReal: 15,
    percentualCompraInsumos: 20,
    aliquotaEfetivaIcmsIss: 5,
    anoSimulacao: 2026,
    mixReceita: [],
  };
}
