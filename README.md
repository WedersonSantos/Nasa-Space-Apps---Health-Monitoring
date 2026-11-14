# Vigília — monitor de saúde de astronautas

**NASA Space Apps Challenge 2026 · Desafio 05 — [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)**
Equipe Formandos UDI (Uberlândia) · Licença [Apache-2.0](LICENSE)

> **Coletar → Interpretar → Orientar.** A Vigília não é um painel de sinais vitais. Ela compara cada medição com o *baseline individual* do astronauta, reconhece padrões entre sinais, mostra a conta por trás de cada alerta e diz o que fazer — inclusive quando acionar o oficial médico da tripulação. Funciona sem conexão com a Terra.

- **Demo publicada:** https://nasa-chi-ten.vercel.app — abre sem login e funciona offline depois da primeira visita
- **Vídeo:** _(link — preencher)_

---

## 1. Problema

Em missões longas, a tripulação enfrenta os cinco perigos do voo espacial humano descritos pelo NASA Human Research Program — radiação, isolamento e confinamento, distância da Terra, alterações da gravidade e ambientes fechados e hostis. Eles se traduzem em descondicionamento cardiovascular, perda muscular e óssea, ruptura do sono e problemas de saúde comportamental. Longe da Terra, com comunicação atrasada e recursos médicos limitados, o astronauta precisa **perceber sozinho** que algo mudou e **saber o que fazer**.

## 2. Solução

Sete variáveis, em três classes, mapeadas um-para-um no fluxo do desafio:

| Classe | Variáveis | Papel |
| --- | --- | --- |
| **Sinais** | FC de repouso, HRV (RMSSD), pressão arterial, sono, autorrelato (humor/estresse/fadiga) | Coletar → interpretar. Geram alerta. |
| **Acumulador** | Massa corporal | Consequência de longo prazo. |
| **Contramedida** | Carga de exercício (prescrito × completado) | Orientar — fecha o ciclo. |

O que diferencia a solução:

- **Regra composta multi-sinal.** Três noites curtas, HRV caindo e FC subindo, juntos, viram um alerta de *sobrecarga* — não "sono baixo". Nenhum sinal isolado justificaria o alerta; o padrão sim.
- **Associação entre acumulador e contramedida, sem inventar causa.** "Massa −2% em 3 semanas; no mesmo período, 61% do exercício prescrito foi completado. Os dois podem estar relacionados." O sistema associa; não modela dose-resposta.
- **Alerta explicável.** Cada alerta mostra a fórmula aplicada, os números que o sustentam (atual × baseline × desvio), a orientação e a fonte do limiar — ou declara o limiar como arbitrário.
- **Offline por construção.** Sem backend: tudo roda no dispositivo. Um app para astronauta tem que funcionar sem a Terra.

### Telas

| Aba | O que mostra |
| --- | --- |
| **Visão geral** | Estado geral (normal / atenção / crítico, sempre com ícone + rótulo), alertas explicativos e um cartão por indicador com gráfico, faixa de baseline e ponto do alerta. |
| **Contramedida** | Aderência ao exercício e, lado a lado, massa corporal × exercício completado com o alerta de associação. |
| **Registrar** | Medição manual com validação e autorrelato de humor, estresse e fadiga (1–5). |
| **Sobre e fontes** | Tabela de indicadores, limitações, referências e declaração de uso de IA. |

### Uso próprio e honestidade dos dados

- **Minha missão.** Além da demonstração, qualquer pessoa pode criar uma missão própria (só um apelido, sem dados pessoais). Os registros ficam neste dispositivo, separados dos dados sintéticos; os 7 primeiros dias de registro formam o baseline pré-voo e a avaliação começa no dia 1 de voo.
- **"Não avaliado" não é "Normal".** O motor informa, por variável, se havia dados suficientes para aplicar a regra (`coverage`). Sem dados, sem baseline ou com registros desatualizados, a interface mostra "Não avaliado" com o motivo, e o estado geral vira "Avaliação parcial" ou "Sem dados". Ausência de alerta nunca é apresentada como saúde normal.
- **Como medir.** Cada variável traz equipamento, condições de coleta adaptadas à microgravidade (por exemplo, pressão arterial com o corpo contido e o braço na altura do coração, massa medida por aceleração linear em vez de balança) e frequência.
- **Acompanhamento das ações.** Cada alerta permite registrar "Medição repetida", "Oficial médico acionado" e "Ação concluída". As ações aparecem na trilha da missão e numa lista que mostra se o alerta continua ativo, sem alterar a avaliação.

