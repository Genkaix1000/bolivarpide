# TDD — 02: Base de Datos & Queries de Feed

> **Módulo:** `06-marketplace-cliente`  
> **Fase:** 6  

---

## 1. Query de Comercios Publicados (`src/lib/marketplace/getBusinesses.ts`)

```typescript
import { createClient } from '@/lib/supabase/server';

export async function getPublishedBusinesses() {
  const supabase = await createClient();

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      id,
      slug,
      name,
      tagline,
      logo_path,
      banner_path,
      is_open,
      prep_time_minutes,
      rating,
      reviews_count,
      business_hours (weekday, open_time, close_time, closed)
    `)
    .eq('published', true)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }

  return businesses;
}
```
