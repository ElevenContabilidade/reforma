# Simulador da Reforma Tributária

Aplicativo para simular, para cada cliente, qual o regime tributário mais vantajoso diante da
Reforma Tributária (EC 132/2023 e LC 214/2025): **Simples Nacional puro**, **Simples Nacional
híbrido** (CBS/IBS apurados por fora do DAS), **Lucro Presumido** ou **Lucro Real**.

## Funcionalidades

- **Dados da empresa**: faturamento, RBT12, folha de pagamento (Fator R), margem de lucro,
  percentual de compras/insumos com crédito, alíquota efetiva de ICMS/ISS e o ano de simulação
  (2026 a 2033, cobrindo todo o cronograma de transição da reforma).
- **Produtos e serviços**: checklist das categorias de redução de alíquota da CBS/IBS previstas em
  lei (cesta básica e demais isenções de 100%, saúde/educação/transporte etc. com 60%, serviços
  profissionais regulamentados com 30%, e alíquota padrão), com percentual de receita por
  categoria.
- **Upload do PGDAS-D**: leitura do PDF do extrato (via `pdfjs-dist`, no navegador) com extração
  automática de RBT12, receita do período, folha de pagamento, anexo e valor do DAS — sempre com
  revisão manual antes de aplicar ao formulário.
- **Dashboard**: comparação da carga tributária mensal/anual dos quatro regimes, recomendação do
  mais vantajoso, gráfico comparativo e detalhamento tributo a tributo.
- **Múltiplos clientes**: cada simulação é salva automaticamente no navegador (localStorage),
  permitindo alternar entre clientes na barra lateral.

## Premissas de cálculo

O motor de cálculo está em `src/lib`:

- `simplesTables.ts` — tabelas oficiais dos Anexos I a V do Simples Nacional e cálculo do Fator R.
- `reform.ts` — cronograma de transição da reforma (2026 ano-teste, 2027/2028 CBS ativo,
  2029-2032 redução gradual de ICMS/ISS, 2033 sistema pleno) e categorias de redução de alíquota
  do CBS/IBS.
- `calculators/` — um módulo por regime (`simples.ts`, `simplesHibrido.ts`, `presumido.ts`,
  `real.ts`) mais utilitários compartilhados (`shared.ts`).

Todas as alíquotas de referência (CBS ≈ 8,8%, IBS ≈ 17,7%) são estimativas divulgadas pelo
Ministério da Fazenda e podem mudar com a regulamentação definitiva — trate os resultados como
apoio à decisão, não como apuração oficial.

## Rodando localmente

```bash
npm install
npm run dev
```

```bash
npm run build   # build de produção em dist/
npm run lint    # oxlint
```
