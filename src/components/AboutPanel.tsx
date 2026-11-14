import { VARIABLE_IDS } from '../types/contract';
import { ENGINE_SOURCES, OFFICIAL_RESOURCES } from '../config/sources';
import { CLASS_LABEL, CLASS_ROLE, HAZARD_LABEL, VARIABLES } from '../config/variables';
import { ClassChip } from './Badges';
import { VariableTerm } from './VariableTerm';

export const REPO_URL = 'https://github.com/WedersonSantos/Nasa-Space-Apps---Health-Monitoring';
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

export function AboutPanel() {
  return (
    <div className="stack">
      <section className="panel prose">
        <h2>O que este sistema faz</h2>
        <p>
          Em missões longas, a tripulação precisa perceber mudanças na própria saúde e saber o que fazer, mesmo com
          comunicação e recursos médicos limitados. A Vigília não é um painel de números: ela compara cada medição com o{' '}
          <strong>baseline individual</strong> do astronauta, reconhece padrões entre sinais e explica a conta por trás de
          cada alerta.
        </p>
        <ol className="classes">
          {(['signal', 'accumulator', 'countermeasure'] as const).map((c) => (
            <li key={c}>
              <ClassChip varClass={c} /> <strong>{CLASS_LABEL[c]}</strong> — {CLASS_ROLE[c]}
            </li>
          ))}
        </ol>
        <p>
          As regras são determinísticas e auditáveis; nenhuma IA decide se há alerta. O app roda inteiro no dispositivo e
          continua funcionando sem link com a Terra.
        </p>
      </section>

      <section className="panel" aria-labelledby="ind-table">
        <h2 id="ind-table">Tabela de indicadores</h2>
        <div className="table-scroll">
          <table className="evidence indicators-table">
            <thead>
              <tr>
                <th scope="col">Variável</th>
                <th scope="col">Unidade</th>
                <th scope="col">Classe</th>
                <th scope="col">Perigo NASA</th>
                <th scope="col">Risco associado</th>
                <th scope="col">Constante de tempo</th>
                <th scope="col">Regra</th>
              </tr>
            </thead>
            <tbody>
              {VARIABLE_IDS.map((id) => {
                const v = VARIABLES[id];
                return (
                  <tr key={id}>
                    <th scope="row">
                      <VariableTerm variable={id} />
                    </th>
                    <td>{v.unit === '/5' ? '1–5' : v.unit}</td>
                    <td>{CLASS_LABEL[v.varClass]}</td>
                    <td>{v.hazards.map((h) => HAZARD_LABEL[h]).join(', ')}</td>
                    <td>{v.nasaRisk}</td>
                    <td>{v.timeConstant}</td>
                    <td>{v.ruleSummary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Composto (derivado): dois ou mais de sono ↓, HRV ↓ e FC de repouso ↑ em desvio na mesma janela de 5 dias. Limiares
          sem fonte publicada aparecem marcados como arbitrários nos alertas.
        </p>
      </section>

      <section className="panel prose">
        <h2>Limitações</h2>
        <ul>
          <li>Os dados da demonstração são sintéticos, com faixas plausíveis. Não há telemetria real de astronauta.</li>
          <li>Limiares de alerta são parâmetros iniciais, sujeitos a validação clínica.</li>
          <li>O sistema associa variáveis na mesma janela de tempo; não modela causalidade nem prevê desfecho clínico.</li>
          <li>Não substitui avaliação médica: indica quando escalonar, nunca diagnostica.</li>
          <li>Perda óssea e SANS ficaram fora: constantes de tempo longas demais para a janela da demo e falta de dados.</li>
          <li>O baseline individual exige período pré-voo de registro; sem ele, a sensibilidade cai.</li>
        </ul>
      </section>

      <section className="panel prose">
        <h2>Referências</h2>
        <h3>Recursos oficiais do desafio</h3>
        <ul className="refs">
          {OFFICIAL_RESOURCES.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.agency} — {s.title}
              </a>
            </li>
          ))}
        </ul>
        <h3>Fontes citadas pelo motor de regras</h3>
        <ul className="refs">
          {Object.values(ENGINE_SOURCES).map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
              <span className="muted small"> — {s.usedFor}</span>
            </li>
          ))}
        </ul>
        <p className="muted small">
          A NASA não endossa entidades não governamentais. Projeto desenvolvido para o NASA Space Apps Challenge 2026.
        </p>
      </section>

      <section className="panel prose" aria-labelledby="license-title">
        <h2 id="license-title">Licença e código-fonte</h2>
        <p>
          Projeto de código aberto sob a{' '}
          <a href={LICENSE_URL} target="_blank" rel="noreferrer">
            Apache License 2.0 (Apache-2.0)
          </a>
          , licença aprovada pela OSI. Código-fonte, dados de demonstração e testes:{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            github.com/WedersonSantos/Nasa-Space-Apps---Health-Monitoring
          </a>
          .
        </p>
        <p className="muted small">
          Bibliotecas de terceiros: React, Recharts e Vite (MIT); TypeScript (Apache-2.0).
        </p>
      </section>

      <section className="panel prose">
        <h2>Uso de IA</h2>
        <p>
          Ferramentas de IA generativa foram usadas como assistentes de programação e redação. A IA não participa do motor
          de alertas: toda decisão sai de regras determinísticas, com a fórmula visível no próprio alerta.
        </p>
      </section>
    </div>
  );
}
