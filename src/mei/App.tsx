import { useState, type FormEvent } from 'react';
import { Briefcase, Store } from 'lucide-react';
import { EleveLogo } from '../components/EleveLogo';
import { Field, TextInput } from '../components/Field';
import { gerarBaseDemo } from './lib/demo';
import { formatarCnpj } from './lib/regras';
import { MeiProvider, useMei } from './lib/store';
import { Aviso, botaoPrimario, botaoSecundario, inputBase } from './components/ui';
import { EscritorioApp } from './escritorio/EscritorioApp';
import { ClienteApp } from './cliente/ClienteApp';

export default function App() {
  return (
    <MeiProvider>
      <Roteador />
    </MeiProvider>
  );
}

function Roteador() {
  const { sessao } = useMei();
  if (sessao?.perfil === 'escritorio') return <EscritorioApp />;
  if (sessao?.perfil === 'cliente') return <ClienteApp clienteId={sessao.clienteId} />;
  return <Entrada />;
}

function Entrada() {
  const { base, entrar, substituirBase } = useMei();
  const [cnpj, setCnpj] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');

  function entrarCliente(e: FormEvent) {
    e.preventDefault();
    const digitos = cnpj.replace(/\D/g, '');
    const cliente = base.clientes.find(
      (c) => c.ativo && c.cnpj.replace(/\D/g, '') === digitos && c.codigoAcesso.toUpperCase() === codigo.trim().toUpperCase(),
    );
    if (!cliente) {
      setErro('CNPJ ou código de acesso não conferem. Peça o código à sua contabilidade.');
      return;
    }
    entrar({ perfil: 'cliente', clienteId: cliente.id });
  }

  return (
    <div className="min-h-screen bg-brand-900 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto w-40">
          <EleveLogo />
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold text-white">Gestão MEI</h1>
        <p className="mt-1 text-center text-sm text-stone-400">Faturamento, DAS, limite e obrigações do MEI num só lugar.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-brand-900">
              <Store className="h-5 w-5" />
              <h2 className="font-bold">Sou cliente MEI</h2>
            </div>
            <form className="mt-4 space-y-3" onSubmit={entrarCliente}>
              <Field label="CNPJ">
                <TextInput value={cnpj} onChange={(v) => setCnpj(formatarCnpj(v))} placeholder="00.000.000/0001-00" />
              </Field>
              <Field label="Código de acesso">
                <input className={inputBase + ' font-mono uppercase tracking-widest'} value={codigo} onChange={(e) => setCodigo(e.target.value)} />
              </Field>
              {erro && <Aviso tom="erro">{erro}</Aviso>}
              <button type="submit" className={botaoPrimario + ' w-full'}>
                Entrar
              </button>
            </form>
          </div>

          <div className="flex flex-col rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-brand-900">
              <Briefcase className="h-5 w-5" />
              <h2 className="font-bold">Sou do escritório</h2>
            </div>
            <p className="mt-4 flex-1 text-sm text-stone-600">
              Painel da carteira, alertas de limite, DAS e DASN, agenda de obrigações, relatório mensal e mensagens prontas para WhatsApp.
            </p>
            <button onClick={() => entrar({ perfil: 'escritorio' })} className={botaoPrimario + ' mt-4 w-full'}>
              Entrar na área do escritório
            </button>
          </div>
        </div>

        {base.clientes.length === 0 ? (
          <div className="mt-6 text-center">
            <button className={botaoSecundario} onClick={() => substituirBase(gerarBaseDemo())}>
              Carregar clientes de demonstração
            </button>
          </div>
        ) : (
          base.clientes.some((c) => c.id.startsWith('cli_demo_')) && (
            <p className="mt-6 text-center text-xs text-stone-400">
              Demonstração: entre como cliente com CNPJ {base.clientes[0].cnpj} e código {base.clientes[0].codigoAcesso}.
            </p>
          )
        )}

        <p className="mt-8 text-center text-[11px] text-stone-500">
          Versão de demonstração: os dados ficam salvos apenas neste navegador.
        </p>
      </div>
    </div>
  );
}
