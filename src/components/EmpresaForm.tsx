import type { DadosEmpresa } from '../lib/types';
import { Field, NumberInput, SelectInput, TextInput } from './Field';
import { fatorR, FATOR_R_LIMITE } from '../lib/simplesTables';
import { formatarPercentual } from '../lib/format';

interface Props {
  dados: DadosEmpresa;
  onChange: (dados: DadosEmpresa) => void;
}

const ANOS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

export function EmpresaForm({ dados, onChange }: Props) {
  const update = <K extends keyof DadosEmpresa>(campo: K, valor: DadosEmpresa[K]) => {
    onChange({ ...dados, [campo]: valor });
  };

  const fr = fatorR(dados.folhaPagamento12m, dados.rbt12);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Dados do cliente</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome / Razão social">
            <TextInput value={dados.nomeCliente} onChange={(v) => update('nomeCliente', v)} placeholder="Ex: Padaria Bom Pão Ltda" />
          </Field>
          <Field label="CNPJ">
            <TextInput value={dados.cnpj} onChange={(v) => update('cnpj', v)} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="Setor de atividade">
            <SelectInput
              value={dados.setor}
              onChange={(v) => update('setor', v)}
              options={[
                { value: 'comercio', label: 'Comércio' },
                { value: 'industria', label: 'Indústria' },
                { value: 'servicos', label: 'Serviços' },
              ]}
            />
          </Field>
          <Field label="Ano de simulação (transição da reforma)" hint="Define o estágio de substituição de PIS/COFINS/ICMS/ISS por CBS/IBS">
            <SelectInput<string>
              value={String(dados.anoSimulacao)}
              onChange={(v) => update('anoSimulacao', Number(v))}
              options={ANOS.map((a) => ({ value: String(a), label: String(a) }))}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Simples Nacional</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Anexo do Simples Nacional" hint={dados.atividadeSujeitaFatorR ? 'Calculado automaticamente pelo Fator R' : undefined}>
            <SelectInput
              value={dados.anexoSimples}
              onChange={(v) => update('anexoSimples', v)}
              options={[
                { value: 'I', label: 'Anexo I — Comércio' },
                { value: 'II', label: 'Anexo II — Indústria' },
                { value: 'III', label: 'Anexo III — Serviços (Fator R ≥ 28%)' },
                { value: 'IV', label: 'Anexo IV — Serviços específicos (sem CPP no DAS)' },
                { value: 'V', label: 'Anexo V — Serviços (Fator R < 28%)' },
              ]}
            />
          </Field>
          <Field label="Atividade sujeita ao Fator R?" hint="Alterna automaticamente entre Anexo III e V">
            <div className="flex h-[38px] items-center gap-2">
              <input
                type="checkbox"
                id="fatorR"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={dados.atividadeSujeitaFatorR}
                onChange={(e) => update('atividadeSujeitaFatorR', e.target.checked)}
              />
              <label htmlFor="fatorR" className="text-sm text-slate-600">
                Sim, aplicar regra do Fator R
              </label>
            </div>
          </Field>
        </div>
        {dados.atividadeSujeitaFatorR && (
          <p className="mt-3 text-xs text-slate-500">
            Fator R atual: <span className="font-semibold text-slate-700">{formatarPercentual(fr, 1)}</span> — limite {FATOR_R_LIMITE}%.{' '}
            {fr >= FATOR_R_LIMITE ? 'Enquadra em Anexo III.' : 'Enquadra em Anexo V.'}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Dados financeiros</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Faturamento mensal" hint="Receita bruta do mês de referência">
            <NumberInput value={dados.faturamentoMensal} onChange={(v) => update('faturamentoMensal', v)} min={0} suffix="R$" />
          </Field>
          <Field label="RBT12" hint="Receita bruta acumulada nos últimos 12 meses">
            <NumberInput value={dados.rbt12} onChange={(v) => update('rbt12', v)} min={0} suffix="R$" />
          </Field>
          <Field label="Folha de pagamento (12 meses)" hint="Salários + encargos + pró-labore, para o Fator R">
            <NumberInput value={dados.folhaPagamento12m} onChange={(v) => update('folhaPagamento12m', v)} min={0} suffix="R$" />
          </Field>
          <Field label="Margem de lucro estimada (Lucro Real)" hint="% da receita que representa o lucro real">
            <NumberInput value={dados.margemLucroReal} onChange={(v) => update('margemLucroReal', v)} min={0} max={100} suffix="%" />
          </Field>
          <Field label="Compras/insumos com direito a crédito" hint="% da receita gasta em compras que geram crédito de PIS/COFINS/CBS/IBS/ICMS">
            <NumberInput value={dados.percentualCompraInsumos} onChange={(v) => update('percentualCompraInsumos', v)} min={0} max={100} suffix="%" />
          </Field>
          <Field label="Alíquota efetiva ICMS/ISS atual" hint="Percentual médio efetivo já apurado pelo cliente (líquido de créditos)">
            <NumberInput value={dados.aliquotaEfetivaIcmsIss} onChange={(v) => update('aliquotaEfetivaIcmsIss', v)} min={0} max={100} suffix="%" />
          </Field>
        </div>
      </section>
    </div>
  );
}
