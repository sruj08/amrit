import { useEffect, useState } from "react";

// Simulated pipeline load (PRD Rule 6): ~800ms before content fades in. Makes
// the app feel like it is executing computation rather than reading a file.
export function usePageLoad(ms = 800): boolean {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loaded;
}
