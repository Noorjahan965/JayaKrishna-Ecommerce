import { useEffect, useState } from 'react';

// Tiny async-data hook. Pages are written against promises, so the static → API switch needs no page changes.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((error) => live && setState({ data: null, error, loading: false }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Jayakrishna Flour Mill` : 'Jayakrishna Flour Mill | Pure Unbleached Maida, Madurai';
  }, [title]);
}
