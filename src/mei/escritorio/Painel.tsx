import { useMemo, useState, type ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { formatarMoeda } from '../../lib/format';
import { prioridade, resumirCliente, type ResumoCliente } from '../lib/resumo';
import { useMei } from '../lib/store';
import { linkWhatsapp, mensagemDas, mensagemDasn, mensagemLimite, mensagemNotaPj } from '../lib/whatsapp';
import { BarraLimite, Cabecalho, Indicador, SeloFaixa, Vazio, botaoWhats } from '../components/ui';

type Filtro = 'todos' | 'limite' | 'das' | 'dasn' | 'nota';

export function Painel({ onAbrirCliente }: { onAbrirCliente: (id: string) => void }) {
  const { base } = useMei();
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const resumos = useMemo(
    () =>
      base.clientes
        .filter((c) => c.ativo)
        .map((c) => resumirCliente(base, c))
        .sort((a, b) => prioridade(b) - prioridade(a)),
    [base],
  );

  const emRiscoLimite = resumos.filter((r) => r.situacao.faixa !== 'ok' || ['alerta', 'excedido', 'desenquadrado'].includes(r.situacaoProjetada.faixa));
  const comDasVencido = resumos.filter((r) => r.dasVencidos > 0);
  const comDasn = resumos.filter((r) => r.dasnPendente);
  const comNotaPj = resumos.filter((r) => r.pjSemNota > 0);

  const visiveis = {
    todos: resumos,
    limite: emRiscoLimite,
    das: comDasVencido,
    dasn: comDasn,
    nota: comNotaPj,
  }[filtro];

  const ano = new Date().getFullYear();

  return (
    <div>
      <Cabecalho titulo="Painel da carteira MEI" subtitulo={`Situação de ${resumos.length} cliente(s) ativo(s) em ${ano}, ordenada por urgência.`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BotaoIndicador ativo={filtro === 'limite'} onClick={() => setFiltro(filtro === 'limite' ? 'todos' : 'limite')}>
          <Indicador rotulo="Risco de limite" valor={emRiscoLimite.length} detalhe="70% ou mais do limite" tom={emRiscoLimite.length ? 'alerta' : 'bom'} />
        </BotaoIndicador>
        <BotaoIndicador ativo={filtro === 'das'} onClick={() => setFiltro(filtro === 'das' ? 'todos' : 'das')}>
          <Indicador rotulo="DAS vencido" valor={comDasVencido.length} detalhe="clientes com guia em atraso" tom={comDasVencido.length ? 'ruim' : 'bom'} />
        </BotaoIndicador>
        <BotaoIndicador ativo={filtro === 'dasn'} onClick={() => setFiltro(filtro === 'dasn' ? 'todos' : 'dasn')}>
          <Indicador rotulo={`DASN ${ano - 1}`} valor={comDasn.length} detalhe="declarações não entregues" tom={comDasn.length ? 'ruim' : 'bom'} />
        </BotaoIndicador>
        <BotaoIndicador ativo={filtro === 'nota'} onClick={() => setFiltro(filtro === 'nota' ? 'todos' : 'nota')}>
          <Indicador rotulo="PJ sem nota" valor={comNotaPj.length} detalhe="vendas a empresas sem NF" tom={comNotaPj.length ? 'alerta' : 'bom'} />
        </BotaoIndicador>
      </div>

      {filtro !== 'todos' && (
        <button onClick={() => setFiltro('todos')} className="mb-3 text-xs font-semibold text-brand-600 hover:underline">
          Limpar filtro e mostrar todos
        </button>
      )}

      {visiveis.length === 0 ? (
        <Vazio>{resumos.length === 0 ? 'Cadastre o primeiro cliente MEI no menu Clientes.' : 'Nenhum cliente neste filtro.'}</Vazio>
      ) : (
        <div className="space-y-3">
          {visiveis.map((r) => (
            <LinhaCliente key={r.cliente.id} r={r} onAbrir={() => onAbrirCliente(r.cliente.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function BotaoIndicador({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`h-full rounded-xl text-left transition [&>div]:h-full ${ativo ? 'ring-2 ring-brand-500' : 'hover:ring-2 hover:ring-stone-200'}`}>
      {children}
    </button>
  );
}

function LinhaCliente({ r, onAbrir }: { r: ResumoCliente; onAbrir: () => void }) {
  const pendencias: { texto: string; mensagem: string }[] = [];
  if (r.situacao.faixa !== 'ok' || r.situacaoProjetada.faixa === 'excedido' || r.situacaoProjetada.faixa === 'desenquadrado') {
    pendencias.push({ texto: r.situacao.faixa === 'ok' ? 'Projeção acima do limite' : r.situacao.titulo, mensagem: mensagemLimite(r) });
  }
  if (r.dasVencidos > 0) pendencias.push({ texto: `${r.dasVencidos} DAS vencido(s)`, mensagem: mensagemDas(r) });
  if (r.dasnPendente) pendencias.push({ texto: `DASN ${r.ano - 1} pendente`, mensagem: mensagemDasn(r) });
  if (r.pjSemNota > 0) pendencias.push({ texto: `${r.pjSemNota} receita(s) PJ sem nota`, mensagem: mensagemNotaPj(r) });
  if (r.mensagensAbertas > 0) pendencias.push({ texto: `${r.mensagensAbertas} solicitação(ões) aberta(s)`, mensagem: '' });

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button onClick={onAbrir} className="min-w-0 text-left">
          <p className="truncate font-semibold text-brand-900 hover:underline">{r.cliente.nomeFantasia || r.cliente.nome}</p>
          <p className="text-xs text-stone-500">
            {r.cliente.cnpj} · DAS {formatarMoeda(r.das.total)}
            {r.cliente.temFuncionario ? ' · com funcionário' : ''}
          </p>
        </button>
        <SeloFaixa faixa={r.situacao.faixa} />
      </div>

      <div className="mt-3">
        <BarraLimite situacao={r.situacao} receita={r.receitaAno} limite={r.limite} projecao={r.projecao} />
      </div>

      {pendencias.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {pendencias.map((p) => (
            <li key={p.texto} className="flex items-center gap-1.5 rounded-lg bg-stone-50 py-1 pl-2.5 pr-1 text-xs text-stone-700 ring-1 ring-stone-200">
              {p.texto}
              {p.mensagem && r.cliente.whatsapp ? (
                <a href={linkWhatsapp(r.cliente.whatsapp, p.mensagem)} target="_blank" rel="noreferrer" className={botaoWhats} title="Enviar mensagem pronta no WhatsApp">
                  <MessageCircle className="h-3 w-3" />
                  Avisar
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
