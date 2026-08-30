/** Límites del plan Free — enforced en server actions de carta. */
export const FREE_PLAN_MAX_PRODUCTS = 25;
export const FREE_PLAN_MAX_CATEGORIES = 5;

export function freePlanLimitsLabel(products: number, categories: number) {
  return `${products}/${FREE_PLAN_MAX_PRODUCTS} productos · ${categories}/${FREE_PLAN_MAX_CATEGORIES} categorías`;
}

export function isFreePlan(plan: string) {
  return plan === "free" || !plan;
}
