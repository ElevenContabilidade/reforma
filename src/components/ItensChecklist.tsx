import { CATEGORIAS_ITENS, classesReducaoBadge, validarMix } from '../lib/reform';
import type { CategoriaReducao, DadosEmpresa, MixReceitaItem } from '../lib/types';
import { NumberInput } from './Field';
import { formatarPercentual } from '../lib/format';

interface Props {
  dados: DadosEmpresa;
  onChange: (dados: DadosEmpresa) => void;
}

export function ItensChecklist({ dados, onChange }: Props) {
  const { total, valido } = validarMix(dados.mixReceita);
  const restante = Math.max(100 - total, 0);

  const percentualDe = (categoria: CategoriaReducao) =>
    dados.mixReceita.find((m) => m.categoria === categoria)?.percentualReceita ?? 0;

  const setPercentual = (categoria: CategoriaReducao, valor: number) => {
    const outros = dados.mixReceita.filter((m) => m.categoria !== categoria);
    const novoMix: MixReceitaItem[] = valor > 0 ? [...outros, { categoria, percentualReceita: valor }] : outros;
    onChange({ ...dados, mixReceita: novoMix });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Produtos e serviços da empresa</h2>
        <span className={`text-sm font-medium ${valido ? 'text-slate-500' : 'text-rose-600'}`}>
          {formatarPercentual(total, 1)} da receita classificada
        </span>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        Marque o percentual da receita do cliente correspondente a cada categoria prevista na Reforma Tributária (LC 214/2025). O
        restante ({formatarPercentual(restante, 1)}) é tratado pela alíquota padrão de CBS/IBS, sem redução.
      </p>

      {!valido && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          A soma dos percentuais informados ultrapassa 100% da receita. Ajuste os valores abaixo.
        </div>
      )}

      <div className="space-y-4">
        {CATEGORIAS_ITENS.map((categoria) => {
          const ativo = percentualDe(categoria.id) > 0;
          return (
            <div
              key={categoria.id}
              className={`rounded-xl border p-4 transition ${ativo ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    checked={ativo}
                    onChange={(e) => setPercentual(categoria.id, e.target.checked ? percentualDe(categoria.id) || 10 : 0)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{categoria.nome}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${classesReducaoBadge(categoria.reducaoPercentual)}`}
                      >
                        {categoria.reducaoPercentual > 0 ? `−${categoria.reducaoPercentual}% na alíquota` : 'alíquota cheia'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{categoria.descricao}</p>
                    <p className="mt-1 text-xs text-slate-400">Ex.: {categoria.exemplos.join(', ')}</p>
                  </div>
                </div>
                {ativo && (
                  <div className="w-full shrink-0 sm:w-32">
                    <NumberInput value={percentualDe(categoria.id)} onChange={(v) => setPercentual(categoria.id, Math.min(v, 100))} min={0} max={100} suffix="%" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
