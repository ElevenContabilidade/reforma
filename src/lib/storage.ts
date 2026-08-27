import type { SimulacaoSalva, DadosEmpresa } from './types';

const CHAVE = 'reforma-tributaria:simulacoes';

export function listarSimulacoes(): SimulacaoSalva[] {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (!raw) return [];
    return JSON.parse(raw) as SimulacaoSalva[];
  } catch {
    return [];
  }
}

export function salvarSimulacao(id: string, dados: DadosEmpresa): SimulacaoSalva[] {
  const lista = listarSimulacoes();
  const agora = new Date().toISOString();
  const existente = lista.find((s) => s.id === id);
  if (existente) {
    existente.dados = dados;
    existente.atualizadoEm = agora;
  } else {
    lista.unshift({ id, criadoEm: agora, atualizadoEm: agora, dados });
  }
  localStorage.setItem(CHAVE, JSON.stringify(lista));
  return lista;
}

export function excluirSimulacao(id: string): SimulacaoSalva[] {
  const lista = listarSimulacoes().filter((s) => s.id !== id);
  localStorage.setItem(CHAVE, JSON.stringify(lista));
  return lista;
}

export function gerarId(): string {
  return `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
