import { useMemo, useRef, useState } from 'react';
import { Download, Plus, Search, Upload } from 'lucide-react';
import clsx from 'clsx';
import { Field, NumberInput, SelectInput, TextInput } from '../../components/Field';
import { formatarMoeda } from '../../lib/format';
import { baseVazia, novoCliente } from '../lib/base';
import { gerarBaseDemo } from '../lib/demo';
import { rotuloAssunto } from '../lib/assuntos';
import { MESES, competencia, formatarData, rotuloCompetencia, statusDas, vencimentoDas, vencimentoDasn, valorDas } from '../lib/regras';
import { resumirCliente } from '../lib/resumo';
import { useMei } from '../lib/store';
import type { BaseMei, ClienteMei } from '../lib/types';
import { Aviso, Cabecalho, Cartao, SeloDas, SeloFaixa, Vazio, botaoPrimario, botaoSecundario } from '../components/ui';
import { ClienteForm } from './ClienteForm';

export function Clientes({ onAbrirCliente }: { onAbrirCliente: (id: string) => void }) {
  const { base } = useMei();
  const [busca, setBusca] = useState('');
  const [novo, setNovo] = useState<ClienteMei | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, '');
    return base.clientes
      .filter(
        (c) =>
          !termo ||
          c.nome.toLowerCase().includes(termo) ||
          c.nomeFantasia.toLowerCase().includes(termo) ||
          (digitos && c.cnpj.replace(/\D/g, '').includes(digitos)),
      )
      .sort((a, b) => (a.nomeFantasia || a.nome).localeCompare(b.nomeFantasia || b.nome));
  }, [base.clientes, busca]);

  if (novo) {
    return (
      <div>
        <Cabecalho titulo="Novo cliente MEI" />
        <ClienteForm inicial={novo} onSalvo={(c) => onAbrirCliente(c.id)} onCancelar={() => setNovo(null)} />
      </div>
    );
  }

  return (
    <div>
      <Cabecalho
        titulo="Clientes"
        subtitulo={`${base.clientes.filter((c) => c.ativo).length} ativo(s) de ${base.clientes.length} cadastrado(s)`}
        acoes={
          <button className={botaoPrimario} onClick={() => setNovo(novoCliente())}>
            <Plus className="h-4 w-4" /> Novo cliente
          </button>
        }
      />
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          placeholder="Buscar por nome ou CNPJ"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      {lista.length === 0 ? (
        <Vazio>Nenhum cliente encontrado.</Vazio>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">CNPJ</th>
                <th className="px-4 py-2 text-right">Receita no ano</th>
                <th className="px-4 py-2 text-right">DAS</th>
                <th className="px-4 py-2">Limite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {lista.map((c) => {
                const r = resumirCliente(base, c);
                return (
                  <tr key={c.id} onClick={() => onAbrirCliente(c.id)} className={clsx('cursor-pointer hover:bg-stone-50', !c.ativo && 'opacity-50')}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-stone-900">{c.nomeFantasia || c.nome}</p>
                      {!c.ativo && <p className="text-xs text-stone-500">Inativo</p>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-stone-600">{c.cnpj}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(r.receitaAno)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(r.das.total)}</td>
                    <td className="px-4 py-2.5">
                      <SeloFaixa faixa={r.situacao.faixa} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface ItemAgenda {
  chave: string;
  data: Date;
  clienteId: string;
  cliente: string;
  obrigacao: string;
  detalhe: string;
  status: 'pago' | 'a_vencer' | 'vencido' | 'info';
}

/** Obrigações do mês escolhido para toda a carteira. */
export function Agenda({ onAbrirCliente }: { onAbrirCliente: (id: string) => void }) {
  const { base } = useMei();
  const hoje = new Date();
  const [mes, setMes] = useState(() => competencia(hoje));

  const opcoes = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - 3 + i, 1);
    return { value: competencia(d), label: `${MESES[d.getMonth()]} de ${d.getFullYear()}` };
  });

  const itens = useMemo(() => {
    const [ano, m] = mes.split('-').map(Number);
    const compDas = competencia(new Date(ano, m - 2, 1));
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const lista: ItemAgenda[] = [];
    for (const c of base.clientes.filter((x) => x.ativo)) {
      const nome = c.nomeFantasia || c.nome;
      if (compDas >= c.dataAbertura.slice(0, 7)) {
        const reg = base.das.find((d) => d.clienteId === c.id && d.competencia === compDas);
        const venc = vencimentoDas(compDas);
        lista.push({
          chave: `das-${c.id}`,
          data: venc,
          clienteId: c.id,
          cliente: nome,
          obrigacao: `DAS-MEI ${rotuloCompetencia(compDas)}`,
          detalhe: formatarMoeda(valorDas(c.atividade, base.config.salarioMinimo).total),
          status: statusDas(reg, compDas, agora),
        });
        lista.push({
          chave: `rel-${c.id}`,
          data: new Date(ano, m - 1, 20),
          clienteId: c.id,
          cliente: nome,
          obrigacao: `Relatório mensal de receitas ${rotuloCompetencia(compDas)}`,
          detalhe: `${base.lancamentos.filter((l) => l.clienteId === c.id && l.tipo === 'receita' && l.data.startsWith(compDas)).length} receita(s) lançada(s)`,
          status: 'info',
        });
        if (c.temFuncionario) {
          lista.push({
            chave: `folha-${c.id}`,
            data: new Date(ano, m - 1, 20),
            clienteId: c.id,
            cliente: nome,
            obrigacao: `Folha ${rotuloCompetencia(compDas)}: DCTFWeb + FGTS Digital`,
            detalhe: 'eSocial fechado até o dia 15',
            status: 'info',
          });
        }
      }
      if (m === 5 && Number(c.dataAbertura.slice(0, 4)) < ano) {
        const entregue = base.dasn.some((d) => d.clienteId === c.id && d.anoBase === ano - 1 && d.entregue);
        const venc = vencimentoDasn(ano - 1);
        lista.push({
          chave: `dasn-${c.id}`,
          data: venc,
          clienteId: c.id,
          cliente: nome,
          obrigacao: `DASN-SIMEI ano-base ${ano - 1}`,
          detalhe: 'Declaração anual',
          status: entregue ? 'pago' : venc < inicioHoje ? 'vencido' : 'a_vencer',
        });
      }
    }
    return lista.sort((a, b) => a.data.getTime() - b.data.getTime() || a.cliente.localeCompare(b.cliente));
  }, [base, mes]);

  return (
    <div>
      <Cabecalho titulo="Agenda de obrigações" subtitulo="Tudo o que vence no mês para a carteira MEI." />
      <div className="mb-4 w-56">
        <SelectInput value={mes} onChange={setMes} options={opcoes} />
      </div>
      {itens.length === 0 ? (
        <Vazio>Nenhuma obrigação neste mês.</Vazio>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Obrigação</th>
                <th className="px-4 py-2">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {itens.map((i) => (
                <tr key={i.chave} onClick={() => onAbrirCliente(i.clienteId)} className="cursor-pointer hover:bg-stone-50">
                  <td className="px-4 py-2.5 tabular-nums text-stone-600">{formatarData(i.data)}</td>
                  <td className="px-4 py-2.5 font-medium">{i.cliente}</td>
                  <td className="px-4 py-2.5">
                    {i.obrigacao}
                    <span className="block text-xs text-stone-500">{i.detalhe}</span>
                  </td>
                  <td className="px-4 py-2.5">{i.status === 'info' ? <span className="text-xs text-stone-400">Conferir</span> : <SeloDas status={i.status} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-stone-500">
        Vencimentos em fim de semana passam para o próximo dia útil. Feriados (nacionais e de Fortaleza) não são ajustados automaticamente.
      </p>
    </div>
  );
}

export function Solicitacoes({ onAbrirCliente }: { onAbrirCliente: (id: string) => void }) {
  const { base, atualizarMensagem } = useMei();
  const [mostrarResolvidas, setMostrarResolvidas] = useState(false);
  const lista = base.mensagens
    .filter((m) => m.de === 'cliente' && (mostrarResolvidas || !m.resolvida))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  return (
    <div>
      <Cabecalho titulo="Solicitações dos clientes" subtitulo="Pedidos enviados pelos clientes pelo app." />
      <label className="mb-4 flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={mostrarResolvidas} onChange={(e) => setMostrarResolvidas(e.target.checked)} />
        Mostrar resolvidas
      </label>
      {lista.length === 0 ? (
        <Vazio>Nenhuma solicitação em aberto.</Vazio>
      ) : (
        <ul className="space-y-3">
          {lista.map((m) => {
            const c = base.clientes.find((x) => x.id === m.clienteId);
            return (
              <li key={m.id} className={clsx('rounded-xl border bg-white p-4 shadow-sm', m.lida ? 'border-stone-200' : 'border-brand-300')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button onClick={() => onAbrirCliente(m.clienteId)} className="text-left">
                    <p className="font-semibold text-brand-900 hover:underline">{c?.nomeFantasia || c?.nome || 'Cliente removido'}</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{rotuloAssunto(m.assunto)}</p>
                  </button>
                  <span className="text-xs text-stone-400">{new Date(m.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{m.texto}</p>
                <div className="mt-3 flex gap-3 text-xs font-semibold">
                  <button onClick={() => onAbrirCliente(m.clienteId)} className="text-brand-600 hover:underline">
                    Responder
                  </button>
                  {!m.resolvida && (
                    <button onClick={() => atualizarMensagem(m.id, { resolvida: true, lida: true })} className="text-emerald-700 hover:underline">
                      Marcar como resolvida
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Configuracoes() {
  const { base, atualizarConfig, substituirBase } = useMei();
  const arquivo = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState('');

  function exportar() {
    const blob = new Blob([JSON.stringify(base, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gestao-mei-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  async function importar(file: File) {
    try {
      const dados = JSON.parse(await file.text()) as BaseMei;
      if (!Array.isArray(dados.clientes) || !Array.isArray(dados.lancamentos)) throw new Error();
      if (confirm(`Substituir os dados atuais por este backup (${dados.clientes.length} clientes)?`)) {
        substituirBase({ ...baseVazia(), ...dados });
        setErro('');
      }
    } catch {
      setErro('Arquivo inválido. Use um backup gerado por este app.');
    }
  }

  return (
    <div className="space-y-5">
      <Cabecalho titulo="Configurações" />
      <Cartao>
        <h2 className="mb-4 font-semibold text-brand-900">Escritório</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do escritório">
            <TextInput value={base.config.nomeEscritorio} onChange={(v) => atualizarConfig({ nomeEscritorio: v })} />
          </Field>
          <Field label="WhatsApp do escritório" hint="Botão 'Falar no WhatsApp' da área do cliente.">
            <TextInput value={base.config.whatsappEscritorio} onChange={(v) => atualizarConfig({ whatsappEscritorio: v })} />
          </Field>
        </div>
      </Cartao>

      <Cartao>
        <h2 className="mb-4 font-semibold text-brand-900">Parâmetros legais</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Salário mínimo vigente" hint="Base do INSS no DAS-MEI (5%, ou 12% para caminhoneiro).">
            <NumberInput value={base.config.salarioMinimo} onChange={(v) => atualizarConfig({ salarioMinimo: v })} step={0.01} />
          </Field>
          <Field label="Limite anual do MEI" hint="LC 123/2006, art. 18-A. Caminhoneiro: R$ 251.600,00 fixo.">
            <NumberInput value={base.config.limiteAnual} onChange={(v) => atualizarConfig({ limiteAnual: v })} step={100} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Se o limite do MEI for alterado por lei complementar, ajuste aqui e todos os painéis recalculam na hora.
        </p>
      </Cartao>

      <Cartao>
        <h2 className="mb-2 font-semibold text-brand-900">Dados</h2>
        <p className="mb-4 text-sm text-stone-500">Nesta versão os dados ficam salvos neste navegador. Faça backup com frequência.</p>
        <div className="flex flex-wrap gap-2">
          <button className={botaoSecundario} onClick={exportar}>
            <Download className="h-4 w-4" /> Exportar backup
          </button>
          <button className={botaoSecundario} onClick={() => arquivo.current?.click()}>
            <Upload className="h-4 w-4" /> Importar backup
          </button>
          <input
            ref={arquivo}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importar(f);
              e.target.value = '';
            }}
          />
          <button
            className={botaoSecundario}
            onClick={() => {
              if (confirm('Substituir tudo pelos dados de demonstração?')) substituirBase(gerarBaseDemo());
            }}
          >
            Carregar demonstração
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            onClick={() => {
              if (confirm('Apagar todos os clientes e lançamentos deste navegador?')) substituirBase({ ...baseVazia(), config: base.config });
            }}
          >
            Apagar tudo
          </button>
        </div>
        {erro && (
          <div className="mt-3">
            <Aviso tom="erro">{erro}</Aviso>
          </div>
        )}
      </Cartao>
    </div>
  );
}
