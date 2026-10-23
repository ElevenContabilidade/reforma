import { useEffect, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import clsx from 'clsx';
import { SelectInput } from '../../components/Field';
import { useMei } from '../lib/store';
import type { AssuntoMensagem, Perfil } from '../lib/types';
import { ASSUNTOS, rotuloAssunto } from '../lib/assuntos';
import { Vazio, botaoPrimario, inputBase } from './ui';

/** Conversa entre escritório e um cliente, vista por qualquer um dos lados. */
export function Mensagens({ clienteId, perfil }: { clienteId: string; perfil: Perfil }) {
  const { base, enviarMensagem, atualizarMensagem } = useMei();
  const [assunto, setAssunto] = useState<AssuntoMensagem>(perfil === 'cliente' ? 'duvida' : 'aviso');
  const [texto, setTexto] = useState('');

  const lista = base.mensagens
    .filter((m) => m.clienteId === clienteId)
    .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));

  // Ao abrir a conversa, marca como lidas as mensagens recebidas.
  useEffect(() => {
    lista.filter((m) => m.de !== perfil && !m.lida).forEach((m) => atualizarMensagem(m.id, { lida: true }));
  }, [lista, perfil, atualizarMensagem]);

  const opcoes = perfil === 'cliente' ? ASSUNTOS.filter((a) => a.value !== 'aviso') : ASSUNTOS;

  return (
    <div className="space-y-4">
      {lista.length === 0 ? (
        <Vazio>Nenhuma mensagem ainda.</Vazio>
      ) : (
        <ul className="space-y-3">
          {lista.map((m) => {
            const minha = m.de === perfil;
            return (
              <li key={m.id} className={clsx('flex', minha ? 'justify-end' : 'justify-start')}>
                <div
                  className={clsx(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                    minha ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm border border-stone-200 bg-white text-stone-800',
                  )}
                >
                  <p className={clsx('text-[11px] font-semibold uppercase tracking-wide', minha ? 'text-brand-100' : 'text-brand-600')}>
                    {rotuloAssunto(m.assunto)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{m.texto}</p>
                  <div className={clsx('mt-2 flex items-center gap-3 text-[11px]', minha ? 'text-brand-100' : 'text-stone-400')}>
                    <span>{new Date(m.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    {m.de === 'cliente' &&
                      (m.resolvida ? (
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Resolvido
                        </span>
                      ) : perfil === 'escritorio' ? (
                        <button onClick={() => atualizarMensagem(m.id, { resolvida: true })} className="font-semibold text-brand-600 hover:underline">
                          Marcar como resolvido
                        </button>
                      ) : (
                        <span>Em atendimento</span>
                      ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="space-y-3 rounded-xl border border-stone-200 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          enviarMensagem({ clienteId, de: perfil, assunto, texto: texto.trim() });
          setTexto('');
        }}
      >
        <SelectInput value={assunto} onChange={setAssunto} options={opcoes} />
        <textarea
          className={inputBase + ' min-h-24'}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={perfil === 'cliente' ? 'Escreva sua solicitação para a contabilidade' : 'Escreva o aviso para o cliente'}
        />
        <button type="submit" disabled={!texto.trim()} className={botaoPrimario}>
          <Send className="h-4 w-4" />
          Enviar
        </button>
      </form>
    </div>
  );
}
