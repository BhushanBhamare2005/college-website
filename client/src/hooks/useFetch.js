import { useCallback, useEffect, useRef, useState } from 'react';

// Runs `fn` whenever `deps` change; ignores stale responses; exposes reload().
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const tick = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    const id = ++tick.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current()
      .then((res) => { if (id === tick.current) setState({ data: res.data, meta: res.meta || null, loading: false, error: null }); })
      .catch((err) => { if (id === tick.current) setState({ data: null, meta: null, loading: false, error: err }); });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);
  return { ...state, reload: run };
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
