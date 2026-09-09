import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Scale, PackageSearch } from 'lucide-react';
import type { DadosEmpresa, ResultadoRegime } from '../lib/types';
import { calcularTodosRegimes } from '../lib/calculators';
import { CORES_REGIME as CORES } from '../lib/reform';
import { estimarCreditoMensalCompras } from '../lib/creditos';
import { formatarMoeda, formatarPercentual } from '../lib/format';
import { SelectInput } from './Field';

interface Props {
  dados: DadosEmpresa;
}

function GraficoComparativo({ cenarioA, cenarioB, valorA, valorB }: { cenarioA: ResultadoRegime; cenarioB: ResultadoRegime; valorA: number; valorB: number }) {
  const data = [
    { nome: cenarioA.nomeExibicao, valor: Number(valorA.toFixed(2)), regime: cenarioA.regime },
    { nome: cenarioB.nomeExibicao, valor: Number(valorB.toFixed(2)), regime: cenarioB.regime },
  ];
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="nome"
            type="category"
            width={150}
            tick={{ fontSize: 11, fill: '#57534e' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={(v) => formatarMoeda(Number(v ?? 0))} cursor={{ fill: '#f5f5f4' }} />
          <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((d) => (
              <Cell key={d.regime} fill={CORES[d.regime]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CartaoCenario({ resultado, credito }: { resultado: ResultadoRegime; credito: number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CORES[resultado.regime] }} />
        <p className="truncate text-sm font-medium text-stone-700">{resultado.nomeExibicao}</p>
      </div>
      <p className="text-xl font-semibold text-stone-900">{formatarMoeda(resultado.totalMensal)}</p>
      <p className="text-xs text-stone-400">
        {formatarMoeda(resultado.totalAnual)}/ano · {formatarPercentual(resultado.aliquotaEfetivaTotal)}
      </p>
      <p className="mt-2 border-t border-stone-200 pt-2 text-xs text-stone-500">
        Crédito recuperável nas compras: <span className="font-medium text-stone-700">{formatarMoeda(credito)}/mês</span>
      </p>
    </div>
  );
}

export function Comparacao({ dados }: Props) {
  const resultados = useMemo(() => calcularTodosRegimes(dados), [dados]);
  const [idA, setIdA] = useState<ResultadoRegime['regime']>(resultados[0].regime);
  const [idB, setIdB] = useState<ResultadoRegime['regime']>(resultados[resultados.length - 1].regime);

  const cenarioA = resultados.find((r) => r.regime === idA) ?? resultados[0];
  const cenarioB = resultados.find((r) => r.regime === idB) ?? resultados[resultados.length - 1];

  const creditoA = estimarCreditoMensalCompras(dados, cenarioA.regime);
  const creditoB = estimarCreditoMensalCompras(dados, cenarioB.regime);

  const diferencaMensal = cenarioB.totalMensal - cenarioA.totalMensal;
  const maisBarato = diferencaMensal >= 0 ? cenarioA : cenarioB;
  const maisCaro = diferencaMensal >= 0 ? cenarioB : cenarioA;
  const diferencaAbsMensal = Math.abs(diferencaMensal);
  const diferencaAbsAnual = diferencaAbsMensal * 12;
  const diferencaPercentual = maisCaro.totalMensal > 0 ? (diferencaAbsMensal / maisCaro.totalMensal) * 100 : 0;

  const options = resultados.map((r) => ({ value: r.regime, label: r.nomeExibicao }));

  if (dados.faturamentoMensal <= 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
        <PackageSearch className="h-8 w-8 text-stone-300" />
        Informe o faturamento mensal do cliente na aba "Dados da empresa" para comparar os regimes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-stone-900">Comparação de regimes</h2>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Scale className="h-4 w-4 text-brand-600" />
          <h3 className="text-base font-semibold text-stone-900">Cenário A x Cenário B</h3>
        </div>
        <p className="mb-5 text-sm text-stone-500">Escolha dois regimes para comparar lado a lado o resultado para {dados.nomeCliente || 'o cliente'}.</p>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">Cenário A</span>
            <SelectInput value={idA} onChange={setIdA} options={options} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">Cenário B</span>
            <SelectInput value={idB} onChange={setIdB} options={options} />
          </label>
        </div>

        {diferencaAbsMensal > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm">
            <span className="font-medium text-stone-700">{maisBarato.nomeExibicao}</span>
            <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
            <span className="text-stone-600">
              economia de <span className="font-semibold text-brand-700">{formatarMoeda(diferencaAbsMensal)}/mês</span> (
              {formatarMoeda(diferencaAbsAnual)}/ano · {formatarPercentual(diferencaPercentual, 1)} a menos) frente a{' '}
              {maisCaro.nomeExibicao}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CartaoCenario resultado={cenarioA} credito={creditoA} />
          <CartaoCenario resultado={cenarioB} credito={creditoB} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Carga tributária mensal</p>
            <GraficoComparativo cenarioA={cenarioA} cenarioB={cenarioB} valorA={cenarioA.totalMensal} valorB={cenarioB.totalMensal} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Crédito recuperável nas compras/insumos</p>
            <GraficoComparativo cenarioA={cenarioA} cenarioB={cenarioB} valorA={creditoA} valorB={creditoB} />
            {creditoA === 0 && creditoB === 0 && (
              <p className="mt-1.5 text-xs text-stone-400">Nenhum dos dois cenários gera crédito recuperável sobre compras/insumos.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
