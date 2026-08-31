export type ChatOrderStatus = "pending" | "preparing" | "delivering" | "ready" | "delivered" | "cancelled";

export type ChatOrderItem = {
  name: string;
  quantity: number;
  priceCents: number;
  options?: string[];
  notes?: string;
};

export type ChatActiveOrder = {
  id: string;
  orderNumber: number;
  status: ChatOrderStatus;
  statusLabel: string;
  createdAt: string;
  estimatedDelivery?: string;
  totalCents: number;
  paymentMethod: "cash" | "mercadopago" | "transfer";
  paymentStatus: "paid" | "pending";
  items: ChatOrderItem[];
  driverName?: string;
  driverPhone?: string;
};

export type PastOrder = {
  id: string;
  orderNumber: number;
  date: string;
  totalCents: number;
  status: "delivered" | "cancelled";
  itemsSummary: string;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  avatarEmoji?: string;
  address: string;
  notes?: string;
  tags: string[];
  totalOrdersCount: number;
  isFavorite?: boolean;
};

export type MessageType = "text" | "audio" | "image" | "system_order_event";

export type ChatMessage = {
  id: string;
  sender: "customer" | "business";
  type: MessageType;
  text?: string;
  audioDuration?: string;
  imageUrl?: string;
  systemEvent?: {
    title: string;
    description: string;
    status: ChatOrderStatus;
  };
  timestamp: string;
  status?: "sent" | "delivered" | "read";
};

export type Conversation = {
  id: string;
  customer: CustomerProfile;
  activeOrder?: ChatActiveOrder;
  pastOrders: PastOrder[];
  sharedMedia: { id: string; url: string; label: string; date: string }[];
  unreadCount: number;
  lastMessage: {
    text: string;
    timestamp: string;
    sender: "customer" | "business";
    unread?: boolean;
  };
  messages: ChatMessage[];
};

