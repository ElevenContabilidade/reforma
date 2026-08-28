import cclasstribData from './data/cclasstrib.json';
import anexosData from './data/anexos.json';
import indopData from './data/indop.json';
import ncmData from './data/ncm.json';
import nbsData from './data/nbs.json';
import profissoesReguladasData from './data/profissoesReguladas.json';
import cnaeData from './data/cnae.json';
import lc116Data from './data/lc116.json';
import cnaeNbsLinksData from './data/cnaeNbsLinks.json';
import { normalizar } from './text';

/**
 * Dados oficiais da Reforma Tributária (LC 214/2025, redação da LC 227/2026),
 * extraídos de: tabela oficial de CST/cClassTrib do IBS/CBS (145 situações
 * tributárias), Nomenclatura Brasileira de Serviços (NBS, Anexo I da Portaria
 * Conjunta RFB/SCS), Tabela NCM vigente, tabela de Indicador de Operação
 * (INDOP), os Anexos I, II, III, VII, VIII e IX da LC 214/2025 (itens com
 * redução de alíquota vinculados a NCM/NBS) e a tabela de correlação
 * CNAE × Código de Serviço (LC 116/2003) × NBS.
 *
 * Cobertura conhecida: os Anexos IV, V, VI, X a XV são reconhecidos pela
 * tabela de cClassTrib (regra e percentual de redução), mas a lista de itens
 * desses anexos ainda não está carregada nesta base — apenas I, II, III,
 * VII, VIII e IX têm os itens individuais mapeados.
 */

export interface CClassTribRow {
  cst: number;
  cstDescricao: string;
  cClassTrib: number;
  nome: string;
  descricao: string;
  lcRedacao: string | null;
  baseLegalTexto: string | null;
  tipoAliquota: string | null;
  pRedIBS: number;
  pRedCBS: number;
  dIniVig: string | null;
  dFimVig: string | null;
  anexo: number | null;
  link: string | null;
  documentosAceitos: string[];
}

export interface AnexoItemRow {
  anexo: number;
  tipo: 'NCM' | 'NBS';
  item: number;
  descricao: string;
  codigos: string[];
}

export interface IndOpRow {
  codigo: string;
  tipoOperacao: string;
  caracteristica: string;
  local: string;
  dispositivoLegal: string;
}

export interface NcmRow {
  codigo: string;
  descricao: string;
  nivel: number;
}

export interface NbsRow {
  codigo: string;
  descricao: string;
}

export interface ProfissaoRegulada {
  prefixo: string;
  profissao: string;
}

export interface CnaeRow {
  codigo: string;
  descricao: string;
}

export interface Lc116Row {
  codigo: string;
  descricao: string;
}

export interface CnaeNbsLink {
  item: string;
  nbs: string;
  cnae: string;
}

export const CCLASSTRIB: CClassTribRow[] = cclasstribData as CClassTribRow[];
export const ANEXOS: AnexoItemRow[] = anexosData as AnexoItemRow[];
export const INDOP: IndOpRow[] = indopData as IndOpRow[];
export const NCM: NcmRow[] = ncmData as NcmRow[];
export const NBS: NbsRow[] = nbsData as NbsRow[];
export const PROFISSOES_REGULADAS: ProfissaoRegulada[] = profissoesReguladasData as ProfissaoRegulada[];
export const CNAE: CnaeRow[] = cnaeData as CnaeRow[];
export const LC116: Lc116Row[] = lc116Data as Lc116Row[];
export const CNAE_NBS_LINKS: CnaeNbsLink[] = cnaeNbsLinksData as CnaeNbsLink[];

const NBS_POR_CODIGO = new Map(NBS.map((n) => [n.codigo, n]));
const CNAE_POR_CODIGO = new Map(CNAE.map((c) => [c.codigo, c]));

/** Retorna os CNAEs vinculados a um código NBS, conforme a tabela de correlação CNAE x LC 116 x NBS. */
export function cnaesRelacionados(codigoNbs: string): CnaeRow[] {
  const codigos = new Set(CNAE_NBS_LINKS.filter((l) => l.nbs === codigoNbs).map((l) => l.cnae));
  return [...codigos].map((c) => CNAE_POR_CODIGO.get(c)).filter((c): c is CnaeRow => Boolean(c));
}

/** cClassTrib da redução de 30% para profissões intelectuais regulamentadas (art. 127 da LC 214/2025). */
const CCLASSTRIB_PROFISSAO_REGULADA = CCLASSTRIB.find((c) => c.cClassTrib === 200052)!;

/** Encontra a profissão regulamentada (art. 127) cujo prefixo de NBS bate com o código informado. */
export function encontrarProfissaoRegulada(codigoNbs: string): ProfissaoRegulada | undefined {
  return PROFISSOES_REGULADAS.find((p) => codigoNbs.startsWith(p.prefixo));
}

