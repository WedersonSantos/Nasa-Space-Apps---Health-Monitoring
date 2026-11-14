import { VARIABLE_IDS } from '../types/contract';
import { ENGINE_SOURCES, OFFICIAL_RESOURCES } from '../config/sources';
import { sourceUsedFor } from '../engine';
import { CLASS_LABEL, CLASS_ROLE, HAZARD_LABEL, VARIABLES } from '../config/variables';
import { useLang, useT } from '../i18n';
import { ClassChip } from './Badges';
import { VariableTerm } from './VariableTerm';

export const REPO_URL = 'https://github.com/WedersonSantos/Nasa-Space-Apps---Health-Monitoring';
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

export function AboutPanel() {
  const t = useT();
  const { lang } = useLang();
  return (
    <div className="stack">
      <section className="panel prose">
        <h2>{t({ en: 'What this system does', pt: 'O que este sistema faz' })}</h2>
        {lang === 'en' ? (
          <p>
            On long missions, the crew needs to notice changes in their own health and know what to do, even with limited
            communication and medical resources. Vigília is not a dashboard of numbers: it compares each measurement with the
            astronaut’s <strong>individual baseline</strong>, recognises patterns across signals and explains the math behind
            each alert.
          </p>
        ) : (
          <p>
            Em missões longas, a tripulação precisa perceber mudanças na própria saúde e saber o que fazer, mesmo com
            comunicação e recursos médicos limitados. A Vigília não é um painel de números: ela compara cada medição com o{' '}
            <strong>baseline individual</strong> do astronauta, reconhece padrões entre sinais e explica a conta por trás de
            cada alerta.
          </p>
        )}
        <ol className="classes">
          {(['signal', 'accumulator', 'countermeasure'] as const).map((c) => (
            <li key={c}>
              <ClassChip varClass={c} /> <strong>{t(CLASS_LABEL[c])}</strong> — {t(CLASS_ROLE[c])}
            </li>
          ))}
        </ol>
        <p>
          {t({
            en: 'The rules are deterministic and auditable; no AI decides whether there is an alert. The app runs entirely on the device and keeps working without a link to Earth.',
            pt: 'As regras são determinísticas e auditáveis; nenhuma IA decide se há alerta. O app roda inteiro no dispositivo e continua funcionando sem link com a Terra.',
          })}
        </p>
      </section>

      <section className="panel" aria-labelledby="ind-table">
        <h2 id="ind-table">{t({ en: 'Indicator table', pt: 'Tabela de indicadores' })}</h2>
        <div className="table-scroll">
          <table className="evidence indicators-table">
            <thead>
              <tr>
                <th scope="col">{t({ en: 'Variable', pt: 'Variável' })}</th>
                <th scope="col">{t({ en: 'Unit', pt: 'Unidade' })}</th>
                <th scope="col">{t({ en: 'Class', pt: 'Classe' })}</th>
                <th scope="col">{t({ en: 'NASA hazard', pt: 'Perigo NASA' })}</th>
                <th scope="col">{t({ en: 'Associated risk', pt: 'Risco associado' })}</th>
                <th scope="col">{t({ en: 'Time constant', pt: 'Constante de tempo' })}</th>
                <th scope="col">{t({ en: 'Rule', pt: 'Regra' })}</th>
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
                    <td>{t(CLASS_LABEL[v.varClass])}</td>
                    <td>{v.hazards.map((h) => t(HAZARD_LABEL[h])).join(', ')}</td>
                    <td>{t(v.nasaRisk)}</td>
                    <td>{t(v.timeConstant)}</td>
                    <td>{t(v.ruleSummary)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          {t({
            en: 'Composite (derived): two or more of sleep ↓, HRV ↓ and resting HR ↑ deviating in the same 5-day window. Thresholds without a published source are marked as arbitrary in the alerts.',
            pt: 'Composto (derivado): dois ou mais de sono ↓, HRV ↓ e FC de repouso ↑ em desvio na mesma janela de 5 dias. Limiares sem fonte publicada aparecem marcados como arbitrários nos alertas.',
          })}
        </p>
      </section>

      <section className="panel prose">
        <h2>{t({ en: 'Limitations', pt: 'Limitações' })}</h2>
        <ul>
          <li>
            {t({
              en: 'Demo data is synthetic, within plausible ranges. There is no real astronaut telemetry.',
              pt: 'Os dados da demonstração são sintéticos, com faixas plausíveis. Não há telemetria real de astronauta.',
            })}
          </li>
          <li>
            {t({
              en: 'Alert thresholds are initial parameters, subject to clinical validation.',
              pt: 'Limiares de alerta são parâmetros iniciais, sujeitos a validação clínica.',
            })}
          </li>
          <li>
            {t({
              en: 'The system associates variables within the same time window; it does not model causality or predict clinical outcomes.',
              pt: 'O sistema associa variáveis na mesma janela de tempo; não modela causalidade nem prevê desfecho clínico.',
            })}
          </li>
          <li>
            {t({
              en: 'It does not replace medical assessment: it indicates when to escalate, never diagnoses.',
              pt: 'Não substitui avaliação médica: indica quando escalonar, nunca diagnostica.',
            })}
          </li>
          <li>
            {t({
              en: 'Bone loss and SANS are out of scope: time constants too long for the demo window, and a lack of data.',
              pt: 'Perda óssea e SANS ficaram fora: constantes de tempo longas demais para a janela da demo e falta de dados.',
            })}
          </li>
          <li>
            {t({
              en: 'The individual baseline requires a pre-flight logging period; without it, sensitivity drops.',
              pt: 'O baseline individual exige período pré-voo de registro; sem ele, a sensibilidade cai.',
            })}
          </li>
        </ul>
      </section>

      <section className="panel prose">
        <h2>{t({ en: 'References', pt: 'Referências' })}</h2>
        <h3>{t({ en: 'Official challenge resources', pt: 'Recursos oficiais do desafio' })}</h3>
        <ul className="refs">
          {OFFICIAL_RESOURCES.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.agency} — {s.title}
              </a>
            </li>
          ))}
        </ul>
        <h3>{t({ en: 'Sources cited by the rule engine', pt: 'Fontes citadas pelo motor de regras' })}</h3>
        <ul className="refs">
          {Object.values(ENGINE_SOURCES).map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
              <span className="muted small"> — {sourceUsedFor(s, lang)}</span>
            </li>
          ))}
        </ul>
        <p className="muted small">
          {t({
            en: 'NASA does not endorse non-government entities. Project developed for the NASA Space Apps Challenge 2026.',
            pt: 'A NASA não endossa entidades não governamentais. Projeto desenvolvido para o NASA Space Apps Challenge 2026.',
          })}
        </p>
      </section>

      <section className="panel prose" aria-labelledby="license-title">
        <h2 id="license-title">{t({ en: 'License and source code', pt: 'Licença e código-fonte' })}</h2>
        <p>
          {t({ en: 'Open-source project under the', pt: 'Projeto de código aberto sob a' })}{' '}
          <a href={LICENSE_URL} target="_blank" rel="noreferrer">
            Apache License 2.0 (Apache-2.0)
          </a>
          {t({
            en: ', an OSI-approved license. Source code, demo data and tests:',
            pt: ', licença aprovada pela OSI. Código-fonte, dados de demonstração e testes:',
          })}{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            github.com/WedersonSantos/Nasa-Space-Apps---Health-Monitoring
          </a>
          .
        </p>
        <p className="muted small">
          {t({
            en: 'Third-party libraries: React, Recharts and Vite (MIT); TypeScript (Apache-2.0).',
            pt: 'Bibliotecas de terceiros: React, Recharts e Vite (MIT); TypeScript (Apache-2.0).',
          })}
        </p>
      </section>

      <section className="panel prose">
        <h2>{t({ en: 'Use of AI', pt: 'Uso de IA' })}</h2>
        <p>
          {t({
            en: 'Generative AI tools were used as programming and writing assistants. AI plays no part in the alert engine: every decision comes from deterministic rules, with the formula visible in the alert itself.',
            pt: 'Ferramentas de IA generativa foram usadas como assistentes de programação e redação. A IA não participa do motor de alertas: toda decisão sai de regras determinísticas, com a fórmula visível no próprio alerta.',
          })}
        </p>
      </section>
    </div>
  );
}
