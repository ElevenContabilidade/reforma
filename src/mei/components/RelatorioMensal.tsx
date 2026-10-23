import { useState } from 'react';
import { Printer } from 'lucide-react';
import { SelectInput } from '../../components/Field';
import { formatarMoeda } from '../../lib/format';
import { imprimirArea } from '../lib/imprimir';
import { MESES, competencia, formatarData, opcoesDeMes, relatorioMensal, type LinhaRelatorio } from '../lib/regras';
import { useMei } from '../lib/store';
import type { ClienteMei } from '../lib/types';
import { Aviso, botaoSecundario } from './ui';

/** Relatório Mensal das Receitas Brutas (Res. CGSN 140/2018, art. 106, II e Anexo X). */
export function RelatorioMensal({ cliente }: { cliente: ClienteMei }) {
  const { base } = useMei();
  const [comp, setComp] = useState(() => competencia(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)));
  const rel = relatorioMensal(base.lancamentos, cliente.id, comp);
  const [ano, mes] = comp.split('-').map(Number);

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div className="w-56">
          <SelectInput value={comp} onChange={setComp} options={opcoesDeMes(18)} />
        </div>
        <button
          className={botaoSecundario}
          onClick={() => imprimirArea('#relatorio-mensal', `Relatório mensal ${comp} - ${cliente.nomeFantasia || cliente.nome}`)}
        >
          <Printer className="h-4 w-4" />
          Imprimir / PDF
        </button>
      </div>

      <div id="relatorio-mensal" className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-center text-base font-bold uppercase tracking-wide text-stone-900">
          Relatório Mensal das Receitas Brutas
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">Microempreendedor Individual · Res. CGSN 140/2018</p>

        <dl className="mt-5 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <Dado rotulo="CNPJ" valor={cliente.cnpj} />
          <Dado rotulo="Período de apuração" valor={`${MESES[mes - 1]} de ${ano}`} />
          <Dado rotulo="Empreendedor" valor={cliente.nome} />
          <Dado rotulo="Nome fantasia" valor={cliente.nomeFantasia || '-'} />
        </dl>

        <table className="mt-5 w-full text-sm">
          <tbody>
            <Bloco numero="I" titulo="Receita bruta mensal - revenda de mercadorias (comércio)" linha={rel.revenda} />
            <Bloco numero="II" titulo="Receita bruta mensal - venda de produtos industrializados (indústria)" linha={rel.industrializacao} />
            <Bloco numero="III" titulo="Receita bruta mensal - prestação de serviços" linha={rel.servico} />
            <tr className="border-t-2 border-stone-800">
              <td className="py-2 font-bold">IV - Total geral das receitas brutas no mês (I + II + III)</td>
              <td className="py-2 text-right font-bold tabular-nums">{formatarMoeda(rel.total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-10 grid gap-8 text-xs text-stone-600 sm:grid-cols-2">
          <div>
            <p>Local e data: Fortaleza/CE, {formatarData(new Date())}</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-1 w-64 border-t border-stone-500" />
            <p>Assinatura do empresário</p>
          </div>
        </div>

        <p className="mt-6 text-[11px] text-stone-500">
          Anexos obrigatórios a este relatório: notas fiscais de compras de mercadorias/insumos e das vendas e serviços
          emitidas no mês. Guardar por 5 anos.
        </p>
      </div>

      <Aviso tom="info">
        O relatório deve ser preenchido até o dia 20 do mês seguinte e ficar arquivado com as notas fiscais do mês. Não é
        transmitido, mas é exigido em fiscalização e serve de base para a DASN-SIMEI.
      </Aviso>
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-stone-500">{rotulo}:</dt>
      <dd className="font-medium text-stone-900">{valor}</dd>
    </div>
  );
}

function Bloco({ numero, titulo, linha }: { numero: string; titulo: string; linha: LinhaRelatorio }) {
  return (
    <>
      <tr className="border-t border-stone-300 bg-stone-50">
        <td colSpan={2} className="px-2 py-2 font-semibold text-stone-800">
          {numero} - {titulo}
        </td>
      </tr>
      <tr>
        <td className="py-1.5 pl-6 text-stone-600">Com dispensa de emissão de documento fiscal</td>
        <td className="py-1.5 text-right tabular-nums">{formatarMoeda(linha.semNota)}</td>
      </tr>
      <tr>
        <td className="py-1.5 pl-6 text-stone-600">Com documento fiscal emitido</td>
        <td className="py-1.5 text-right tabular-nums">{formatarMoeda(linha.comNota)}</td>
      </tr>
      <tr>
        <td className="py-1.5 pl-6 font-medium text-stone-800">Total</td>
        <td className="py-1.5 text-right font-medium tabular-nums">{formatarMoeda(linha.total)}</td>
      </tr>
    </>
  );
}
