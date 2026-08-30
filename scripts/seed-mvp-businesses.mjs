/**
 * Seed de comercios y cartas completas para presentación MVP.
 * Uso:
 *   node scripts/seed-mvp-businesses.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const MVP_BUSINESSES = [
  {
    slug: "burgerboz",
    name: "Burger Boz",
    tagline: "Hamburguesas 100% Smoked Beef",
    category: "Hamburguesas",
    address: "Av. 25 de Mayo 312, Bolívar",
    city: "Bolívar",
    province: "Buenos Aires",
    phone: "+54 9 2314 40-1122",
    logo_path: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
    banner_path: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    reviews_count: 154,
    prep_time_minutes: 20,
    is_open: true,
    published: true,
    categories: [
      {
        name: "Hamburguesas Especiales",
        sort_order: 1,
        products: [
          {
            name: "Burger Beef 'Anjaz'",
            description: "Doble smash beef, cheddar ahumado derretido, panceta crocante y nuestra clásica salsa Anjaz secreta en pan brioche.",
            price_cents: 590000,
            image_path: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
            sort_order: 1,
            options: [
              {
                name: "Punto de cocción",
                required: true,
                choices: [
                  { label: "Jugoso" },
                  { label: "A punto" },
                  { label: "Bien cocido" }
                ]
              },
              {
                name: "Extras",
                required: false,
                multi: true,
                choices: [
                  { label: "Bacon extra", priceDelta: 800 },
                  { label: "Huevo frito", priceDelta: 500 },
                  { label: "Doble cheddar", priceDelta: 600 }
                ]
              }
            ]
          },
          {
            name: "Doble Cheddar Burger",
            description: "Doble medallón 120g, cuádruple cheddar fundido, cebolla crispy y salsa barbacoa ahumada.",
            price_cents: 640000,
            image_path: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
            sort_order: 2
          },
          {
            name: "Smash Bacon Clásica",
            description: "Medallón simple 120g, queso dambo, panceta ahumada, tomate, lechuga y mayonesa de hierbas.",
            price_cents: 520000,
            image_path: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80",
            sort_order: 3
          }
        ]
      },
      {
        name: "Acompañamientos & Bebidas",
        sort_order: 2,
        products: [
          {
            name: "Papas Rústicas Cheddar & Bacon",
            description: "Porción abundante de papas cortadas a mano con lluvia de cheddar caliente y ciboulette.",
            price_cents: 360000,
            image_path: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          },
          {
            name: "Gaseosa 500ml",
            description: "Línea Coca-Cola bien fría a elección.",
            price_cents: 140000,
            image_path: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
            sort_order: 2
          }
        ]
      }
    ]
  },
  {
    slug: "pizzastore",
    name: "Pizza Store",
    tagline: "Pizzas de Masa Madre a la Leña",
    category: "Pizzas",
    address: "Alsina 520, Bolívar",
    city: "Bolívar",
    province: "Buenos Aires",
    phone: "+54 9 2314 42-8833",
    logo_path: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=300&q=80",
    banner_path: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    rating: 4.7,
    reviews_count: 98,
    prep_time_minutes: 25,
    is_open: true,
    published: true,
    categories: [
      {
        name: "Pizzas Especiales",
        sort_order: 1,
        products: [
          {
            name: "Cheese Meat Pizza",
            description: "Muzzarella, pepperoni artesanal, bondiola ahumada a la leña, provolone rallado y orégano fresco.",
            price_cents: 680000,
            image_path: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80",
            sort_order: 1,
            options: [
              {
                name: "Tamaño",
                required: true,
                choices: [
                  { label: "Individual (4 porciones)" },
                  { label: "Grande (8 porciones)", priceDelta: 1800 }
                ]
              }
            ]
          },
          {
            name: "Pizza Margherita Di Bufala",
            description: "Salsa de tomate natural, muzzarella fior di latte, albahaca fresca y aceite de oliva extra virgen.",
            price_cents: 590000,
            image_path: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80",
            sort_order: 2
          },
          {
            name: "Fugazzeta Rellena de la Casa",
            description: "Doble masa rellena con abundante queso cuartirolo y muzzarella, cubierta con cebollas caramelizadas.",
            price_cents: 650000,
            image_path: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
            sort_order: 3
          }
        ]
      },
      {
        name: "Entradas & Bebidas",
        sort_order: 2,
        products: [
          {
            name: "Bastones de Ajo & Queso",
            description: "Tiras de masa madre crujientes con manteca de ajo, orégano y dip de salsa pomodoro.",
            price_cents: 290000,
            image_path: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          },
          {
            name: "Cerveza Artesanal IPA 473ml",
            description: "Lata fría de IPA cítrica y aromática.",
            price_cents: 220000,
            image_path: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80",
            sort_order: 2
          }
        ]
      }
    ]
  },
  {
    slug: "mccafe",
    name: "McCafé",
    tagline: "Croissants & Café de Especialidad",
    category: "Cafetería",
    address: "San Martín 845, Bolívar",
    city: "Bolívar",
    province: "Buenos Aires",
    phone: "+54 9 2314 41-5544",
    logo_path: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80",
    banner_path: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviews_count: 210,
    prep_time_minutes: 15,
    is_open: true,
    published: true,
    categories: [
      {
        name: "Combos & Desayunos",
        sort_order: 1,
        products: [
          {
            name: "Cappuccino & Medialuna de Manteca",
            description: "Café espresso doble con espuma cremosa de leche y medialuna artesanal almibarada.",
            price_cents: 340000,
            image_path: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          },
          {
            name: "Latte Vainilla & Cookie XL",
            description: "Latte suave con toque de vainilla natural y cookie de chocolate semiamargo con chips.",
            price_cents: 390000,
            image_path: "https://images.unsplash.com/photo-1572442388796-11668ba67e53?auto=format&fit=crop&w=600&q=80",
            sort_order: 2
          }
        ]
      },
      {
        name: "Bakery & Dulces",
        sort_order: 2,
        products: [
          {
            name: "Muffin de Chocolate Belga",
            description: "Bizcochuelo húmedo relleno de dulce de leche y corazón de chocolate fundido.",
            price_cents: 190000,
            image_path: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          },
          {
            name: "Croissant Relleno Jamón y Queso",
            description: "Masa hojaldrada francesa dorada a la manteca, rellena con jamón cocido natural y queso fontina gratinado.",
            price_cents: 280000,
            image_path: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
            sort_order: 2
          }
        ]
      }
    ]
  },
  {
    slug: "sushiworld",
    name: "Sushi World",
    tagline: "Sushi Premium & Wok Oriental",
    category: "Sushi",
    address: "Rivadavia 190, Bolívar",
    city: "Bolívar",
    province: "Buenos Aires",
    phone: "+54 9 2314 43-2211",
    logo_path: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80",
    banner_path: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviews_count: 87,
    prep_time_minutes: 30,
    is_open: true,
    published: true,
    categories: [
      {
        name: "Combinados & Rolls",
        sort_order: 1,
        products: [
          {
            name: "Salmon Roll Combo (12 piezas)",
            description: "Mix premium de New York con palta, Philadelphia roll con sésamo tostado y Maki de salmón fresco.",
            price_cents: 1250000,
            image_path: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          },
          {
            name: "Ebi Roll Langostinos Furai (8 piezas)",
            description: "Langostinos rebozados en panko crujiente, queso crema y palta, cubierto con salsa teriyaki y sésamo.",
            price_cents: 890000,
            image_path: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=600&q=80",
            sort_order: 2
          }
        ]
      },
      {
        name: "Woks & Calientes",
        sort_order: 2,
        products: [
          {
            name: "Wok de Pollo & Vegetales Orientales",
            description: "Fideos de trigo salteados al wok con pechuga de pollo, pimientos, cebolla morada, brotes de soja y salsa de ostras.",
            price_cents: 680000,
            image_path: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          }
        ]
      }
    ]
  },
  {
    slug: "empanadas-bolivar",
    name: "Empanadas Bolívar",
    tagline: "Artesanales Cortadas a Cuchillo",
    category: "Empanadas",
    address: "Mitre 410, Bolívar",
    city: "Bolívar",
    province: "Buenos Aires",
    phone: "+54 9 2314 45-7766",
    logo_path: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=300&q=80",
    banner_path: "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    reviews_count: 176,
    prep_time_minutes: 20,
    is_open: true,
    published: true,
    categories: [
      {
        name: "Docenas & Promos",
        sort_order: 1,
        products: [
          {
            name: "Docena de Empanadas a Elección",
            description: "12 unidades surtidas a gusto (Carne a cuchillo, Jamón y Queso, Pollo, Humita, Caprese, Verdura).",
            price_cents: 980000,
            image_path: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          },
          {
            name: "Media Docena + Gaseosa 1.5L",
            description: "6 empanadas calientes a elección con bebida grande para compartir.",
            price_cents: 640000,
            image_path: "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=600&q=80",
            sort_order: 2
          }
        ]
      }
    ]
  },
  {
    slug: "helados-dolce",
    name: "Heladería Dolce",
    tagline: "Helados Artesanales & Postres",
    category: "Helados",
    address: "General Paz 720, Bolívar",
    city: "Bolívar",
    province: "Buenos Aires",
    phone: "+54 9 2314 49-3300",
    logo_path: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=300&q=80",
    banner_path: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviews_count: 240,
    prep_time_minutes: 15,
    is_open: true,
    published: true,
    categories: [
      {
        name: "Potes de Helado",
        sort_order: 1,
        products: [
          {
            name: "Pote de 1 Kg (Hasta 4 sabores)",
            description: "Incluye cucuruchos y vasitos descartables. Elegí Dulce de Leche Granizado, Chocolate Amargo, Frutilla al Agua y más.",
            price_cents: 850000,
            image_path: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          },
          {
            name: "Pote de 1/2 Kg (Hasta 3 sabores)",
            description: "Ideal para disfrutar en pareja o postre individual.",
            price_cents: 480000,
            image_path: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
            sort_order: 2
          }
        ]
      }
    ]
  }
];

async function main() {
  console.log("🌱 Insertando comercios, categorías y productos para MVP...");

  for (const biz of MVP_BUSINESSES) {
    const { categories, ...bizFields } = biz;

    // 1. Upsert business
    const { data: existingBiz } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", biz.slug)
      .maybeSingle();

    let businessId = existingBiz?.id;

    if (businessId) {
      const { error: updErr } = await supabase
        .from("businesses")
        .update(bizFields)
        .eq("id", businessId);
      if (updErr) {
        console.error(`❌ Error actualizando negocio ${biz.name}:`, updErr.message);
        continue;
      }
      console.log(`🔄 Actualizado negocio: ${biz.name}`);
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from("businesses")
        .insert(bizFields)
        .select("id")
        .single();
      if (insErr) {
        console.error(`❌ Error insertando negocio ${biz.name}:`, insErr.message);
        continue;
      }
      businessId = inserted.id;
      console.log(`✅ Creado nuevo negocio: ${biz.name}`);
    }

    // 2. Limpiar categorías anteriores para insertar menú actualizado
    await supabase.from("products").delete().eq("business_id", businessId);
    await supabase.from("menu_categories").delete().eq("business_id", businessId);

    // 3. Insertar categorías y productos
    for (const cat of categories) {
      const { data: catRow, error: catErr } = await supabase
        .from("menu_categories")
        .insert({
          business_id: businessId,
          name: cat.name,
          sort_order: cat.sort_order
        })
        .select("id")
        .single();

      if (catErr) {
        console.error(`❌ Error insertando categoría ${cat.name}:`, catErr.message);
        continue;
      }

      const productsToInsert = cat.products.map((p) => ({
        business_id: businessId,
        category_id: catRow.id,
        name: p.name,
        description: p.description || null,
        price_cents: p.price_cents,
        image_path: p.image_path || null,
        sort_order: p.sort_order || 0,
        options: p.options || [],
        available: true
      }));

      const { error: prodErr } = await supabase
        .from("products")
        .insert(productsToInsert);

      if (prodErr) {
        console.error(`❌ Error insertando productos de ${cat.name}:`, prodErr.message);
      } else {
        console.log(`   📂 Categoría '${cat.name}' con ${productsToInsert.length} productos.`);
      }
    }
  }

  console.log("\n🎉 ¡Seed MVP completada exitosamente! Todos los comercios y cartas están listos.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
