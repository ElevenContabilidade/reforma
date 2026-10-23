import type { BaseMei, ClienteMei } from './types';
import {
  competencia,
  competenciasDoAno,
  limiteDoAno,
  projecaoAnual,
  receitaNoPeriodo,
  receitasPjSemNota,
  situacaoLimite,
  statusDas,
  valorDas,
  vencimentoDas,
  type ComposicaoDas,
  type SituacaoLimite,
  type StatusDas,
} from './regras';

export interface ResumoCliente {
  cliente: ClienteMei;
  ano: number;
  receitaAno: number;
  limite: number;
  situacao: SituacaoLimite;
  projecao: number;
  situacaoProjetada: SituacaoLimite;
  das: ComposicaoDas;
  dasCompetencias: { competencia: string; status: StatusDas; vencimento: Date }[];
  dasVencidos: number;
  /** DAS do mês anterior, que vence no dia 20 do mês corrente. */
  dasDoMes: { competencia: string; status: StatusDas; vencimento: Date } | null;
  dasnPendente: boolean;
  pjSemNota: number;
  mensagensAbertas: number;
}

export function resumirCliente(base: BaseMei, cliente: ClienteMei, hoje = new Date()): ResumoCliente {
  const ano = hoje.getFullYear();
  const receitaAno = receitaNoPeriodo(base.lancamentos, cliente.id, String(ano));
  const limite = limiteDoAno(cliente, ano, base.config.limiteAnual);
  const projecao = projecaoAnual(receitaAno, cliente, ano, hoje);

  // Só entram competências já encerradas: o DAS do mês corrente ainda não foi gerado.
  // Em janeiro, isso mostra o ano anterior inteiro.
  const mesAnterior = new Date(ano, hoje.getMonth() - 1, 1);
  const comps = competenciasDoAno(cliente, mesAnterior.getFullYear(), mesAnterior);
  const dasCompetencias = comps.map((comp) => ({
    competencia: comp,
    status: statusDas(
      base.das.find((d) => d.clienteId === cliente.id && d.competencia === comp),
      comp,
      hoje,
    ),
    vencimento: vencimentoDas(comp),
  }));
  const compAnterior = competencia(mesAnterior);

  const anoAbertura = Number(cliente.dataAbertura.slice(0, 4));
  const dasnPendente =
    anoAbertura < ano && !base.dasn.some((d) => d.clienteId === cliente.id && d.anoBase === ano - 1 && d.entregue);

  return {
    cliente,
    ano,
    receitaAno,
    limite,
    situacao: situacaoLimite(receitaAno, limite),
    projecao,
    situacaoProjetada: situacaoLimite(projecao, limite),
    das: valorDas(cliente.atividade, base.config.salarioMinimo),
    dasCompetencias,
    dasVencidos: dasCompetencias.filter((d) => d.status === 'vencido').length,
    dasDoMes: dasCompetencias.find((d) => d.competencia === compAnterior) ?? null,
    dasnPendente,
    pjSemNota: receitasPjSemNota(base.lancamentos, cliente.id, String(ano)).length,
    mensagensAbertas: base.mensagens.filter((m) => m.clienteId === cliente.id && m.de === 'cliente' && !m.resolvida)
      .length,
  };
}

/** Pontuação para ordenar a carteira: quem precisa de ação aparece primeiro. */
export function prioridade(r: ResumoCliente): number {
  const pesoFaixa = { ok: 0, atencao: 1, alerta: 3, excedido: 5, desenquadrado: 6 };
  return (
    pesoFaixa[r.situacao.faixa] * 10 +
    pesoFaixa[r.situacaoProjetada.faixa] * 3 +
    r.dasVencidos * 4 +
    (r.dasnPendente ? 6 : 0) +
    r.pjSemNota * 2 +
    r.mensagensAbertas * 2
  );
}
