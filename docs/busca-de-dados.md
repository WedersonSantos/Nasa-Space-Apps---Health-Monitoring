# Registro da busca de dados (Bloco A, etapa 2)

Data: 14/11/2026. Objetivo: encontrar séries de FC, HRV, sono, PA e massa de astronautas e os três números de prescrição exigidos pela spec (§2).

## Números de prescrição encontrados

| # | Pedido da spec | Valor usado | Fonte |
| --- | --- | --- | --- |
| 1 | Sono agendado vs. dormido na ISS | Agenda de ~8,5 h; média dormida de ~6 h (6–6,5 h). Recomendação: 8 h (NASA-STD-3001 Vol. 1) → **prescrição = 8 h** | [NASA HRR — Sleep Evidence Report](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf); [NASA Ames — Interesting Fact 2022](https://www.nasa.gov/space-science-and-astrobiology-at-ames/interesting-fact-of-the-month-current/interesting-fact-of-the-month-2022/); [NASA-STD-3001 Tech Brief — Sleep](https://www.nasa.gov/wp-content/uploads/2023/03/sleep-accomodations-technical-brief-ochmo.pdf) |
| 2 | Carga diária de exercício | Prescrição de **2,5 h/dia, 6 dias/semana** (média real de ~2 h/dia). Equipamentos: ARED (resistido), T2 e CEVIS (aeróbico). Não há divisão oficial em minutos entre aeróbico e resistido, por isso o motor trata a carga total | [NASA/SP-20250000273](https://www.nasa.gov/wp-content/uploads/2025/02/sp-20250000273.pdf); [NASA — Astronaut Exercise](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/) |
| 3 | Perda óssea e de massa por mês de voo | aBMD: 1–1,5%/mês sem contramedida; 0,3–0,5%/mês com ARED. Massa corporal: perda típica de 1–5% em voo longo (até 10–15% em casos antigos) | [NASA HRR — Osteo Evidence Report](https://humanresearchroadmap.nasa.gov/evidence/reports/Osteo.pdf); [NASA — Nutritional Biochemistry of Space Flight](https://www.nasa.gov/wp-content/uploads/2023/04/nutritional-biochemistry-of-space-flight.pdf) |

> **Pendência antes da submissão:** os valores acima vieram de resumos de busca e das páginas HTML da NASA. Ainda é preciso abrir cada PDF e anotar a página e o trecho exato de cada número.

A página [5 Hazards](https://www.nasa.gov/hrp/hazards/) foi consultada e **não** traz números de sono, exercício ou perda óssea. Ela serve apenas para o enquadramento dos cinco perigos.

## Séries temporais de astronauta

**Não encontradas.** Não há, nas fontes oficiais do desafio, uma série diária multissinal (FC, HRV, sono, PA, massa) de astronauta disponível para uso direto. O [OSDR](https://osdr.nasa.gov/) é majoritariamente de dados ômicos e de organismos-modelo. Conclusão: os dados da demo são **sintéticos**, como a spec permite, e estão rotulados como tais (`origin: 'synthetic'` em toda medição).

## Como os dados sintéticos foram gerados

[`scripts/generate-scenarios.ts`](../scripts/generate-scenarios.ts): PRNG com seed fixa, 120 dias (7 de pré-voo + 113 de voo), ruído gaussiano diário.

| Variável | Média base | Ruído diário (DP) | Observação |
| --- | --- | --- | --- |
| FC de repouso | 58 bpm | 2 | Inteiro |
| HRV (RMSSD) | 55 ms | 5 | |
| Pressão arterial | 118/76 mmHg | 3,5 / 2,5 | Inteiros |
| Sono | 7,5 h; qualidade 4 | 0,35 h; 0,5 | Melhor que a média de ~6 h da ISS, de propósito: o astronauta nominal não pode alarmar |
| Autorrelato | bem-estar latente 4,0 | 0,2 + ruído Likert 0,35 | 3 itens inteiros de 1 a 5 por dia |
| Massa | 75,0 kg | 0,2 kg | Diária no pré-voo e a cada 3 dias em voo |
| Exercício | 150 min prescritos, 6 dias/semana | aderência 96% ± 4% | |

As faixas são **ilustrativas de adulto saudável** e não foram derivadas de telemetria de astronauta. Isso consta nas limitações.

## Limitações que esta busca gera

1. Não há telemetria real de astronauta: a demo usa dados sintéticos.
2. Todos os limiares de alerta são parâmetros iniciais arbitrários. Apenas as prescrições de sono e de exercício têm fonte.
3. O baseline de 7 dias de pré-voo é curto e dá uma estimativa ruidosa do DP. Por isso o motor usa pisos de DP arbitrários.
4. Não há divisão oficial de minutos entre exercício aeróbico e resistido. O motor avalia a carga total.
