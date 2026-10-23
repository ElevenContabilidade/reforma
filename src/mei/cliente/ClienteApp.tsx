import { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, FileText, Home, ListOrdered, LogOut, MessageCircle, MessagesSquare, Receipt } from 'lucide-react';
import clsx from 'clsx';
import { EleveIcon } from '../../components/EleveLogo';
import { formatarMoeda } from '../../lib/format';
import { novoLancamento } from '../lib/base';
import { MESES, competencia, despesaNoPeriodo, formatarData, receitaNoPeriodo, rotuloCompetencia, type FaixaLimite } from '../lib/regras';
import { resumirCliente, type ResumoCliente } from '../lib/resumo';
import { useMei } from '../lib/store';
import { linkWhatsapp } from '../lib/whatsapp';
import type { ClienteMei, Lancamento } from '../lib/types';
import { Aviso, BarraLimite, Cartao, SeloDas, botaoPrimario } from '../components/ui';
import { LancamentoForm, ListaLancamentos } from '../components/Lancamentos';
import { PainelDas } from '../components/PainelDas';
import { RelatorioMensal } from '../components/RelatorioMensal';
import { Mensagens } from '../components/Mensagens';

type Tela = 'inicio' | 'lancar' | 'extrato' | 'das' | 'relatorio' | 'contador';

const ORIENTACAO_CLIENTE: Record<FaixaLimite, string> = {
  ok: 'Você está dentro do limite do MEI. Continue lançando todas as vendas.',
  atencao: 'Você já usou mais de 70% do limite do ano. Antes de fechar vendas grandes, fale com a contabilidade.',
  alerta: 'Você está muito perto do limite do MEI. Fale com a contabilidade agora para planejar os próximos meses.',
  excedido: 'Você passou do limite do MEI. A contabilidade precisa regularizar a situação. Fale com a gente.',
  desenquadrado: 'Você passou do limite do MEI em mais de 20%. Fale com a contabilidade com urgência.',
};