Os três cenários de demonstração trocam ao vivo pelos botões no topo ou pelas teclas **1**, **2** e **3**. A **linha do tempo da missão** reavalia o estado em qualquer dia (setas ← → ou botão *Reproduzir*), mostrando o dia exato em que cada padrão surge. Passe o mouse (ou foque com o teclado) sobre o nome de qualquer parâmetro para ver o que ele mede e por que importa em voo espacial.

## 3. Arquitetura

```
Medições (JSON de cenário + registros manuais)
        │
        ▼
evaluate(measurements, astronautId, asOf)  ← função pura, determinística (src/engine)
        │
        ▼
AstronautState { overall, alerts[], baselines[], adherence, latest }
        │
        ▼
Interface React (src/components) — só exibe; nenhum limiar mora na UI
```

| Camada | Escolha |
| --- | --- |
| Build | Vite |
| UI | React 18 + TypeScript |
| Gráficos | Recharts |
| Motor | TypeScript puro, sem dependências — `src/engine` |
| Testes | Vitest sobre o motor — `tests/` |
| Persistência | `localStorage` com reserva em memória — `src/storage` |
| Offline | Service worker (rede primeiro, cache como reserva) — `public/sw.js` |
| Deploy | Build estático (Vercel ou Netlify) |

**IA fora do caminho crítico.** Nenhum modelo de IA decide se há alerta. As regras são determinísticas e auditáveis; é isso que torna o alerta explicável.

### Estrutura do repositório

```
src/
  types/contract.ts      Contrato congelado entre motor e interface
  engine/                Motor de regras, baseline, aderência (Bloco A)
  data/                  Cenários de demonstração (JSON gerados) e criação de medições
  storage/               Persistência local
  integration/           Ponto único de ligação motor ↔ interface
  components/            Interface (Bloco B)
  config/                Textos de interface e metadados das variáveis
scripts/                 Gerador de dados sintéticos
tests/                   Testes do motor
docs/                    Tabela de indicadores e registro da busca de dados
PRODUCT.md, DESIGN.md    Contexto do produto e sistema visual (identidade de operações de missão)
```