const ANEXOS_ROMANOS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX',
  10: 'X', 11: 'XI', 12: 'XII', 13: 'XIII', 14: 'XIV', 15: 'XV',
};

export function anexoRomano(numero: number): string {
  return ANEXOS_ROMANOS[numero] ?? String(numero);
}

/** cClassTrib "padrão" (situação 1 - Tributação integral), usado quando nenhum item/anexo específico é encontrado. */
export const CCLASSTRIB_PADRAO: CClassTribRow = CCLASSTRIB.find((c) => c.cClassTrib === 1)!;

/**
 * Encontra o item do anexo (com redução conhecida) cujo código bate com o
 * NCM/NBS informado — por igualdade exata ou por prefixo (já que os anexos
 * às vezes listam apenas o capítulo/posição, ex.: "02.01"). Vários itens de
 * um mesmo anexo podem compartilhar o mesmo código "genérico" (ex.:
 * nutrição, vigilância sanitária e epidemiologia caem todos no mesmo NBS
 * "Outros serviços de saúde..."); quando a descrição do item selecionado é
 * informada, ela desempata a favor do item específico que o usuário viu.
 */
export function encontrarItemAnexo(codigo: string, tipo: 'NCM' | 'NBS', descricaoSelecionada?: string): AnexoItemRow | undefined {
  const codigoLimpo = codigo.replace(/\s/g, '');
  const candidatos = ANEXOS.filter(
    (a) =>
      a.tipo === tipo &&
      a.codigos.some((c) => {
        const cLimpo = c.replace(/\s/g, '');
        return codigoLimpo === cLimpo || codigoLimpo.startsWith(cLimpo) || cLimpo.startsWith(codigoLimpo);
      }),
  );
  if (candidatos.length <= 1) return candidatos[0];
  if (descricaoSelecionada) {
    const exato = candidatos.find((a) => a.descricao === descricaoSelecionada);
    if (exato) return exato;
  }
  return candidatos[0];
}

/**
 * Retorna a(s) linha(s) de cClassTrib associadas a um número de anexo.
 * Quando há mais de uma (ex.: venda geral x aquisição pela administração
 * pública), prioriza a hipótese de venda/fornecimento em geral.
 */
export function cclasstribPorAnexo(anexo: number): CClassTribRow[] {
  return CCLASSTRIB.filter((c) => c.anexo === anexo).sort((a, b) => {
    const aPublico = /administra[cç][ãa]o p[uú]blica|CEBAS/i.test(a.nome);
    const bPublico = /administra[cç][ãa]o p[uú]blica|CEBAS/i.test(b.nome);
    return Number(aPublico) - Number(bPublico);
  });
}

export interface FichaTributaria {
  codigo: string;
  descricao: string;
  tipo: 'NCM' | 'NBS';
  itemAnexo: AnexoItemRow | null;
  profissaoRegulada: ProfissaoRegulada | null;
  classificacao: CClassTribRow;
  classificacoesAlternativas: CClassTribRow[];
}

/** Monta a ficha tributária completa para um código de NCM ou NBS. */
export function montarFicha(codigo: string, descricao: string, tipo: 'NCM' | 'NBS'): FichaTributaria {
  const itemAnexo = encontrarItemAnexo(codigo, tipo, descricao) ?? null;
  if (itemAnexo) {
    const opcoes = cclasstribPorAnexo(itemAnexo.anexo);
    return {
      codigo,
      descricao,
      tipo,
      itemAnexo,
      profissaoRegulada: null,
      classificacao: opcoes[0] ?? CCLASSTRIB_PADRAO,
      classificacoesAlternativas: opcoes.slice(1),
    };
  }

  const profissaoRegulada = tipo === 'NBS' ? (encontrarProfissaoRegulada(codigo) ?? null) : null;
  return {
    codigo,
    descricao,
    tipo,
    itemAnexo: null,
    profissaoRegulada,
    classificacao: profissaoRegulada ? CCLASSTRIB_PROFISSAO_REGULADA : CCLASSTRIB_PADRAO,
    classificacoesAlternativas: [],
  };
}

const LIMITE_RESULTADOS = 40;

/**
 * Sinônimos de frase inteira: quando o termo digitado (normalizado) bate
 * exatamente com a chave, a busca usa o valor à direita no lugar do termo
 * original. Cobre atividades/nomes populares de negócio sem correspondência
 * literal na nomenclatura oficial (ex.: "pet shop" → "veterinário").
 */
const FRASES_SINONIMOS: Record<string, string> = {
  'pet shop': 'veterinario',
  petshop: 'veterinario',
  'oficina mecanica': 'manutencao e reparacao de veiculos',
  'salao de beleza': 'cabeleireiros tratamento cosmetico embelezamento',
  'aluguel de carro': 'locacao de veiculos',
  'aluguel de carros': 'locacao de veiculos',
  'reforco escolar': 'ensino',
  'aula particular': 'ensino',
  'personal trainer': 'bem-estar fisico',
  'construcao civil': 'construcao',
};

