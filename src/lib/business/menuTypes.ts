export type ProductOptionGroup = {
  id?: string;
  title: string;
  choices: string[];
};

export type MenuCategoryRow = {
  id: string;
  business_id: string;
  name: string;
  sort_order: number;
};

export type MenuProductRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  category: string | null;
  category_id: string | null;
  price_cents: number;
  available: boolean;
  image_path: string | null;
  icon_path: string | null;
  ingredients?: string[];
  options?: ProductOptionGroup[];
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type MenuProductView = MenuProductRow & {
  iconUrl?: string;
  photoUrl?: string;
  categoryName?: string;
};

export type MenuCategoryView = MenuCategoryRow;
