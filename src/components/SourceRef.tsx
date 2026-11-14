import { resolveSourceRef } from '../config/sources';
import { useT } from '../i18n';
import { Link } from './Icons';

/** Shows an alert's source; a threshold without a source is declared arbitrary (rule 3). */
export function SourceRef({ refText }: { refText: string }) {
  const t = useT();
  const r = resolveSourceRef(refText);
  return (
    <div className="source-ref">
      {r.arbitrary && (
        <span
          className="arbitrary-flag"
          title={t({
            en: 'Threshold without a published source: initial parameter, subject to clinical validation',
            pt: 'Limiar sem fonte publicada: parâmetro inicial, sujeito a validação clínica',
          })}
        >
          {t({ en: 'Arbitrary threshold · subject to clinical validation', pt: 'Limiar arbitrário · sujeito a validação clínica' })}
        </span>
      )}
      <span className="source-ref__label">{r.arbitrary ? t({ en: 'Context:', pt: 'Contexto:' }) : t({ en: 'Source:', pt: 'Fonte:' })}</span>
      {r.links.length > 0 ? (
        r.links.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
            {l.label} <Link />
          </a>
        ))
      ) : (
        <span>{r.raw}</span>
      )}
    </div>
  );
}
