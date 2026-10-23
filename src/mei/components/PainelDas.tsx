import { formatarMoeda } from '../../lib/format';
import { formatarData, rotuloCompetencia } from '../lib/regras';
import type { ResumoCliente } from '../lib/resumo';
import { useMei } from '../lib/store';
import type { Perfil } from '../lib/types';
import { SeloDas } from './ui';

export function PainelDas({ resumo, perfil }: { resumo: ResumoCliente; perfil: Perfil }) {
  const { marcarDas, base } = useMei();
  const { das, dasCompetencias, cliente } = resumo;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Parcela rotulo="INSS" valor={das.inss} />
        <Parcela rotulo="ICMS" valor={das.icms} />
        <Parcela rotulo="ISS" valor={das.iss} />
        <Parcela rotulo="Total mensal" valor={das.total} destaque />
      </div>

      {dasCompetencias.length === 0 ? (
        <p className="text-sm text-stone-500">Ainda não há competências encerradas neste ano.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-2">Competência</th>
                <th className="px-4 py-2">Vencimento</th>
                <th className="px-4 py-2">Situação</th>
                <th className="px-4 py-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {[...dasCompetencias].reverse().map((d) => {
                const registro = base.das.find((r) => r.clienteId === cliente.id && r.competencia === d.competencia);
                return (
                  <tr key={d.competencia}>
                    <td className="px-4 py-2.5 font-medium capitalize">{rotuloCompetencia(d.competencia)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-stone-600">{formatarData(d.vencimento)}</td>
                    <td className="px-4 py-2.5">
                      <SeloDas status={d.status} />
                      {registro?.pago && (
                        <span className="ml-2 text-xs text-stone-400">
                          informado por {registro.informadoPor === 'cliente' ? 'cliente' : 'escritório'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => marcarDas(cliente.id, d.competencia, !registro?.pago, perfil)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                      >
                        {registro?.pago ? 'Desfazer' : 'Marcar como pago'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-stone-500">
        Guia emitida no PGMEI (Portal do Simples Nacional) ou no app MEI. Valores com salário mínimo de{' '}
        {formatarMoeda(base.config.salarioMinimo)}. Em atraso: multa de 0,33% ao dia (até 20%) + Selic.
      </p>
    </div>
  );
}

function Parcela({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${destaque ? 'border-brand-200 bg-brand-50' : 'border-stone-200 bg-white'}`}>
      <p className="text-xs uppercase tracking-wide text-stone-500">{rotulo}</p>
      <p className={`mt-0.5 font-bold tabular-nums ${destaque ? 'text-brand-800' : 'text-stone-900'}`}>{formatarMoeda(valor)}</p>
    </div>
  );
}
