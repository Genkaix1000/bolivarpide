/** Rating / reviews display helpers for public store UI. */

export function isNewStore(reviewsCount: number): boolean {
  return !reviewsCount || reviewsCount <= 0;
}

export function formatStoreRating(rating: number): string {
  if (!rating || rating <= 0) return "—";
  return rating.toFixed(1).replace(".", ",");
}
