import { useMemo, useState } from 'react';
import { ArrowLeft, Copy, MessageCircle, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatarMoeda } from '../../lib/format';
import { LIMITE_ANUAL_CAMINHONEIRO, MESES_ABREV, despesaNoPeriodo, formatarData, receitaNoPeriodo, vencimentoDasn } from '../lib/regras';
import { resumirCliente } from '../lib/resumo';
import { useMei } from '../lib/store';
import { linkWhatsapp, mensagemDas, mensagemDasn, mensagemLancamentos, mensagemLimite } from '../lib/whatsapp';
import { Abas, Aviso, BarraLimite, Cartao, Indicador, SeloFaixa, botaoSecundario, botaoWhats } from '../components/ui';
import { ListaLancamentos } from '../components/Lancamentos';
import { PainelDas } from '../components/PainelDas';
import { RelatorioMensal } from '../components/RelatorioMensal';
import { Mensagens } from '../components/Mensagens';
import { ClienteForm } from './ClienteForm';

type Aba = 'resumo' | 'lancamentos' | 'das' | 'relatorio' | 'mensagens' | 'cadastro';

export function ClienteDetalhe({ clienteId, onVoltar }: { clienteId: string; onVoltar: () => void }) {
  const { base, excluirCliente, marcarDasn } = useMei();
  const [aba, setAba] = useState<Aba>('resumo');
  const cliente = base.clientes.find((c) => c.id === clienteId);
  const resumo = useMemo(() => (cliente ? resumirCliente(base, cliente) : null), [base, cliente]);

  if (!cliente || !resumo) {
    return (
      <div>
        <p className="text-sm text-stone-500">Cliente não encontrado.</p>
        <button onClick={onVoltar} className={botaoSecundario + ' mt-3'}>
          Voltar
        </button>
      </div>
    );
  }

  const ano = resumo.ano;
  const dadosGrafico = MESES_ABREV.map((m, i) => {
    const comp = `${ano}-${String(i + 1).padStart(2, '0')}`;
    return {
      mes: m,
      receita: receitaNoPeriodo(base.lancamentos, cliente.id, comp),
      despesa: despesaNoPeriodo(base.lancamentos, cliente.id, comp),
    };
  });
  const tetoMensal = (cliente.atividade === 'caminhoneiro' ? LIMITE_ANUAL_CAMINHONEIRO : base.config.limiteAnual) / 12;
  const dasnEntregue = base.dasn.find((d) => d.clienteId === cliente.id && d.anoBase === ano - 1)?.entregue ?? false;
  const abertoAntes = Number(cliente.dataAbertura.slice(0, 4)) < ano;
  const msgsNaoLidas = base.mensagens.filter((m) => m.clienteId === cliente.id && m.de === 'cliente' && !m.lida).length;

  return (
    <div>
      <button onClick={onVoltar} className="no-print mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900">{cliente.nomeFantasia || cliente.nome}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {cliente.cnpj} · aberto em {formatarData(cliente.dataAbertura)} · {cliente.descricaoAtividade || 'atividade não informada'}
          </p>
        </div>
        <SeloFaixa faixa={resumo.situacao.faixa} />
      </div>

      <Abas<Aba>
        ativa={aba}
        onChange={setAba}
        abas={[
          { id: 'resumo', rotulo: 'Resumo' },
          { id: 'lancamentos', rotulo: 'Lançamentos' },
          { id: 'das', rotulo: 'DAS', contador: resumo.dasVencidos },
          { id: 'relatorio', rotulo: 'Relatório mensal' },
          { id: 'mensagens', rotulo: 'Mensagens', contador: msgsNaoLidas },
          { id: 'cadastro', rotulo: 'Cadastro' },
        ]}
      />

      {aba === 'resumo' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador rotulo={`Receita ${ano}`} valor={formatarMoeda(resumo.receitaAno)} />
            <Indicador rotulo="Projeção dezembro" valor={formatarMoeda(resumo.projecao)} tom={resumo.situacaoProjetada.faixa === 'ok' ? 'bom' : 'alerta'} />
            <Indicador rotulo="DAS mensal" valor={formatarMoeda(resumo.das.total)} />
            <Indicador rotulo="DAS vencidos" valor={resumo.dasVencidos} tom={resumo.dasVencidos ? 'ruim' : 'bom'} />
          </div>

          <Cartao>
            <h2 className="mb-3 font-semibold text-brand-900">Limite de faturamento {ano}</h2>
            <BarraLimite situacao={resumo.situacao} receita={resumo.receitaAno} limite={resumo.limite} projecao={resumo.projecao} />
            <div className="mt-4">
              <Aviso tom={resumo.situacao.faixa === 'ok' ? 'info' : resumo.situacao.faixa === 'atencao' ? 'alerta' : 'erro'} titulo={resumo.situacao.titulo}>
                {resumo.situacao.orientacao}
                {resumo.situacao.faixa === 'ok' && resumo.situacaoProjetada.faixa !== 'ok' && (
                  <> Porém, no ritmo atual, a projeção indica: {resumo.situacaoProjetada.titulo.toLowerCase()}.</>
                )}
              </Aviso>
            </div>
          </Cartao>

          <Cartao>
            <h2 className="mb-3 font-semibold text-brand-900">Receitas e despesas por mês</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => formatarMoeda(Number(v))} />
                  <ReferenceLine y={tetoMensal} stroke="#c9922b" strokeDasharray="4 4" label={{ value: 'média mensal do limite', fontSize: 11, fill: '#8a6a1f', position: 'insideTopRight' }} />
                  <Bar dataKey="receita" name="Receitas" fill="#6b1013" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesas" fill="#e6adad" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Cartao>

          <div className="grid gap-5 lg:grid-cols-2">
            <Cartao>
              <h2 className="mb-3 font-semibold text-brand-900">Obrigações anuais</h2>
              {abertoAntes ? (
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={dasnEntregue} onChange={(e) => marcarDasn(cliente.id, ano - 1, e.target.checked)} />
                  <span>
                    DASN-SIMEI ano-base {ano - 1} entregue
                    <span className="block text-xs text-stone-500">
                      Prazo: {formatarData(vencimentoDasn(ano - 1))}. Atraso: multa de 2% ao mês sobre os tributos, mínimo R$ 50,00 (reduzida à metade se entregue antes de intimação).
                    </span>
                  </span>
                </label>
              ) : (
                <p className="text-sm text-stone-500">Aberto em {ano}: a primeira DASN-SIMEI será a do ano-base {ano}, até 31/05/{ano + 1}.</p>
              )}
              {cliente.temFuncionario && (
                <p className="mt-3 text-sm text-stone-600">
                  Com funcionário: eSocial mensal, DCTFWeb (INSS 8% a 14% do empregado + CPP de 3%) e FGTS Digital (8%), todos com vencimento no dia 20.
                </p>
              )}
            </Cartao>

            <Cartao>
              <h2 className="mb-3 font-semibold text-brand-900">Mensagens prontas</h2>
              {cliente.whatsapp ? (
                <div className="flex flex-wrap gap-2">
                  <a className={botaoWhats} target="_blank" rel="noreferrer" href={linkWhatsapp(cliente.whatsapp, mensagemDas(resumo))}>
                    <MessageCircle className="h-3 w-3" /> DAS
                  </a>
                  <a className={botaoWhats} target="_blank" rel="noreferrer" href={linkWhatsapp(cliente.whatsapp, mensagemLimite(resumo))}>
                    <MessageCircle className="h-3 w-3" /> Limite
                  </a>
                  <a className={botaoWhats} target="_blank" rel="noreferrer" href={linkWhatsapp(cliente.whatsapp, mensagemLancamentos(resumo))}>
                    <MessageCircle className="h-3 w-3" /> Lançamentos do mês
                  </a>
                  {resumo.dasnPendente && (
                    <a className={botaoWhats} target="_blank" rel="noreferrer" href={linkWhatsapp(cliente.whatsapp, mensagemDasn(resumo))}>
                      <MessageCircle className="h-3 w-3" /> DASN
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-stone-500">Cadastre o WhatsApp do cliente para usar as mensagens prontas.</p>
              )}
              <div className="mt-4 rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
                <p className="font-semibold text-stone-700">Acesso do cliente ao app</p>
                <p className="mt-1">
                  CNPJ <span className="font-mono">{cliente.cnpj}</span> · código <span className="font-mono font-bold tracking-widest">{cliente.codigoAcesso}</span>
                </p>
                <button
                  onClick={() => navigator.clipboard?.writeText(`Acesso ao app da contabilidade\nCNPJ: ${cliente.cnpj}\nCódigo: ${cliente.codigoAcesso}`)}
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                >
                  <Copy className="h-3 w-3" /> Copiar dados de acesso
                </button>
              </div>
            </Cartao>
          </div>
        </div>
      )}

      {aba === 'lancamentos' && <ListaLancamentos clienteId={cliente.id} origem="escritorio" />}
      {aba === 'das' && <PainelDas resumo={resumo} perfil="escritorio" />}
      {aba === 'relatorio' && <RelatorioMensal cliente={cliente} />}
      {aba === 'mensagens' && <Mensagens clienteId={cliente.id} perfil="escritorio" />}
      {aba === 'cadastro' && (
        <div className="space-y-5">
          <ClienteForm key={cliente.id} inicial={cliente} onSalvo={() => setAba('resumo')} onCancelar={() => setAba('resumo')} />
          <button
            onClick={() => {
              if (confirm('Excluir este cliente e todos os lançamentos, DAS e mensagens dele? Não dá para desfazer.')) {
                excluirCliente(cliente.id);
                onVoltar();
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-800"
          >
            <Trash2 className="h-4 w-4" /> Excluir cliente
          </button>
        </div>
      )}
    </div>
  );
}
