import { resolveSourceRef } from '../config/sources';
import { Link } from './Icons';

/** Exibe a fonte de um alerta; limiar sem fonte aparece declarado como arbitrário (regra 3). */
export function SourceRef({ refText }: { refText: string }) {
  const r = resolveSourceRef(refText);
  return (
    <div className="source-ref">
      {r.arbitrary && (
        <span className="arbitrary-flag" title="Limiar sem fonte publicada: parâmetro inicial, sujeito a validação clínica">
          Limiar arbitrário · sujeito a validação clínica
        </span>
      )}
      <span className="source-ref__label">{r.arbitrary ? 'Contexto:' : 'Fonte:'}</span>
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