export function ClienteApp({ clienteId }: { clienteId: string }) {
  const { base, sair } = useMei();
  const [tela, setTela] = useState<Tela>('inicio');
  const [lancando, setLancando] = useState<Lancamento | null>(null);
  const cliente = base.clientes.find((c) => c.id === clienteId);
  const resumo = useMemo(() => (cliente ? resumirCliente(base, cliente) : null), [base, cliente]);

  if (!cliente || !resumo) {
    return (
      <div className="p-6 text-center text-sm text-stone-600">
        Acesso não encontrado.{' '}
        <button onClick={sair} className="font-semibold text-brand-600 underline">
          Voltar
        </button>
      </div>
    );
  }

  const naoLidas = base.mensagens.filter((m) => m.clienteId === cliente.id && m.de === 'escritorio' && !m.lida).length;

  function abrirLancamento(tipo: Lancamento['tipo']) {
    setLancando(novoLancamento(clienteId, tipo, 'cliente'));
    setTela('lancar');
  }

  const nav: { id: Tela; rotulo: string; icone: typeof Home; contador?: number }[] = [
    { id: 'inicio', rotulo: 'Início', icone: Home },
    { id: 'extrato', rotulo: 'Extrato', icone: ListOrdered },
    { id: 'das', rotulo: 'DAS', icone: Receipt, contador: resumo.dasVencidos },
    { id: 'relatorio', rotulo: 'Relatório', icone: FileText },
    { id: 'contador', rotulo: 'Contador', icone: MessagesSquare, contador: naoLidas },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <header className="no-print bg-brand-900 px-4 pb-5 pt-4 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <EleveIcon className="h-7 w-7" />
            <div>
              <p className="text-sm font-semibold leading-tight">{cliente.nomeFantasia || cliente.nome}</p>
              <p className="text-[11px] text-stone-400">{cliente.cnpj}</p>
            </div>
          </div>
          <button onClick={sair} className="rounded-lg p-2 text-stone-400 hover:bg-white/10 hover:text-white" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {tela === 'inicio' && <Inicio resumo={resumo} cliente={cliente} onLancar={abrirLancamento} onIr={setTela} naoLidas={naoLidas} />}
        {tela === 'lancar' && lancando && (
          <Cartao>
            <h1 className="mb-4 text-lg font-bold text-brand-900">Novo lançamento</h1>
            <LancamentoForm
              key={lancando.id}
              inicial={lancando}
              onSalvo={() => setTela('extrato')}
              onCancelar={() => setTela('inicio')}
            />
          </Cartao>
        )}
        {tela === 'extrato' && (
          <>
            <h1 className="mb-4 text-lg font-bold text-brand-900">Minhas entradas e saídas</h1>
            <ListaLancamentos clienteId={cliente.id} origem="cliente" />
          </>
        )}
        {tela === 'das' && (
          <>
            <h1 className="mb-1 text-lg font-bold text-brand-900">Meus DAS</h1>
            <p className="mb-4 text-sm text-stone-500">Depois de pagar a guia, toque em "Marcar como pago" para a contabilidade saber.</p>
            <PainelDas resumo={resumo} perfil="cliente" />
          </>
        )}
        {tela === 'relatorio' && (
          <>
            <h1 className="mb-4 text-lg font-bold text-brand-900">Relatório mensal de receitas</h1>
            <RelatorioMensal cliente={cliente} />
          </>
        )}
        {tela === 'contador' && (
          <>
            <h1 className="mb-1 text-lg font-bold text-brand-900">Fale com a contabilidade</h1>
            <p className="mb-4 text-sm text-stone-500">{base.config.nomeEscritorio}</p>
            {base.config.whatsappEscritorio && (
              <a
                href={linkWhatsapp(base.config.whatsappEscritorio, `Olá! Sou ${cliente.nomeFantasia || cliente.nome} (CNPJ ${cliente.cnpj}) e preciso de ajuda.`)}
                target="_blank"
                rel="noreferrer"
                className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
              </a>
            )}
            <Mensagens clienteId={cliente.id} perfil="cliente" />
          </>
        )}
      </main>

      <nav className="no-print fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          {nav.map(({ id, rotulo, icone: Icone, contador }) => (
            <button
              key={id}
              onClick={() => setTela(id)}
              className={clsx('relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium', tela === id ? 'text-brand-700' : 'text-stone-500')}
            >
              <Icone className="h-5 w-5" />
              {rotulo}
              {contador ? <span className="absolute right-1/4 top-1.5 h-2 w-2 rounded-full bg-rose-500" /> : null}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Inicio({
  resumo,
  cliente,
  onLancar,
  onIr,
  naoLidas,
}: {
  resumo: ResumoCliente;
  cliente: ClienteMei;
  onLancar: (tipo: Lancamento['tipo']) => void;
  onIr: (t: Tela) => void;
  naoLidas: number;
}) {
  const { base, marcarDas } = useMei();
  const hoje = new Date();
  const mesAtual = competencia(hoje);
  const entradasMes = receitaNoPeriodo(base.lancamentos, cliente.id, mesAtual);
  const saidasMes = despesaNoPeriodo(base.lancamentos, cliente.id, mesAtual);
  const primeiroNome = cliente.nome.replace(/\d+/g, '').trim().split(/\s+/)[0] ?? '';
  const d = resumo.dasDoMes;

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold text-brand-900">
        Olá, {primeiroNome.charAt(0) + primeiroNome.slice(1).toLowerCase()}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onLancar('receita')} className="flex flex-col items-center gap-1.5 rounded-xl bg-emerald-600 py-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
          <ArrowUpCircle className="h-6 w-6" /> Lançar venda
        </button>
        <button onClick={() => onLancar('despesa')} className="flex flex-col items-center gap-1.5 rounded-xl bg-white py-4 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-stone-200 hover:bg-rose-50">
          <ArrowDownCircle className="h-6 w-6" /> Lançar despesa
        </button>
      </div>

      {naoLidas > 0 && (
        <button onClick={() => onIr('contador')} className="w-full text-left">
          <Aviso tom="info" titulo="Nova mensagem da contabilidade">
            Toque para ler.
          </Aviso>
        </button>
      )}
      {resumo.dasVencidos > 0 && (
        <button onClick={() => onIr('das')} className="w-full text-left">
          <Aviso tom="erro" titulo={`${resumo.dasVencidos} DAS em atraso`}>
            Quanto antes pagar, menor a multa. Atraso também pode suspender benefícios do INSS. Toque para ver.
          </Aviso>
        </button>
      )}
      {resumo.pjSemNota > 0 && (
        <Aviso tom="alerta" titulo="Nota fiscal pendente">
          Você tem {resumo.pjSemNota} venda(s) para empresa sem nota. Para cliente com CNPJ a nota é obrigatória.
        </Aviso>
      )}

      {d && (
        <Cartao>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500">DAS de {rotuloCompetencia(d.competencia)}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-brand-900">{formatarMoeda(resumo.das.total)}</p>
              <p className="text-sm text-stone-500">Vence em {formatarData(d.vencimento)}</p>
            </div>
            <SeloDas status={d.status} />
          </div>
          {d.status !== 'pago' && (
            <button onClick={() => marcarDas(cliente.id, d.competencia, true, 'cliente')} className={botaoPrimario + ' mt-4 w-full'}>
              Já paguei este DAS
            </button>
          )}
        </Cartao>
      )}

      <Cartao>
        <p className="mb-2 text-xs uppercase tracking-wide text-stone-500">Limite do MEI em {resumo.ano}</p>
        <BarraLimite situacao={resumo.situacao} receita={resumo.receitaAno} limite={resumo.limite} />
        <p className="mt-3 text-sm text-stone-700">{ORIENTACAO_CLIENTE[resumo.situacao.faixa]}</p>
        {resumo.situacao.faixa === 'ok' && resumo.situacaoProjetada.faixa !== 'ok' && (
          <p className="mt-2 text-sm text-amber-700">
            No ritmo atual você fecha o ano com {formatarMoeda(resumo.projecao)}. Vale conversar com a contabilidade.
          </p>
        )}
      </Cartao>

      <Cartao>
        <p className="mb-3 text-xs uppercase tracking-wide text-stone-500">
          {MESES[hoje.getMonth()]} até agora
        </p>
        <div className="grid grid-cols-3 text-center">
          <div>
            <p className="text-xs text-stone-500">Entradas</p>
            <p className="font-bold tabular-nums text-emerald-700">{formatarMoeda(entradasMes)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Saídas</p>
            <p className="font-bold tabular-nums text-rose-700">{formatarMoeda(saidasMes)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Sobrou</p>
            <p className="font-bold tabular-nums text-brand-900">{formatarMoeda(entradasMes - saidasMes)}</p>
          </div>
        </div>
        <button onClick={() => onIr('extrato')} className="mt-3 w-full text-center text-xs font-semibold text-brand-600 hover:underline">
          Ver extrato completo
        </button>
      </Cartao>
    </div>
  );
}
