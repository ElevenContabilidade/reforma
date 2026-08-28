import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Trophy, TrendingDown, Info } from 'lucide-react';
import type { DadosEmpresa, ResultadoRegime } from '../lib/types';
import { calcularTodosRegimes } from '../lib/calculators';
import { cronogramaTransicao } from '../lib/reform';
import { formatarMoeda, formatarPercentual } from '../lib/format';

interface Props {
  dados: DadosEmpresa;
}

const CORES: Record<ResultadoRegime['regime'], string> = {
  simples: '#0d9488',
  'simples-hibrido': '#2563eb',
  presumido: '#d97706',
  real: '#dc2626',
};

export function Dashboard({ dados }: Props) {
  const resultados = useMemo(() => calcularTodosRegimes(dados), [dados]);
  const [selecionado, setSelecionado] = useState<ResultadoRegime['regime'] | null>(null);

  const melhor = resultados[0];
  const pior = resultados[resultados.length - 1];
  const economiaAnual = pior.totalAnual - melhor.totalAnual;
  const transicao = cronogramaTransicao(dados.anoSimulacao);

  const dadosGrafico = resultados.map((r) => ({
    nome: r.nomeExibicao,
    regime: r.regime,
    total: Number(r.totalMensal.toFixed(2)),
  }));

  const detalhado = resultados.find((r) => r.regime === selecionado) ?? melhor;

  if (dados.faturamentoMensal <= 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
        Informe o faturamento mensal do cliente na aba "Dados da empresa" para ver a comparação de regimes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold-300 bg-gradient-to-br from-gold-50 to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-brand-600 p-2 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Melhor opção para {dados.nomeCliente || 'este cliente'} em {dados.anoSimulacao}</p>
              <p className="text-xl font-semibold text-stone-900">{melhor.nomeExibicao}</p>
              <p className="text-sm text-stone-600">
                {formatarMoeda(melhor.totalMensal)}/mês · alíquota efetiva de {formatarPercentual(melhor.aliquotaEfetivaTotal)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
            <TrendingDown className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs text-stone-500">Economia frente à pior opção ({pior.nomeExibicao})</p>
              <p className="text-base font-semibold text-emerald-700">{formatarMoeda(economiaAnual)}/ano</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {resultados.map((r, idx) => (
          <button
            key={r.regime}
            onClick={() => setSelecionado(r.regime)}
            className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              detalhado.regime === r.regime ? 'border-brand-400 ring-2 ring-brand-500/20' : 'border-stone-200 bg-white'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CORES[r.regime] }} />
              {idx === 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Recomendado
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500">{r.nomeExibicao}</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{formatarMoeda(r.totalMensal)}</p>
            <p className="text-xs text-stone-400">{formatarMoeda(r.totalAnual)}/ano · {formatarPercentual(r.aliquotaEfetivaTotal)}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-stone-900">Carga tributária mensal por regime</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#475569' }} interval={0} angle={-10} textAnchor="end" height={60} />
              <YAxis tickFormatter={(v) => formatarMoeda(v)} tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
              <Tooltip formatter={(v) => formatarMoeda(Number(v ?? 0))} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {dadosGrafico.map((d) => (
                  <Cell key={d.regime} fill={CORES[d.regime]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {resultados.map((r) => (
            <button
              key={r.regime}
              onClick={() => setSelecionado(r.regime)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                detalhado.regime === r.regime ? 'text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
              style={detalhado.regime === r.regime ? { backgroundColor: CORES[r.regime] } : undefined}
            >
              {r.nomeExibicao}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{transicao.descricao}</span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-500">
              <th className="py-2 font-medium">Tributo</th>
              <th className="py-2 font-medium">Detalhe</th>
              <th className="py-2 text-right font-medium">Mensal</th>
              <th className="py-2 text-right font-medium">Anual</th>
            </tr>
          </thead>
          <tbody>
            {detalhado.linhas.map((l) => (
              <tr key={l.tributo} className="border-b border-stone-100 last:border-0">
                <td className="py-2.5 font-medium text-stone-800">{l.tributo}</td>
                <td className="py-2.5 text-stone-500">{l.descricao ?? '—'}</td>
                <td className="py-2.5 text-right text-stone-700">{formatarMoeda(l.valorMensal)}</td>
                <td className="py-2.5 text-right text-stone-700">{formatarMoeda(l.valorAnual)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-stone-200 font-semibold text-stone-900">
              <td className="py-3">Total</td>
              <td className="py-3 text-stone-500 font-normal">{formatarPercentual(detalhado.aliquotaEfetivaTotal)} da receita</td>
              <td className="py-3 text-right">{formatarMoeda(detalhado.totalMensal)}</td>
              <td className="py-3 text-right">{formatarMoeda(detalhado.totalAnual)}</td>
            </tr>
          </tfoot>
        </table>

        {detalhado.observacoes.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-stone-100 pt-4">
            {detalhado.observacoes.map((obs, i) => (
              <li key={i} className="flex gap-2 text-xs text-stone-500">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-stone-400" />
                {obs}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
