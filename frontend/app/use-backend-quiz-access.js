'use client';

import { useEffect, useState } from 'react';

/** Mantém a liberação durante a visita, mesmo ao reiniciar ou revisar outra execução. */
export default function useBackendQuizAccess(completed) {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { if (completed) setUnlocked(true); }, [completed]);
  return unlocked;
}
