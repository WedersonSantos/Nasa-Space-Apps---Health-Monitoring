# Tabela de indicadores — justificativa científica

Motor de regras: [`src/engine`](../src/engine) · Limiares: [`src/engine/config/thresholds.ts`](../src/engine/config/thresholds.ts) (versão `ENGINE_CONFIG_VERSION`) · Fontes: [`src/engine/config/sources.ts`](../src/engine/config/sources.ts)

**Regra de ouro:** nenhum alerta existe sem uma operação aritmética sobre números registrados, e a operação aparece no texto do alerta (`Alert.arithmetic`). Todo alerta declara o baseline usado.

**Sobre os limiares:** os valores de **prescrição** (sono e exercício) vêm de fontes da NASA. Os **limiares de alerta** são parâmetros iniciais da equipe, sem validação clínica, e estão marcados como arbitrários: o `sourceRef` de cada alerta começa com `arbitrary-threshold`, seguido da fonte que dá contexto à variável.

## As três classes de variável

| Classe | Papel no fluxo | Variáveis |
| --- | --- | --- |
| **Sinal** | Coletar → **interpretar** (gera alerta) | FC de repouso, HRV, pressão arterial, sono, autorrelato |
| **Acumulador** | Consequência de longo prazo | Massa corporal |
| **Contramedida** | **Orientar** (fecha o ciclo) | Carga de exercício |

## Indicadores

