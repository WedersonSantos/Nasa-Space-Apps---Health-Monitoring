import { resolveSourceRef } from '../config/sources';
import { Link } from './Icons';

/** Shows an alert's source; a threshold without a source is declared arbitrary (rule 3). */
export function SourceRef({ refText }: { refText: string }) {
  const r = resolveSourceRef(refText);
  return (
    <div className="source-ref">
      {r.arbitrary && (
        <span className="arbitrary-flag" title="Threshold without a published source: initial parameter, subject to clinical validation">
          Arbitrary threshold · subject to clinical validation
        </span>
      )}
      <span className="source-ref__label">{r.arbitrary ? 'Context:' : 'Source:'}</span>
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