/**
 * Sinônimos comuns que um contador digitaria, mas que não aparecem
 * literalmente no texto oficial da NCM/NBS (ex.: "advocacia" → o texto usa
 * "jurídico/jurídica"). O termo à direita é buscado por radical (prefixo).
 */
const SINONIMOS: Record<string, string> = {
  advocacia: 'juridic',
  advogado: 'juridic',
  advogados: 'juridic',
  contador: 'contabil',
  contadores: 'contabil',
  medico: 'medic',
  médico: 'medic',
  remedio: 'medicament',
  remédio: 'medicament',
  padaria: 'alimenta',
  lanchonete: 'alimenta',
  restaurante: 'alimenta',
  bar: 'alimenta',
  academia: 'fisico',
  ginastica: 'fisico',
  personal: 'fisico',
  estetica: 'cosmet',
  esteticista: 'cosmet',
  salao: 'cabeleir',
  corretor: 'corretagem',
  mecanico: 'reparacao',
  oficina: 'reparacao',
  encanador: 'tubulacao',
  hidraulica: 'tubulacao',
  condominio: 'condominial',
  consultorio: 'clinica',
  aluguel: 'locacao',
  motoboy: 'remessa',
  delivery: 'entrega',
};

/** Tamanho do radical usado para comparar tokens tolerando variação de gênero/número (ex.: médico x médica). */
const RADICAL = 5;

function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

const TAMANHO_MINIMO_TOKEN = 3;

function tokensCorrespondem(tokenBusca: string, tokenAlvo: string): boolean {
  if (tokenBusca.length < TAMANHO_MINIMO_TOKEN || tokenAlvo.length < TAMANHO_MINIMO_TOKEN) {
    return tokenBusca === tokenAlvo;
  }
  if (tokenAlvo.startsWith(tokenBusca) || tokenBusca.startsWith(tokenAlvo)) return true;
  if (tokenBusca.length >= RADICAL && tokenAlvo.length >= RADICAL) {
    return tokenBusca.slice(0, RADICAL) === tokenAlvo.slice(0, RADICAL);
  }
  return false;
}

/** Expande os tokens de busca com sinônimos de frase e de palavra (busca por OR entre o termo original e o sinônimo). */
function tokensDeBusca(termo: string): string[][] {
  const fraseSinonimo = FRASES_SINONIMOS[normalizar(termo.trim())];
  if (fraseSinonimo) {
    // Sinônimo de frase: os termos mapeados nem sempre coexistem na mesma
    // descrição (podem cobrir conceitos distintos e correlatos), então
    // tratamos como um único grupo "ou" em vez de exigir todos ao mesmo tempo.
    return [tokenizar(fraseSinonimo)];
  }
  return tokenizar(termo).map((t) => {
    const sinonimo = SINONIMOS[t];
    return sinonimo ? [t, sinonimo] : [t];
  });
}

/** Verifica se todos os grupos de tokens de busca (AND entre palavras, OR entre sinônimos) casam com a descrição. */
function descricaoCasaComBusca(gruposBusca: string[][], descricaoTokens: string[]): boolean {
  return gruposBusca.every((grupo) => grupo.some((t) => descricaoTokens.some((dt) => tokensCorrespondem(t, dt))));
}

export function buscarNcm(termo: string): NcmRow[] {
  const termoTrim = termo.trim();
  if (!termoTrim) return [];
  const codigoBusca = termoTrim.replace(/\./g, '');
  const gruposBusca = tokensDeBusca(termoTrim);
  const porCodigo: NcmRow[] = [];
  const porDescricao: NcmRow[] = [];
  for (const item of NCM) {
    if (/^[\d.]+$/.test(termoTrim) && item.codigo.replace(/\./g, '').startsWith(codigoBusca)) {
      porCodigo.push(item);
    } else if (descricaoCasaComBusca(gruposBusca, tokenizar(item.descricao))) {
      porDescricao.push(item);
    }
    if (porCodigo.length + porDescricao.length >= LIMITE_RESULTADOS * 3) break;
  }
  return [...porCodigo, ...porDescricao].slice(0, LIMITE_RESULTADOS);
}

/**
 * Alguns códigos "genéricos" da NBS (ex.: "Outros serviços de saúde humana
 * não classificados...") têm, nos Anexos da LC 214/2025, um rótulo bem mais
 * específico para o mesmo código (ex.: "Serviços de nutrição"). Buscar
 * também pelos rótulos dos anexos cobre esses casos.
 */