| # | Variável | Unidade | Classe | Perigo / risco NASA | Origem na demo | Baseline | Regra | Limiar | Fonte do limiar | Fonte de contexto |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | FC de repouso | bpm | Sinal | Gravidade alterada → descondicionamento cardiovascular | Sintética (wearable) | Pré-voo (média e DP, 7 dias) | `z = (FC − média) / máx(DP, 2,5)`; \|z\| > limiar por N dias consecutivos | 1,5 DP; 3 dias | Arbitrário (spec §5) | [NASA HRP — Risks](https://www.nasa.gov/hrp/risks/) |
| 2 | HRV (RMSSD) | ms | Sinal | Isolamento/confinamento → carga autonômica, saúde comportamental | Sintética (wearable) | Pré-voo | `queda = (média − HRV) / média` > limiar por N dias | 20%; 3 dias | Arbitrário (spec §5) | [NASA HRP — Risks](https://www.nasa.gov/hrp/risks/); [NASA HRR — Sleep](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf) |
| 3 | Pressão arterial (sistólica; diastólica exibida) | mmHg | Sinal | Gravidade alterada → deslocamento cefálico de fluidos | Sintética (manguito manual) | Pré-voo **individual** (nunca corte clínico 140/90) | Todos os N dias além de ±1,5·máx(DP, 4) do baseline, mesma direção | 1,5 DP; 5 dias | Arbitrário (spec §5) | [NASA HRP — 5 Hazards](https://www.nasa.gov/hrp/hazards/) |
| 4 | Sono | h + qualidade 1–5 | Sinal | Ambiente fechado/hostil → ruptura circadiana | Sintética (actigrafia) | Prescrição de 8 h/noite | `déficit = Σ máx(0, 8 − horas)` em 7 noites > limiar | 7 h em 7 noites | Prescrição: [NASA HRR — Sleep](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf) (8 h, NASA-STD-3001 Vol. 1). Limiar: arbitrário | [NASA Ames](https://www.nasa.gov/space-science-and-astrobiology-at-ames/interesting-fact-of-the-month-current/interesting-fact-of-the-month-2022/): agenda de ~8,5 h vs. ~6 h dormidas |
| 5 | Autorrelato | humor, estresse, fadiga 1–5 → índice 1–5 | Sinal | Isolamento e confinamento | Sintética (autorrelato) | Móvel (5 dias anteriores) + pré-voo | `Δ = média 5d − média 5d anteriores` ≤ −0,5 **e** média 5d ≤ pré-voo − 0,5. Índice = (humor + (6 − estresse) + (6 − fadiga)) / 3 | −0,5 ponto | Arbitrário | [NASA HRP — 5 Hazards](https://www.nasa.gov/hrp/hazards/) |
| 6 | Massa corporal | kg, %Δ | Acumulador | Gravidade alterada → atrofia muscular, perda de fluidos | Sintética (diária pré-voo; a cada 3 dias em voo) | Pré-voo | `%Δ = (média 7d − pré-voo) / pré-voo` ≤ limiar | −2,0% | Arbitrário, dentro da faixa típica de 1–5% | [NASA — Nutritional Biochemistry](https://www.nasa.gov/wp-content/uploads/2023/04/nutritional-biochemistry-of-space-flight.pdf) |
| 7 | Carga de exercício | min completados / prescritos | Contramedida | Contramedida de 1, 3 e 6 | Sintética (registro de treino) | Prescrição de 150 min/dia, 6 dias/semana | `aderência = Σ completado / Σ prescrito` em 7 dias < limiar | 80% | Prescrição: [NASA/SP-20250000273](https://www.nasa.gov/wp-content/uploads/2025/02/sp-20250000273.pdf) (2,5 h/dia, 6 dias/sem.). Limiar: arbitrário (spec §5) | [NASA — Astronaut Exercise](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/) (média de ~2 h/dia; ARED, T2, CEVIS) |
| + | **Composto: sobrecarga** | derivado | Derivado | Sobrecarga multissistema | — | Pré-voo | Média de 5 dias de sono, HRV e FC: `z = (média 5d − pré-voo) / máx(DP, piso)`; ≥ 2 de 3 sinais com z ≥ 1,0 na direção sono ↓, HRV ↓, FC ↑ e nenhum na direção contrária | 1,0 DP; 2 de 3 sinais | Arbitrário | [NASA HRR — Sleep](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf) |
| + | **Associação: massa ↔ exercício** | derivado | Derivado | Acumulador × contramedida | — | Pré-voo + janela de 21 dias | Massa %Δ ≤ −2,0% **e** aderência de 21 dias < 80% → atenção. Com a regra 3 (pressão) também ativa → **crítico + escalonamento** | −2,0%; 80%; 21 dias | Arbitrário | [NASA/SP-20250000273](https://www.nasa.gov/wp-content/uploads/2025/02/sp-20250000273.pdf); [NASA — Nutritional Biochemistry](https://www.nasa.gov/wp-content/uploads/2023/04/nutritional-biochemistry-of-space-flight.pdf) |

### Decisões do motor

- **Associar, nunca modelar.** O motor não calcula perda de massa em função do déficit de exercício. Ele mede os dois sinais separadamente e os **associa** quando desviam na mesma janela, com linguagem de possibilidade ("podem estar relacionados… não afirma causa").
- **Os alertas compostos absorvem os isolados.** Quando a regra composta ou a associação dispara, os alertas isolados das variáveis que ela explica saem da lista, para não duplicar a mesma informação.
- **Pisos de DP.** Sete dias de pré-voo dão uma estimativa ruidosa do DP. Um piso mínimo, arbitrário, evita z inflado e falsos positivos. Sem os pisos, o cenário nominal gerava 3 falsos positivos em 113 dias.
- **Dias faltantes.** As regras de "N dias consecutivos" exigem dado em todos os dias. Sem medição, a sequência não conta, o que é conservador.
- **Início do alerta.** `raisedAt` é o primeiro dia da sequência contínua em que a regra dispara, e não o dia da avaliação. O `id` do alerta é estável: `astronautId:ruleId:data-de-início`.
- **Pré-voo.** Nenhuma regra é avaliada antes do 1º dia de voo, porque o baseline ainda está sendo formado.

## Variáveis cortadas

| Variável | Decisão | Motivo |
| --- | --- | --- |
| Densidade óssea / marcador de reabsorção | Cortada | Perda de 1–1,5%/mês sem contramedida e 0,3–0,5%/mês com ARED ([NASA HRR — Osteo](https://humanresearchroadmap.nasa.gov/evidence/reports/Osteo.pdf)): invisível numa janela de demo |
| Acuidade visual / pressão intraocular (SANS) | Cortada | Sem base sintética defensável nem dataset acessível no prazo |
| Dose de radiação acumulada | Fora do motor | Cresce de forma monotônica e não indica mudança de estado de saúde. No máximo, contexto de missão ([CSA](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)) |
| Temperatura corporal, SpO2 | Cortadas | Pouco informativas na ISS sem evento agudo |

## Cenários de teste e resultados observados

Gerados por `npm run generate` (seeds fixas) e verificados por `npm test` ([`tests/scenarios.test.ts`](../tests/scenarios.test.ts)). Missão: 7 dias de pré-voo + 113 dias de voo. As histórias ocorrem nos últimos 21 dias (dias de missão 93–113).

| Cenário | Esperado | Observado (avaliação dia a dia) |
| --- | --- | --- |
| 1 — Nominal | `normal` | `normal` em **todos** os 113 dias de missão, sem nenhum falso positivo. Aderência > 90% |
| 2 — Degradação gradual | `attention` pela regra composta | `normal` até o dia 101. **Dia 102** (10º dia da degradação): `fast-cluster-overload` com sono ↓, HRV ↓ e FC ↑. **Dia 113**: soma-se `selfreport-decline`. Pressão e massa nunca alarmam |
| 3 — Crítico com contramedida | `critical` com `escalate: true` | **Dia 95**: `exercise-adherence` (atenção). **Dia 110**: soma-se `bp-deviation`. **Dia 111**: `mass-exercise-association` **crítico** (massa −2,3% vs. pré-voo e −2,0% em 3 semanas; aderência de 59% em 21 dias; sistólica −12 mmHg vs. baseline) com escalonamento ao oficial médico |

Suíte completa: 60 testes. Há um teste por regra (dispara e não dispara), um por cenário, além de testes de pureza de `evaluate()`, validação de dados, autorrelato e persistência.
