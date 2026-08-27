import type { DadosEmpresa, ResultadoRegime } from '../types';
import { calcularSimplesPuro } from './simples';
import { calcularSimplesHibrido } from './simplesHibrido';
import { calcularLucroPresumido } from './presumido';
import { calcularLucroReal } from './real';

export { calcularSimplesPuro, calcularSimplesHibrido, calcularLucroPresumido, calcularLucroReal };

export function calcularTodosRegimes(dados: DadosEmpresa): ResultadoRegime[] {
  const resultados = [
    calcularSimplesPuro(dados),
    calcularSimplesHibrido(dados),
    calcularLucroPresumido(dados),
    calcularLucroReal(dados),
  ];
  return resultados.sort((a, b) => a.totalAnual - b.totalAnual);
}
