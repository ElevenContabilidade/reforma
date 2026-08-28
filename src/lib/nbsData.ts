import type { ClassificacaoItem } from './ncmData';

/**
 * Referência rápida de classificação de serviços (NBS — Nomenclatura
 * Brasileira de Serviços) para fins de CBS/IBS, com base nos anexos da
 * LC 214/2025. Cobre atividades comuns por categoria de redução — não é a
 * lista oficial completa; para o enquadramento definitivo, consulte o Anexo
 * correspondente da lei.
 */
export const NBS_ITENS: ClassificacaoItem[] = [
  // Redução de 60% (Anexo II — saúde, educação, transporte, cultura etc.)
  { codigo: '1.0101', descricao: 'Serviços médicos e clínicos em geral', categoria: 'reduzida60', apelidos: ['médico', 'consulta', 'saúde'] },
  { codigo: '1.0301', descricao: 'Serviços hospitalares', categoria: 'reduzida60', apelidos: ['hospital'] },
  { codigo: '1.0501', descricao: 'Serviços de laboratório de análises clínicas', categoria: 'reduzida60', apelidos: ['laboratório', 'exame'] },
  { codigo: '1.1001', descricao: 'Planos de saúde e seguro-saúde', categoria: 'reduzida60', apelidos: ['convênio médico'] },
  { codigo: '1.1301', descricao: 'Serviços de odontologia', categoria: 'reduzida60', apelidos: ['dentista'] },
  { codigo: '1.1401', descricao: 'Serviços de fisioterapia e reabilitação', categoria: 'reduzida60', apelidos: ['fisioterapeuta'] },
  { codigo: '1.1601', descricao: 'Serviços de psicologia', categoria: 'reduzida60', apelidos: ['psicólogo', 'terapia'] },
  { codigo: '2.0101', descricao: 'Educação infantil, fundamental e médio', categoria: 'reduzida60', apelidos: ['escola', 'ensino'] },
  { codigo: '2.0201', descricao: 'Ensino superior e pós-graduação', categoria: 'reduzida60', apelidos: ['faculdade', 'universidade'] },
  { codigo: '2.0301', descricao: 'Cursos técnicos e profissionalizantes', categoria: 'reduzida60', apelidos: ['curso técnico'] },
  { codigo: '2.0401', descricao: 'Cursos de idiomas', categoria: 'reduzida60', apelidos: ['inglês', 'espanhol'] },
  { codigo: '3.0101', descricao: 'Transporte coletivo rodoviário de passageiros', categoria: 'reduzida60', apelidos: ['ônibus'] },
  { codigo: '3.0201', descricao: 'Transporte metroviário e ferroviário de passageiros', categoria: 'reduzida60', apelidos: ['metrô', 'trem'] },
  { codigo: '3.0301', descricao: 'Transporte aquaviário coletivo de passageiros', categoria: 'reduzida60', apelidos: ['barca', 'balsa'] },
  { codigo: '4.0101', descricao: 'Produções artísticas, culturais e jornalísticas', categoria: 'reduzida60', apelidos: ['arte', 'cultura', 'jornalismo'] },
  { codigo: '4.0201', descricao: 'Produções audiovisuais nacionais', categoria: 'reduzida60', apelidos: ['cinema', 'filme'] },
  { codigo: '4.0301', descricao: 'Atividades desportivas e desenvolvimento de atividades físicas', categoria: 'reduzida60', apelidos: ['esporte', 'academia'] },
  { codigo: '5.0101', descricao: 'Assistência técnica e insumos agropecuários', categoria: 'reduzida60', apelidos: ['agropecuária', 'rural'] },
  { codigo: '5.0201', descricao: 'Serviços de reabilitação e dispositivos de acessibilidade (PCD)', categoria: 'reduzida60', apelidos: ['deficiência', 'acessibilidade'] },

  // Redução de 30% (profissões regulamentadas — sociedades uniprofissionais)
  { codigo: '6.0101', descricao: 'Serviços advocatícios', categoria: 'reduzida30', apelidos: ['advocacia', 'advogado'] },
  { codigo: '6.0201', descricao: 'Serviços de contabilidade', categoria: 'reduzida30', apelidos: ['contador', 'contábil'] },
  { codigo: '6.0301', descricao: 'Serviços de engenharia', categoria: 'reduzida30', apelidos: ['engenheiro'] },
  { codigo: '6.0401', descricao: 'Serviços de arquitetura e urbanismo', categoria: 'reduzida30', apelidos: ['arquiteto'] },
  {
    codigo: '6.0501',
    descricao: 'Serviços de medicina prestados por sociedade uniprofissional',
    categoria: 'reduzida30',
    observacao: 'Aplica-se à sociedade uniprofissional; consultas avulsas em geral entram na redução de 60% de saúde.',
  },
  { codigo: '6.0601', descricao: 'Serviços de administração e economia', categoria: 'reduzida30', apelidos: ['administrador', 'economista'] },
  { codigo: '6.0701', descricao: 'Serviços de auditoria e perícia contábil', categoria: 'reduzida30', apelidos: ['auditor', 'perito'] },

  // Alíquota padrão (demais serviços)
  { codigo: '7.0101', descricao: 'Desenvolvimento de software e tecnologia da informação', categoria: 'padrao', apelidos: ['ti', 'programação', 'sistema'] },
  { codigo: '7.0201', descricao: 'Serviços de telecomunicações', categoria: 'padrao', apelidos: ['internet', 'telefonia'] },
  { codigo: '7.0301', descricao: 'Streaming de áudio e vídeo', categoria: 'padrao' },
  { codigo: '7.0401', descricao: 'Hospedagem e hotelaria', categoria: 'padrao', apelidos: ['hotel'] },
  { codigo: '7.0501', descricao: 'Consultoria empresarial não regulamentada', categoria: 'padrao', apelidos: ['consultor'] },
  { codigo: '7.0601', descricao: 'Marketing, publicidade e propaganda', categoria: 'padrao', apelidos: ['agência de marketing'] },
  { codigo: '7.0701', descricao: 'Serviços de limpeza e conservação', categoria: 'padrao', apelidos: ['faxina'] },
  { codigo: '7.0801', descricao: 'Vigilância e segurança patrimonial', categoria: 'padrao', apelidos: ['segurança'] },
  { codigo: '7.0901', descricao: 'Locação de bens móveis', categoria: 'padrao', apelidos: ['aluguel de equipamento'] },
  {
    codigo: '7.1001',
    descricao: 'Serviços financeiros e de seguros',
    categoria: 'padrao',
    observacao: 'Regime específico do setor financeiro (base de cálculo e alíquota próprias), não a redução padrão simples.',
    apelidos: ['banco', 'seguro'],
  },
];
