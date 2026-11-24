/** Saltos no histórico não contam: apenas etapas cuja reprodução terminou entram no conjunto. */
export function hasCompletedPlayback(viewed, count) {
  return count > 0 && Array.from({ length: count }, (_, index) => index).every(index => viewed.has(index));
}