function buscarNbsPorAnexo(gruposBusca: string[][]): NbsRow[] {
  const resultados: NbsRow[] = [];
  for (const a of ANEXOS) {
    if (a.tipo !== 'NBS' || a.codigos.length === 0) continue;
    if (descricaoCasaComBusca(gruposBusca, tokenizar(a.descricao))) {
      for (const c of a.codigos) resultados.push({ codigo: c, descricao: a.descricao });
    }
  }
  return resultados;
}

/** Reconhece um código de CNAE (dígitos, com ou sem pontuação "-" e "/", sem pontos — que são do formato de código NBS). */
function ehFormatoCnae(termoTrim: string): boolean {
  if (termoTrim.includes('.')) return false;
  const semPontuacao = termoTrim.replace(/[\d\s/-]/g, '');
  const digitos = termoTrim.replace(/[^\d]/g, '');
  return semPontuacao.length === 0 && digitos.length >= 4;
}

/**
 * Resolve NBS a partir de um CNAE (código ou palavra-chave da atividade),
 * usando a tabela de correlação CNAE x Código de Serviço (LC 116) x NBS.
 */
function buscarNbsPorCnae(termoTrim: string, gruposBusca: string[][]): NbsRow[] {
  const cnaesEncontrados = ehFormatoCnae(termoTrim)
    ? CNAE.filter((c) => c.codigo.replace(/[^\d]/g, '').startsWith(termoTrim.replace(/[^\d]/g, '')))
    : CNAE.filter((c) => descricaoCasaComBusca(gruposBusca, tokenizar(c.descricao)));
  if (cnaesEncontrados.length === 0) return [];
  const codigosCnae = new Set(cnaesEncontrados.map((c) => c.codigo));
  const nbsCodigos = new Set(CNAE_NBS_LINKS.filter((l) => codigosCnae.has(l.cnae)).map((l) => l.nbs));
  const resultado: NbsRow[] = [];
  for (const codigo of nbsCodigos) {
    const n = NBS_POR_CODIGO.get(codigo);
    if (n) resultado.push(n);
  }
  return resultado;
}

export function buscarNbs(termo: string): NbsRow[] {
  const termoTrim = termo.trim();
  if (!termoTrim) return [];
  const ehCodigo = /^[\d.]+$/.test(termoTrim);
  const gruposBusca = tokensDeBusca(termoTrim);
  const porCodigo: NbsRow[] = [];
  const porDescricao: NbsRow[] = [];
  for (const item of NBS) {
    if (ehCodigo && item.codigo.startsWith(termoTrim)) {
      porCodigo.push(item);
    } else if (!ehCodigo && descricaoCasaComBusca(gruposBusca, tokenizar(item.descricao))) {
      porDescricao.push(item);
    }
  }
  const porAnexo = ehCodigo ? [] : buscarNbsPorAnexo(gruposBusca);
  const porCnae = buscarNbsPorCnae(termoTrim, gruposBusca);

  const vistos = new Set<string>();
  const combinados: NbsRow[] = [];
  for (const r of [...porCnae, ...porAnexo, ...porCodigo, ...porDescricao]) {
    const chave = `${r.codigo}::${r.descricao}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    combinados.push(r);
  }
  return combinados.slice(0, LIMITE_RESULTADOS);
}

/** Busca CNAEs por código (prefixo) ou palavra-chave da atividade. */
export function buscarCnae(termo: string): CnaeRow[] {
  const termoTrim = termo.trim();
  if (!termoTrim) return [];
  if (ehFormatoCnae(termoTrim)) {
    const digitos = termoTrim.replace(/[^\d]/g, '');
    return CNAE.filter((c) => c.codigo.replace(/[^\d]/g, '').startsWith(digitos)).slice(0, LIMITE_RESULTADOS);
  }
  const gruposBusca = tokensDeBusca(termoTrim);
  return CNAE.filter((c) => descricaoCasaComBusca(gruposBusca, tokenizar(c.descricao))).slice(0, LIMITE_RESULTADOS);
}

/** Indicadores de operação (INDOP) plausíveis para o tipo de item, como referência — a operação real define o INDOP exato. */
export function indopSugeridos(tipo: 'NCM' | 'NBS'): IndOpRow[] {
  const padrao = tipo === 'NCM' ? /bem m[oó]vel material/i : /servi[cç]o/i;
  return INDOP.filter((i) => padrao.test(i.tipoOperacao));
}

export function buscarIndop(termo: string): IndOpRow[] {
  const termoNorm = normalizar(termo.trim());
  if (!termoNorm) return [];
  return INDOP.filter(
    (i) =>
      i.codigo.includes(termoNorm) ||
      normalizar(i.tipoOperacao).includes(termoNorm) ||
      normalizar(i.caracteristica).includes(termoNorm),
  ).slice(0, LIMITE_RESULTADOS);
}
