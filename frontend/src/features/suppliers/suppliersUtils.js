/**
 * Pure utility functions for the Suppliers domain
 */

export const SUPPLIER_SPECIALTIES = [
  "Corte",
  "Costura",
  "Limpieza",
  "Planchado",
  "Empaquetado",
  "Insumos"
];

export const SERVICE_SPECIALTIES = [
  "Corte",
  "Costura",
  "Limpieza",
  "Planchado",
  "Empaquetado"
];

export const SPECIALTY_COLORS = {
  Corte: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-800" },
  Costura: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-100 text-blue-800" },
  Limpieza: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", badge: "bg-teal-100 text-teal-800" },
  Planchado: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-800" },
  Empaquetado: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-800" },
  Insumos: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800" }
};

/**
 * Filter suppliers by specialty, type or search query
 */
export function filterSuppliers(suppliers = [], { specialty = "all", type = "all", query = "" } = {}) {
  return suppliers.filter((supp) => {
    const isService = supp.specialty !== "Insumos" && supp.type !== "Insumos";
    
    // Filter by type
    if (type === "Servicio" && !isService) return false;
    if (type === "Insumos" && isService) return false;

    // Filter by specialty
    if (specialty !== "all" && supp.specialty !== specialty) {
      if (specialty === "Insumos" && (supp.category === "Telas" || supp.category === "Insumos")) {
        // match
      } else {
        return false;
      }
    }

    // Filter by text query
    if (query) {
      const q = query.toLowerCase().trim();
      const match =
        supp.name?.toLowerCase().includes(q) ||
        supp.contact?.toLowerCase().includes(q) ||
        supp.email?.toLowerCase().includes(q) ||
        supp.phone?.toLowerCase().includes(q) ||
        supp.documentNumber?.toLowerCase().includes(q) ||
        supp.insumoDetails?.toLowerCase().includes(q) ||
        supp.specialty?.toLowerCase().includes(q) ||
        supp.address?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Normalizes supplier object structure
 */
export function normalizeSupplier(supplier = {}) {
  const specialty = supplier.specialty || (supplier.category === "Telas" ? "Insumos" : supplier.category || "Costura");
  const isService = specialty !== "Insumos";

  return {
    id: supplier.id || supplier._id || `PROV-${Date.now().toString().slice(-4)}`,
    _id: supplier._id,
    name: supplier.name || "",
    documentType: supplier.documentType || "RUC",
    documentNumber: supplier.documentNumber || "",
    contact: supplier.contact || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    address: supplier.address || "",
    type: isService ? "Servicio" : "Insumos",
    specialty: specialty,
    category: specialty,
    insumoDetails: supplier.insumoDetails || "",
    unitCostRate: Number(supplier.unitCostRate) || 0,
    status: supplier.status || "Activo",
    notes: supplier.notes || "",
    servicesCount: Number(supplier.servicesCount) || 0,
    totalUnitsProcessed: Number(supplier.totalUnitsProcessed) || 0,
    purchasesCount: Number(supplier.purchasesCount) || 0,
    totalUnitsPurchased: Number(supplier.totalUnitsPurchased) || 0,
    totalSpent: Number(supplier.totalSpent) || 0,
    history: Array.isArray(supplier.history) ? supplier.history : []
  };
}
