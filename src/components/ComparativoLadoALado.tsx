import { useState } from 'react';
import { ArrowRight, Scale } from 'lucide-react';
import type { DadosEmpresa, ResultadoRegime } from '../lib/types';
import { CORES_REGIME as CORES } from '../lib/reform';
import { estimarCreditoMensalCompras } from '../lib/creditos';
import { formatarMoeda, formatarPercentual } from '../lib/format';
import { SelectInput } from './Field';

interface Props {
  dados: DadosEmpresa;
  resultados: ResultadoRegime[];
}

function BarraComparativa({ valorA, valorB, corA, corB }: { valorA: number; valorB: number; corA: string; corB: string }) {
  const maior = Math.max(valorA, valorB, 1);
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full" style={{ width: `${(valorA / maior) * 100}%`, backgroundColor: corA }} />
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full" style={{ width: `${(valorB / maior) * 100}%`, backgroundColor: corB }} />
      </div>
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

export function ComparativoLadoALado({ dados, resultados }: Props) {
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

  return (
    <div className="print-avoid-break rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Scale className="h-4 w-4 text-brand-600" />
        <h3 className="text-base font-semibold text-stone-900">Comparação lado a lado</h3>
      </div>

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

      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Carga tributária mensal</p>
        <BarraComparativa valorA={cenarioA.totalMensal} valorB={cenarioB.totalMensal} corA={CORES[cenarioA.regime]} corB={CORES[cenarioB.regime]} />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Crédito recuperável nas compras/insumos</p>
        <BarraComparativa valorA={creditoA} valorB={creditoB} corA={CORES[cenarioA.regime]} corB={CORES[cenarioB.regime]} />
        {creditoA === 0 && creditoB === 0 && (
          <p className="mt-1.5 text-xs text-stone-400">Nenhum dos dois cenários gera crédito recuperável sobre compras/insumos.</p>
        )}
      </div>
    </div>
  );
}
