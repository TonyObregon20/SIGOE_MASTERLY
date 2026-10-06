export const STAGES = ["Tendido", "Corte", "Costura", "Limpieza", "Planchado y Empaquetado"];

export const INITIAL_PRODUCTS = [
  {
    id: "1",
    name: "Camisa Oxford Blanca Premium",
    price: 120,
    image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800",
    stockPhysical: 10,
    stockCommitted: 0,
    minStock: 20,
    category: "Formal",
    description: "Camisa 100% algodón de alta densidad con acabado Oxford.",
    isPublic: true
  },
  {
    id: "2",
    name: "Camisa Lino Azul Cielo",
    price: 95,
    image: "https://images.unsplash.com/photo-1598032895397-b9472434ef93?auto=format&fit=crop&q=80&w=800",
    stockPhysical: 10,
    stockCommitted: 0,
    minStock: 15,
    category: "Casual",
    description: "Frescura y estilo para climas cálidos.",
    isPublic: true
  },
  {
    id: "3",
    name: "Camisa Franela Cuadros Roja",
    price: 85,
    image: "https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?auto=format&fit=crop&q=80&w=800",
    stockPhysical: 10,
    stockCommitted: 0,
    minStock: 10,
    category: "Casual",
    description: "Comodidad y calidez para el uso diario.",
    isPublic: true
  },
  {
    id: "4",
    name: "Camisa de Pana Verde Bosque",
    price: 150,
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
    stockPhysical: 10,
    stockCommitted: 0,
    minStock: 5,
    category: "Exterior",
    description: "Robustez y elegancia para el aire libre.",
    isPublic: true
  }
];

export const INITIAL_SUPPLIERS = [
  { id: "S1", name: "Textiles El Cóndor", contact: "Juan Perez", email: "ventas@condor.com", category: "Telas" },
  { id: "S2", name: "Botones & Cierres S.A.", contact: "Maria Garcia", email: "maria@botones.com", category: "Insumos" }
];

export const INITIAL_USERS = [
  {
    id: "U1",
    name: "Admin Masterly",
    email: "admin@masterly.com",
    password: "admin",
    role: "admin",
    creditEnabled: false,
    creditLimit: 0,
    creditUsed: 0,
    joinDate: "2024-01-01"
  },
  {
    id: "U2",
    name: "Roberto Gómez",
    email: "roberto@email.com",
    password: "password123",
    role: "customer",
    creditEnabled: true,
    creditLimit: 5000,
    creditUsed: 0,
    joinDate: "2024-02-15"
  },
  {
    id: "U3",
    name: "Tienda Central Tacna",
    email: "tacna@email.com",
    password: "password123",
    role: "customer",
    creditEnabled: false,
    creditLimit: 0,
    creditUsed: 0,
    joinDate: "2024-03-10"
  },
  {
    id: "U4",
    name: "Usuario de Prueba",
    email: "test@masterly.com",
    password: "password123",
    role: "customer",
    creditEnabled: true,
    creditLimit: 10000,
    creditUsed: 0,
    joinDate: "2024-05-09"
  }
];

export const INITIAL_ORDERS = [
  {
    id: "ORD-1001",
    userId: "U2",
    customerName: "Roberto Gómez",
    type: "pedido",
    total: 6000,
    initialPayment: 3000,
    date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    items: [
      {
        productId: "1",
        productName: "Camisa Oxford Blanca Premium",
        quantity: 50,
        price: 120,
        selectedSize: "M"
      }
    ]
  },
  {
    id: "ORD-1002",
    userId: "U3",
    customerName: "Tienda Central Tacna",
    type: "pedido",
    total: 2850,
    initialPayment: 1425,
    date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    items: [
      {
        productId: "2",
        productName: "Camisa Lino Azul Cielo",
        quantity: 30,
        price: 95,
        selectedSize: "L"
      }
    ]
  }
];

export const INITIAL_PRODUCTION_ORDERS = [
  {
    id: "OP-101",
    orderId: "ORD-1001",
    items: [
      {
        productId: "1",
        productName: "Camisa Oxford Blanca Premium",
        quantityOrdered: 50,
        quantityExtras: 2,
        selectedSize: "M",
        sizeDistribution: { S: 10, M: 25, L: 15 }
      }
    ],
    currentStage: "Tendido",
    progress: 20,
    startDate: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    stages: [
      { name: "Tendido", status: "in-progress", responsible: "Carlos M.", startTime: "2026-07-22 08:00" },
      { name: "Corte", status: "pending", responsible: "", startTime: "" },
      { name: "Costura", status: "pending", responsible: "", startTime: "" },
      { name: "Limpieza", status: "pending", responsible: "", startTime: "" },
      { name: "Planchado y Empaquetado", status: "pending", responsible: "", startTime: "" }
    ]
  },
  {
    id: "OP-102",
    orderId: "ORD-1002",
    items: [
      {
        productId: "2",
        productName: "Camisa Lino Azul Cielo",
        quantityOrdered: 30,
        quantityExtras: 1,
        selectedSize: "L",
        sizeDistribution: { M: 10, L: 20 }
      }
    ],
    currentStage: "Corte",
    progress: 40,
    startDate: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    stages: [
      { name: "Tendido", status: "completed", responsible: "Carlos M.", startTime: "2026-07-20 08:00", endTime: "2026-07-21 17:00" },
      { name: "Corte", status: "in-progress", responsible: "Ana R.", startTime: "2026-07-22 09:00" },
      { name: "Costura", status: "pending", responsible: "", startTime: "" },
      { name: "Limpieza", status: "pending", responsible: "", startTime: "" },
      { name: "Planchado y Empaquetado", status: "pending", responsible: "", startTime: "" }
    ]
  },
  {
    id: "OP-103",
    orderId: "ORD-1003",
    items: [
      {
        productId: "4",
        productName: "Camisa de Pana Verde Bosque",
        quantityOrdered: 40,
        quantityExtras: 2,
        selectedSize: "S",
        sizeDistribution: { S: 20, M: 20 }
      }
    ],
    currentStage: "Costura",
    progress: 60,
    startDate: new Date(Date.now() - 86400000 * 7).toISOString().split("T")[0],
    stages: [
      { name: "Tendido", status: "completed", responsible: "Carlos M.", startTime: "2026-07-18 08:00", endTime: "2026-07-19 17:00" },
      { name: "Corte", status: "completed", responsible: "Ana R.", startTime: "2026-07-20 08:00", endTime: "2026-07-22 17:00" },
      { name: "Costura", status: "in-progress", responsible: "Luis G.", startTime: "2026-07-23 08:00" },
      { name: "Limpieza", status: "pending", responsible: "", startTime: "" },
      { name: "Planchado y Empaquetado", status: "pending", responsible: "", startTime: "" }
    ]
  }
];

export const INITIAL_KARDEX = [];