export const QUICK_RESPONSES = [
  { id: "qr-1", label: "👨‍🍳 En cocina", text: "¡Hola! Tu pedido ya está en preparación en la cocina. Te avisamos ni bien salga con el repartidor." },
  { id: "qr-2", label: "🛵 En camino", text: "¡Buenas noticias! Tu pedido acaba de salir con el repartidor. Llegará en aproximadamente 15-20 minutos." },
  { id: "qr-3", label: "⏳ Demora", text: "Hola, te contamos que tenemos una demora extra de 15 minutos por alta demanda en cocina. ¡Ya estamos acelerando tu comanda!" },
  { id: "qr-4", label: "💳 Alias / CBU", text: "Podés abonar por transferencia al alias: bolivarpide.mp (Titular: Comercio). Por favor envianos el comprobante." },
  { id: "qr-5", label: "📋 Carta digital", text: "¡Hola! Podés ver nuestra carta completa y promociones actualizadas ingresando a nuestro catálogo online." },
  { id: "qr-6", label: "📍 Confirmar dirección", text: "Por favor, ¿nos confirmás entre qué calles se encuentra el domicilio y si hay algún timbre o referencia?" },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    customer: {
      id: "cust-1",
      name: "Ricky Smith",
      phone: "+54 9 2314 48-1290",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      address: "Av. San Martín 450, Piso 2 B",
      notes: "Cliente frecuente. Sin cebolla en las hamburguesas.",
      tags: ["Frecuente", "Delivery"],
      totalOrdersCount: 14,
      isFavorite: true,
    },
    activeOrder: {
      id: "ord-104",
      orderNumber: 104,
      status: "preparing",
      statusLabel: "En Cocina",
      createdAt: "Hace 18 min",
      estimatedDelivery: "21:45 (en 15 min)",
      totalCents: 1850000,
      paymentMethod: "mercadopago",
      paymentStatus: "paid",
      driverName: "Lucas Benítez",
      driverPhone: "+54 9 2314 55-4321",
      items: [
        {
          name: "Burger Doble Cheddar",
          quantity: 2,
          priceCents: 750000,
          options: ["Papas rústicas", "Sin cebolla"],
          notes: "Punto bien cocido por favor",
        },
        {
          name: "Coca-Cola Zero 500ml",
          quantity: 2,
          priceCents: 175000,
        },
      ],
    },
    pastOrders: [
      {
        id: "ord-091",
        orderNumber: 91,
        date: "24 Ago 2026",
        totalCents: 1620000,
        status: "delivered",
        itemsSummary: "2× Burger Smash · 1× Papas Cheddar",
      },
      {
        id: "ord-078",
        orderNumber: 78,
        date: "18 Ago 2026",
        totalCents: 950000,
        status: "delivered",
        itemsSummary: "1× Pizza Especial Muzzarella",
      },
      {
        id: "ord-062",
        orderNumber: 62,
        date: "05 Ago 2026",
        totalCents: 1400000,
        status: "delivered",
        itemsSummary: "2× Lomito Completo",
      },
    ],
    sharedMedia: [
      { id: "m-1", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80", label: "Foto pedido", date: "Hoy 21:10" },
      { id: "m-2", url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80", label: "Comprobante", date: "24 Ago" },
    ],
    unreadCount: 0,
    lastMessage: {
      text: "¡Genial, gracias por avisar! Quedo atento al timbre 🍔",
      timestamp: "21:28",
      sender: "customer",
    },
    messages: [
      {
        id: "m-101",
        sender: "customer",
        type: "text",
        text: "¡Hola buenas noches! Acabo de hacer el pedido #104 por la web, ¿llegó bien?",
        timestamp: "21:12",
        status: "read",
      },
      {
        id: "m-102",
        sender: "business",
        type: "text",
        text: "¡Hola Ricky! Sí, perfecto, ya entró en sistema y confirmamos el pago de Mercado Pago 🚀",
        timestamp: "21:14",
        status: "read",
      },
      {
        id: "m-103",
        sender: "business",
        type: "system_order_event",
        systemEvent: {
          title: "Comanda ingresada a cocina",
          description: "Pedido #104 · 2× Burger Doble Cheddar · 2× Bebidas",
          status: "preparing",
        },
        timestamp: "21:15",
      },
      {
        id: "m-104",
        sender: "customer",
        type: "audio",
        audioDuration: "0:24",
        timestamp: "21:16",
        status: "read",
      },
      {
        id: "m-105",
        sender: "business",
        type: "text",
        text: "Anotadísimo: sin cebolla y bien crocantes las papas rústicas. En unos 15 minutos te lo lleva Lucas.",
        timestamp: "21:18",
        status: "read",
      },
      {
        id: "m-106",
        sender: "customer",
        type: "text",
        text: "¡Genial, gracias por avisar! Quedo atento al timbre 🍔",
        timestamp: "21:28",
        status: "read",
      },
    ],
  },
  {
    id: "conv-2",
    customer: {
      id: "cust-2",
      name: "Stephanie Sharkey",
      phone: "+54 9 2314 52-8874",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      address: "General Paz 820",
      notes: "Tocar bocina al llegar, timbre roto.",
      tags: ["Delivery", "En camino"],
      totalOrdersCount: 6,
    },
    activeOrder: {
      id: "ord-103",
      orderNumber: 103,
      status: "delivering",
      statusLabel: "En Camino",
      createdAt: "Hace 35 min",
      estimatedDelivery: "Llegando (5 min)",
      totalCents: 1240000,
      paymentMethod: "cash",
      paymentStatus: "pending",
      driverName: "Mateo Rossi",
      driverPhone: "+54 9 2314 66-9988",
      items: [
        {
          name: "Empanadas Salteñas (Docena)",
          quantity: 1,
          priceCents: 1240000,
          options: ["6 Carne suave", "6 Jamón y queso"],
        },
      ],
    },
    pastOrders: [
      {
        id: "ord-085",
        orderNumber: 85,
        date: "20 Ago 2026",
        totalCents: 1240000,
        status: "delivered",
        itemsSummary: "1× Empanadas Salteñas (Docena)",
      },
    ],
    sharedMedia: [
      { id: "m-3", url: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&auto=format&fit=crop&q=80", label: "Fachada casa", date: "Hoy" },
    ],
    unreadCount: 1,
    lastMessage: {
      text: "¿El cadete tiene cambio de $15.000?",
      timestamp: "21:30",
      sender: "customer",
      unread: true,
    },
    messages: [
      {
        id: "m-201",
        sender: "business",
        type: "system_order_event",
        systemEvent: {
          title: "Pedido despachado con repartidor",
          description: "Pedido #103 · Repartidor Mateo Rossi",
          status: "delivering",
        },
        timestamp: "21:25",
      },
      {
        id: "m-202",
        sender: "business",
        type: "text",
        text: "¡Hola Stephanie! Tu docena de empanadas ya está en camino con Mateo.",
        timestamp: "21:26",
        status: "delivered",
      },
      {
        id: "m-203",
        sender: "customer",
        type: "text",
        text: "¿El cadete tiene cambio de $15.000?",
        timestamp: "21:30",
        status: "delivered",
      },
    ],
  },
  {
    id: "conv-3",
    customer: {
      id: "cust-3",
      name: "Rodger Struck",
      phone: "+54 9 2314 41-3319",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      address: "Mitre 1120 (Take away)",
      notes: "Pasa a retirar por el local.",
      tags: ["Take Away", "Listo"],
      totalOrdersCount: 22,
      isFavorite: true,
    },
    activeOrder: {
      id: "ord-105",
      orderNumber: 105,
      status: "ready",
      statusLabel: "Listo para retirar",
      createdAt: "Hace 22 min",
      totalCents: 890000,
      paymentMethod: "transfer",
      paymentStatus: "paid",
      items: [
        {
          name: "Sándwich de Milanesa Completo",
          quantity: 1,
          priceCents: 890000,
          options: ["Pan casero", "Lechuga, tomate y huevo"],
        },
      ],
    },
    pastOrders: [
      {
        id: "ord-099",
        orderNumber: 99,
        date: "28 Ago 2026",
        totalCents: 890000,
        status: "delivered",
        itemsSummary: "1× Sándwich de Milanesa Completo",
      },
    ],
    sharedMedia: [
      { id: "m-4", url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=400&auto=format&fit=crop&q=80", label: "Comprobante", date: "Hoy" },
    ],
    unreadCount: 0,
    lastMessage: {
      text: "¡Ya estoy pasando a buscarlo!",
      timestamp: "21:20",
      sender: "customer",
    },
    messages: [
      {
        id: "m-301",
        sender: "business",
        type: "system_order_event",
        systemEvent: {
          title: "Pedido listo en mostrador",
          description: "Pedido #105 · Listo para entregar",
          status: "ready",
        },
        timestamp: "21:18",
      },
      {
        id: "m-302",
        sender: "business",
        type: "text",
        text: "¡Hola Rodger! Tu mila ya está lista y empaquetada en el mostrador 🥪",
        timestamp: "21:19",
        status: "read",
      },
      {
        id: "m-303",
        sender: "customer",
        type: "text",
        text: "¡Ya estoy pasando a buscarlo!",
        timestamp: "21:20",
        status: "read",
      },
    ],
  },
  {
    id: "conv-4",
    customer: {
      id: "cust-4",
      name: "Jerry Helfer",
      phone: "+54 9 2314 62-1144",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      address: "Alberdi 340",
      tags: ["Consulta", "Nuevo"],
      totalOrdersCount: 1,
    },
    pastOrders: [],
    sharedMedia: [],
    unreadCount: 2,
    lastMessage: {
      text: "¿Tienen opciones vegetarianas o sin TACC en la carta?",
      timestamp: "20:55",
      sender: "customer",
      unread: true,
    },
    messages: [
      {
        id: "m-401",
        sender: "customer",
        type: "text",
        text: "¡Hola! Buenas noches, quería hacerles una consulta sobre el menú.",
        timestamp: "20:54",
        status: "delivered",
      },
      {
        id: "m-402",
        sender: "customer",
        type: "text",
        text: "¿Tienen opciones vegetarianas o sin TACC en la carta?",
        timestamp: "20:55",
        status: "delivered",
      },
    ],
  },
  {
    id: "conv-5",
    customer: {
      id: "cust-5",
      name: "Lorri Warf",
      phone: "+54 9 2314 49-5566",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      address: "Pellegrini 980",
      tags: ["Entregado"],
      totalOrdersCount: 8,
    },
    pastOrders: [
      {
        id: "ord-101",
        orderNumber: 101,
        date: "Hoy 19:40",
        totalCents: 2150000,
        status: "delivered",
        itemsSummary: "2× Pizza Muzzarella · 1× Faina · 1× Cerveza",
      },
    ],
    sharedMedia: [],
    unreadCount: 0,
    lastMessage: {
      text: "¡Riquísimas las pizzas como siempre! Muchas gracias ✨",
      timestamp: "20:30",
      sender: "customer",
    },
    messages: [
      {
        id: "m-501",
        sender: "business",
        type: "system_order_event",
        systemEvent: {
          title: "Pedido entregado con éxito",
          description: "Pedido #101 · Entregado a las 20:15",
          status: "delivered",
        },
        timestamp: "20:15",
      },
      {
        id: "m-502",
        sender: "customer",
        type: "text",
        text: "¡Riquísimas las pizzas como siempre! Muchas gracias ✨",
        timestamp: "20:30",
        status: "read",
      },
    ],
  },
  {
    id: "conv-6",
    customer: {
      id: "cust-6",
      name: "Frances Swann",
      phone: "+54 9 2314 58-0099",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      address: "Lavalle 510",
      tags: ["Consulta"],
      totalOrdersCount: 3,
    },
    pastOrders: [],
    sharedMedia: [],
    unreadCount: 0,
    lastMessage: {
      text: "Dale, más tarde hago el pedido desde la app. ¡Gracias!",
      timestamp: "19:15",
      sender: "customer",
    },
    messages: [
      {
        id: "m-601",
        sender: "customer",
        type: "text",
        text: "¿Hasta qué hora tienen abierta la cocina hoy?",
        timestamp: "19:10",
        status: "read",
      },
      {
        id: "m-602",
        sender: "business",
        type: "text",
        text: "¡Hola Frances! Tomamos pedidos hasta las 23:45 hs.",
        timestamp: "19:12",
        status: "read",
      },
      {
        id: "m-603",
        sender: "customer",
        type: "text",
        text: "Dale, más tarde hago el pedido desde la app. ¡Gracias!",
        timestamp: "19:15",
        status: "read",
      },
    ],
  },
];
