import type { AssuntoMensagem } from './types';

export const ASSUNTOS: { value: AssuntoMensagem; label: string }[] = [
  { value: 'emitir_nota', label: 'Ajuda para emitir nota fiscal' },
  { value: 'segunda_via_das', label: 'Guia do DAS / segunda via' },
  { value: 'parcelamento', label: 'Parcelar DAS em atraso' },
  { value: 'contratar_funcionario', label: 'Contratar funcionário' },
  { value: 'duvida', label: 'Outra dúvida' },
  { value: 'aviso', label: 'Aviso do escritório' },
];

export function rotuloAssunto(a: AssuntoMensagem): string {
  return ASSUNTOS.find((x) => x.value === a)?.label ?? a;
}
