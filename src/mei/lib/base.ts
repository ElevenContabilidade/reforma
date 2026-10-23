import type { BaseMei, ClienteMei, Lancamento, Perfil } from './types';
import { LIMITE_ANUAL_PADRAO, SALARIO_MINIMO_PADRAO, hojeIso } from './regras';

export function baseVazia(): BaseMei {
  return {
    versao: 1,
    config: {
      nomeEscritorio: 'Eleven Contabilidade & Consultoria',
      whatsappEscritorio: '',
      salarioMinimo: SALARIO_MINIMO_PADRAO,
      limiteAnual: LIMITE_ANUAL_PADRAO,
    },
    clientes: [],
    lancamentos: [],
    das: [],
    dasn: [],
    mensagens: [],
  };
}

export function gerarId(prefixo: string): string {
  return `${prefixo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function gerarCodigoAcesso(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function novoLancamento(clienteId: string, tipo: Lancamento['tipo'], origem: Perfil): Lancamento {
  return {
    id: gerarId('lan'),
    clienteId,
    tipo,
    data: hojeIso(),
    descricao: '',
    valor: 0,
    categoria: tipo === 'receita' ? 'servico' : 'outras',
    comNota: false,
    tomadorPj: false,
    origem,
    criadoEm: new Date().toISOString(),
  };
}

export function novoCliente(): ClienteMei {
  return {
    id: gerarId('cli'),
    nome: '',
    nomeFantasia: '',
    cnpj: '',
    atividade: 'servicos',
    descricaoAtividade: '',
    dataAbertura: hojeIso(),
    temFuncionario: false,
    whatsapp: '',
    email: '',
    codigoAcesso: gerarCodigoAcesso(),
    ativo: true,
    observacoes: '',
    criadoEm: new Date().toISOString(),
  };
}
