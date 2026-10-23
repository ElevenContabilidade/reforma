import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Field, SelectInput, TextInput } from '../../components/Field';
import { formatarMoeda } from '../../lib/format';
import { gerarCodigoAcesso } from '../lib/base';
import { ATIVIDADES, formatarCnpj, limiteDoAno, valorDas } from '../lib/regras';
import { useMei } from '../lib/store';
import type { ClienteMei } from '../lib/types';
import { Aviso, Cartao, botaoPrimario, botaoSecundario, inputBase } from '../components/ui';

export function ClienteForm({ inicial, onSalvo, onCancelar }: { inicial: ClienteMei; onSalvo: (c: ClienteMei) => void; onCancelar: () => void }) {
  const { base, salvarCliente } = useMei();
  const [c, setC] = useState(inicial);
  const set = <K extends keyof ClienteMei>(k: K, v: ClienteMei[K]) => setC((x) => ({ ...x, [k]: v }));

  const cnpjDigitos = c.cnpj.replace(/\D/g, '');
  const cnpjDuplicado = base.clientes.some((x) => x.id !== c.id && x.cnpj.replace(/\D/g, '') === cnpjDigitos);
  const valido = c.nome.trim() && cnpjDigitos.length === 14 && !cnpjDuplicado && c.dataAbertura;
  const das = valorDas(c.atividade, base.config.salarioMinimo);
  const limite = limiteDoAno(c, new Date().getFullYear(), base.config.limiteAnual);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valido) return;
        salvarCliente(c);
        onSalvo(c);
      }}
    >
      <Cartao>
        <h2 className="mb-4 font-semibold text-brand-900">Dados do MEI</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome empresarial" hint="Para MEI: nome completo do empresário + CPF">
            <TextInput value={c.nome} onChange={(v) => set('nome', v.toUpperCase())} />
          </Field>
          <Field label="Nome fantasia">
            <TextInput value={c.nomeFantasia} onChange={(v) => set('nomeFantasia', v)} />
          </Field>
          <Field label="CNPJ">
            <TextInput value={c.cnpj} onChange={(v) => set('cnpj', formatarCnpj(v))} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="Data de abertura" hint="Define o limite proporcional no ano de abertura">
            <input type="date" className={inputBase} value={c.dataAbertura} onChange={(e) => set('dataAbertura', e.target.value)} />
          </Field>
          <Field label="Tipo de atividade (composição do DAS)">
            <SelectInput value={c.atividade} onChange={(v) => set('atividade', v)} options={ATIVIDADES} />
          </Field>
          <Field label="Atividade / CNAE">
            <TextInput value={c.descricaoAtividade} onChange={(v) => set('descricaoAtividade', v)} placeholder="Ex: Cabeleireiros (9602-5/01)" />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={c.temFuncionario} onChange={(e) => set('temFuncionario', e.target.checked)} />
          Possui funcionário registrado (máximo de 1)
        </label>
        {cnpjDuplicado && (
          <div className="mt-4">
            <Aviso tom="erro">Já existe um cliente com este CNPJ.</Aviso>
          </div>
        )}
        <p className="mt-4 text-xs text-stone-500">
          DAS mensal: <strong>{formatarMoeda(das.total)}</strong> · Limite em {new Date().getFullYear()}: <strong>{formatarMoeda(limite)}</strong>
        </p>
      </Cartao>

      <Cartao>
        <h2 className="mb-4 font-semibold text-brand-900">Contato e acesso ao app</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp" hint="Com DDD. Usado nos botões de aviso.">
            <TextInput value={c.whatsapp} onChange={(v) => set('whatsapp', v)} placeholder="85 9 9999-9999" />
          </Field>
          <Field label="E-mail">
            <TextInput value={c.email} onChange={(v) => set('email', v)} />
          </Field>
          <Field label="Código de acesso do cliente" hint="O cliente entra com o CNPJ + este código.">
            <div className="flex gap-2">
              <input className={inputBase + ' font-mono tracking-widest'} value={c.codigoAcesso} onChange={(e) => set('codigoAcesso', e.target.value.toUpperCase())} />
              <button type="button" className={botaoSecundario} onClick={() => set('codigoAcesso', gerarCodigoAcesso())} title="Gerar outro código">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </Field>
          <Field label="Situação">
            <SelectInput
              value={c.ativo ? 'ativo' : 'inativo'}
              onChange={(v) => set('ativo', v === 'ativo')}
              options={[
                { value: 'ativo', label: 'Ativo na carteira' },
                { value: 'inativo', label: 'Inativo (baixado / migrou para ME)' },
              ]}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Observações internas">
            <textarea className={inputBase + ' min-h-20'} value={c.observacoes} onChange={(e) => set('observacoes', e.target.value)} />
          </Field>
        </div>
      </Cartao>

      <div className="flex gap-2">
        <button type="submit" disabled={!valido} className={botaoPrimario}>
          Salvar cliente
        </button>
        <button type="button" onClick={onCancelar} className={botaoSecundario}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
