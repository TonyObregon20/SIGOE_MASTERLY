import { useState, useMemo } from "react";

/**
 * Custom hook for filtering and searching products in the Ecommerce Admin view
 */
export function useEcommerceFilters({ products = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const id = String(p.id || "").toLowerCase();
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch = !search || name.includes(search) || id.includes(search);
      const matchesCategory = filterCategory === "all" || p.category === filterCategory;
      const matchesVisibility =
        filterVisibility === "all" ||
        (filterVisibility === "public" ? p.isPublic !== false : p.isPublic === false);

      return matchesSearch && matchesCategory && matchesVisibility;
    });
  }, [products, searchTerm, filterCategory, filterVisibility]);

  return {
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterVisibility,
    setFilterVisibility,
    filteredProducts
  };
}