## 4. Como rodar

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes do motor
npm run build      # build estático em dist/
npm run preview    # serve o build localmente
```

### Deploy

Build estático, sem variáveis de ambiente. Na Vercel ou na Netlify, basta importar o repositório: comando `npm run build`, pasta de saída `dist`.

## 5. Dados de demonstração

**Todos os dados da demo são sintéticos** e marcados `origin: 'synthetic'` em cada medição; a interface mostra a origem em todo valor exibido (Sintético · Medido · Estimado), e registros manuais aparecem como *Medido*.

Cada cenário tem 120 dias (7 de pré-voo + 113 de missão), gerados por `npm run generate` a partir de `scripts/generate-scenarios.ts` com semente fixa, em `src/data/scenarios/*.json`.

| Cenário | Roteiro | Resultado observado no dia 113 | Prova |
| --- | --- | --- | --- |
| 1 — Nominal | Sinais no baseline, aderência > 90%, massa estável | Normal, nenhum alerta | O sistema não alarma sem motivo |
| 2 — Degradação gradual | Sono ↓, HRV ↓, FC ↑ ao longo de 3 semanas | Atenção — padrão de sobrecarga desde o dia 102 | A regra composta reconhece o padrão |
| 3 — Crítico com contramedida | Aderência baixa, massa em queda, pressão desviando do baseline | Crítico — associação desde o dia 111, com escalonamento | Associação + escalonamento ao oficial médico |

A tabela completa de indicadores (unidade, origem, baseline, regra, limiar, fonte) e os resultados por cenário estão em [docs/indicadores.md](docs/indicadores.md); o registro da busca de dados nas fontes oficiais está em [docs/busca-de-dados.md](docs/busca-de-dados.md).

Convenções de medição: pressão arterial usa `value` = sistólica e `secondaryValue` = diastólica; sono usa `secondaryValue` = qualidade (1–5); exercício usa `value` = minutos completados e `secondaryValue` = minutos prescritos; o autorrelato gera três medições por registro (`method` = `self-report:mood`, `self-report:stress` ou `self-report:fatigue`).

## 6. Validação

- Testes automatizados do motor: uma verificação por regra e uma por cenário, conferindo a severidade final esperada (`npm test`).
- Cada alerta exibe a operação aritmética aplicada e as evidências numéricas.
- Limiares sem fonte publicada aparecem na interface como **"Limiar arbitrário · sujeito a validação clínica"**.

## 7. Limitações

1. Dados sintéticos, com faixas derivadas de literatura pública. Não há telemetria real de astronauta.
2. Limiares de alerta são parâmetros iniciais, sujeitos a validação clínica.
3. O sistema associa variáveis; não modela causalidade nem prevê desfecho clínico.
4. Não substitui avaliação médica: indica quando escalonar, nunca diagnostica.
5. Perda óssea e síndrome neuro-ocular (SANS) ficaram fora: constantes de tempo longas demais para a janela da demo e dados indisponíveis no prazo.
6. O baseline individual exige período pré-voo de registro; sem ele, a sensibilidade cai.

### Trabalhos futuros

- Dosimetria de radiação como contexto de missão.
- Acuidade visual e pressão intraocular para rastreio de SANS.
- Marcadores de perda óssea em missões longas.
- Validação dos limiares com equipe médica aeroespacial.
- Adaptação para ambientes remotos na Terra: bases antárticas, plataformas offshore, expedições.

## 8. Declaração de uso de IA

Usamos ferramentas de IA generativa (Claude, da Anthropic) como assistentes de programação e redação. Todo o código e todo o texto foram revisados pela equipe. A IA **não** participa do motor de alertas: as decisões saem de regras determinísticas, com a fórmula visível no próprio alerta. A interface não apresenta IA como autoridade médica.

## 9. Créditos e referências

**Equipe Formandos UDI**

| Integrante | Responsabilidade |
| --- | --- |
| Moacir Nascimento | Bloco A: dados e motor de análise. Contrato de dados, pesquisa das referências NASA, dados sintéticos e cenários, baselines individuais, regras de alerta, cobertura de dados, persistência e testes |
| Wederson Ferreira | Bloco B: interface e entrega. Telas, integração com o motor, modo "Minha missão", registro de medições, README e publicação |
| Vivian Vitoria | Design: identidade visual, design system e paletas dos modos diurno e noturno |

**Recursos oficiais do desafio**

- NASA HRP — [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/)
- NASA HRP — [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/)
- NASA HRP — [Ongoing HRP Research in Space](https://www.nasa.gov/hrp/ongoing-hrp-research/)
- CSA — [Monitoring Radiation for Astronaut Health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)
- CSA — [Why Do We Conduct Science Experiments in Space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)
- [NASA Open Science Data Repository (OSDR)](https://osdr.nasa.gov/) · [NASA Life Sciences Portal (NLSP)](https://nlsp.nasa.gov/)

As fontes específicas de cada limiar (relatórios de evidência do NASA Human Research Roadmap, NASA/SP-20250000273 e outros) estão em `src/engine/config/sources.ts` e na aba **Sobre e fontes** do app.

**Bibliotecas de código aberto:** React (MIT), Recharts (MIT), Vite (MIT), Vitest (MIT), TypeScript (Apache-2.0).

A NASA não endossa nenhuma entidade não governamental e não é responsável por informações contidas em sites não governamentais. Este projeto não contém informações pessoais identificáveis: o tripulante da demonstração é fictício.
