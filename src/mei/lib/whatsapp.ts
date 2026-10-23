import { formatarMoeda } from '../../lib/format';
import type { ResumoCliente } from './resumo';
import { formatarData, rotuloCompetencia } from './regras';

export function linkWhatsapp(telefone: string, texto: string): string {
  const digitos = telefone.replace(/\D/g, '');
  const numero = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

function primeiroNome(r: ResumoCliente): string {
  const nome = r.cliente.nome.replace(/\d+/g, '').trim().split(/\s+/)[0] ?? '';
  return nome.charAt(0) + nome.slice(1).toLowerCase();
}

export function mensagemDas(r: ResumoCliente): string {
  const vencidos = r.dasCompetencias.filter((d) => d.status === 'vencido');
  if (vencidos.length > 0) {
    const lista = vencidos.map((d) => rotuloCompetencia(d.competencia)).join(', ');
    return `Olá, ${primeiroNome(r)}! Identificamos DAS do MEI em aberto: ${lista}. Pagando agora os juros ficam menores e você evita perder benefícios do INSS. Quer que a gente envie as guias atualizadas?`;
  }
  const d = r.dasDoMes;
  if (!d) return `Olá, ${primeiroNome(r)}! Tudo certo com seus DAS. Qualquer dúvida, estamos por aqui.`;
  return `Olá, ${primeiroNome(r)}! Seu DAS do MEI de ${rotuloCompetencia(d.competencia)} vence em ${formatarData(d.vencimento)}, no valor de ${formatarMoeda(r.das.total)}. Depois de pagar, marque como pago no app.`;
}

export function mensagemLimite(r: ResumoCliente): string {
  const pct = r.situacao.percentual.toFixed(0);
  if (r.situacao.faixa === 'excedido' || r.situacao.faixa === 'desenquadrado') {
    return `Olá, ${primeiroNome(r)}! Seu faturamento em ${r.ano} já passou do limite do MEI (${formatarMoeda(r.receitaAno)} de ${formatarMoeda(r.limite)}). Precisamos conversar ainda esta semana para fazer o desenquadramento do jeito certo e evitar multa. Qual o melhor horário?`;
  }
  return `Olá, ${primeiroNome(r)}! Você já usou ${pct}% do limite do MEI em ${r.ano} (${formatarMoeda(r.receitaAno)} de ${formatarMoeda(r.limite)}). Mantendo esse ritmo, fecha o ano com ${formatarMoeda(r.projecao)}. Vamos planejar juntos os próximos meses?`;
}

export function mensagemDasn(r: ResumoCliente): string {
  return `Olá, ${primeiroNome(r)}! A declaração anual do MEI (DASN-SIMEI) de ${r.ano - 1} ainda não consta como entregue. O prazo é 31 de maio e o atraso gera multa mínima de R$ 50,00. Pode nos confirmar o faturamento total do ano para entregarmos?`;
}

export function mensagemNotaPj(r: ResumoCliente): string {
  return `Olá, ${primeiroNome(r)}! Vimos ${r.pjSemNota} venda(s)/serviço(s) para empresa sem nota fiscal no app. Para cliente com CNPJ a nota é obrigatória. Quer ajuda para emitir no Emissor Nacional?`;
}

export function mensagemLancamentos(r: ResumoCliente): string {
  return `Olá, ${primeiroNome(r)}! Lembrete: lance no app todas as vendas e serviços do mês até o dia 20. É com esses dados que a gente monta seu relatório mensal e acompanha seu limite do MEI.`;
}
