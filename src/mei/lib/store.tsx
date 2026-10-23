import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BaseMei, ClienteMei, Lancamento, Mensagem, Perfil, RegistroDas, RegistroDasn, Sessao } from './types';
import { baseVazia, gerarId } from './base';

// Camada única de persistência. Hoje grava no localStorage (modo demonstração,
// um navegador só); para uso real com clientes acessando de outros aparelhos,
// basta trocar `carregar`/`gravar` por chamadas a um banco online.
const CHAVE_BASE = 'gestao-mei:base';
const CHAVE_SESSAO = 'gestao-mei:sessao';

function carregar(): BaseMei {
  try {
    const raw = localStorage.getItem(CHAVE_BASE);
    if (!raw) return baseVazia();
    const base = JSON.parse(raw) as BaseMei;
    return { ...baseVazia(), ...base, config: { ...baseVazia().config, ...base.config } };
  } catch {
    return baseVazia();
  }
}

function gravar(base: BaseMei) {
  try {
    localStorage.setItem(CHAVE_BASE, JSON.stringify(base));
  } catch {
    // Sem armazenamento disponível (aba anônima, bloqueio do navegador): segue só em memória.
  }
}

function carregarSessao(): Sessao | null {
  try {
    const raw = sessionStorage.getItem(CHAVE_SESSAO);
    return raw ? (JSON.parse(raw) as Sessao) : null;
  } catch {
    return null;
  }
}

function gravarSessao(sessao: Sessao | null) {
  try {
    if (sessao) sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    else sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // ignora
  }
}

interface Acoes {
  sessao: Sessao | null;
  entrar: (s: Sessao) => void;
  sair: () => void;
  substituirBase: (b: BaseMei) => void;
  atualizarConfig: (c: Partial<BaseMei['config']>) => void;
  salvarCliente: (c: ClienteMei) => void;
  excluirCliente: (id: string) => void;
  salvarLancamento: (l: Lancamento) => void;
  excluirLancamento: (id: string) => void;
  marcarDas: (clienteId: string, competencia: string, pago: boolean, por: Perfil) => void;
  marcarDasn: (clienteId: string, anoBase: number, entregue: boolean) => void;
  enviarMensagem: (m: Omit<Mensagem, 'id' | 'criadoEm' | 'lida' | 'resolvida'>) => void;
  atualizarMensagem: (id: string, campos: Partial<Pick<Mensagem, 'lida' | 'resolvida'>>) => void;
}

const Contexto = createContext<(Acoes & { base: BaseMei }) | null>(null);

export function MeiProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<BaseMei>(carregar);
  const [sessao, setSessao] = useState<Sessao | null>(carregarSessao);

  // Mantém abas abertas em sincronia: o escritório numa aba e o cliente em
  // outra veem as alterações um do outro na hora.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === CHAVE_BASE) setBase(carregar());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const alterar = useCallback((fn: (b: BaseMei) => BaseMei) => {
    setBase((atual) => {
      const nova = fn(atual);
      gravar(nova);
      return nova;
    });
  }, []);

  const acoes = useMemo<Acoes>(
    () => ({
      sessao,
      entrar: (s) => {
        gravarSessao(s);
        setSessao(s);
      },
      sair: () => {
        gravarSessao(null);
        setSessao(null);
      },
      substituirBase: (b) => alterar(() => b),
      atualizarConfig: (c) => alterar((b) => ({ ...b, config: { ...b.config, ...c } })),
      salvarCliente: (c) =>
        alterar((b) => ({
          ...b,
          clientes: b.clientes.some((x) => x.id === c.id)
            ? b.clientes.map((x) => (x.id === c.id ? c : x))
            : [...b.clientes, c],
        })),
      excluirCliente: (id) =>
        alterar((b) => ({
          ...b,
          clientes: b.clientes.filter((c) => c.id !== id),
          lancamentos: b.lancamentos.filter((l) => l.clienteId !== id),
          das: b.das.filter((d) => d.clienteId !== id),
          dasn: b.dasn.filter((d) => d.clienteId !== id),
          mensagens: b.mensagens.filter((m) => m.clienteId !== id),
        })),
      salvarLancamento: (l) =>
        alterar((b) => ({
          ...b,
          lancamentos: b.lancamentos.some((x) => x.id === l.id)
            ? b.lancamentos.map((x) => (x.id === l.id ? l : x))
            : [...b.lancamentos, l],
        })),
      excluirLancamento: (id) => alterar((b) => ({ ...b, lancamentos: b.lancamentos.filter((l) => l.id !== id) })),
      marcarDas: (clienteId, competencia, pago, por) =>
        alterar((b) => {
          const resto = b.das.filter((d) => !(d.clienteId === clienteId && d.competencia === competencia));
          const registro: RegistroDas = {
            clienteId,
            competencia,
            pago,
            pagoEm: pago ? new Date().toISOString() : undefined,
            informadoPor: por,
          };
          return { ...b, das: [...resto, registro] };
        }),
      marcarDasn: (clienteId, anoBase, entregue) =>
        alterar((b) => {
          const resto = b.dasn.filter((d) => !(d.clienteId === clienteId && d.anoBase === anoBase));
          const registro: RegistroDasn = {
            clienteId,
            anoBase,
            entregue,
            entregueEm: entregue ? new Date().toISOString() : undefined,
          };
          return { ...b, dasn: [...resto, registro] };
        }),
      enviarMensagem: (m) =>
        alterar((b) => ({
          ...b,
          mensagens: [
            ...b.mensagens,
            { ...m, id: gerarId('msg'), criadoEm: new Date().toISOString(), lida: false, resolvida: false },
          ],
        })),
      atualizarMensagem: (id, campos) =>
        alterar((b) => ({ ...b, mensagens: b.mensagens.map((m) => (m.id === id ? { ...m, ...campos } : m)) })),
    }),
    [alterar, sessao],
  );

  return <Contexto.Provider value={{ base, ...acoes }}>{children}</Contexto.Provider>;
}

export function useMei() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useMei precisa estar dentro de <MeiProvider>');
  return ctx;
}
