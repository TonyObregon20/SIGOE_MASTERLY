import { useState } from "react";

/**
 * Custom hook to manage the draft creation workflow for new production orders
 */
export function useNewOPDraft({ products = [], createProductionOrder, setProductionOrders, onCompleted }) {
  const [selectedProductId, setSelectedProductId] = useState(products?.[0]?.id || "");
  const [sizingMode, setSizingMode] = useState("distribution"); // "single" or "distribution"
  const [singleSize, setSingleSize] = useState("M");
  const [singleQty, setSingleQty] = useState(10);
  const [distribution, setDistribution] = useState({ S: 5, M: 10, L: 10, XL: 5 });
  const [customOrderId, setCustomOrderId] = useState("");
  const [opResponsible, setOpResponsible] = useState("Operario de Tendido");
  const [draftItems, setDraftItems] = useState([]);

  const handleAddDraftItem = () => {
    const product = products.find((p) => p.id === selectedProductId) || products[0];
    if (!product) return;

    let newItem;
    if (sizingMode === "single") {
      newItem = {
        product,
        quantity: Number(singleQty),
        selectedSize: singleSize,
        sizeDistribution: null
      };
    } else {
      const totalQty = Object.values(distribution).reduce((sum, q) => sum + (Number(q) || 0), 0);
      if (totalQty <= 0) {
        alert("Por favor ingresa cantidades en al menos una talla.");
        return;
      }
      newItem = {
        product,
        quantity: totalQty,
        selectedSize: null,
        sizeDistribution: { ...distribution }
      };
    }

    const existingIndex = draftItems.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.selectedSize === newItem.selectedSize &&
        JSON.stringify(item.sizeDistribution) === JSON.stringify(newItem.sizeDistribution)
    );

    if (existingIndex > -1) {
      setDraftItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + newItem.quantity } : item
        )
      );
    } else {
      setDraftItems((prev) => [...prev, newItem]);
    }
  };

  const handleRemoveDraftItem = (index) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveOP = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (draftItems.length === 0) {
      alert("Agrega al menos un producto a la lista de producción.");
      return;
    }

    const finalOrderId = customOrderId.trim() ? customOrderId.trim() : "";

    createProductionOrder(draftItems, finalOrderId);

    if (opResponsible && opResponsible !== "Operario 1" && setProductionOrders) {
      setTimeout(() => {
        setProductionOrders((prev) =>
          prev.map((op, idx) => {
            if (idx === 0) {
              return {
                ...op,
                stages: op.stages.map((stg) =>
                  (stg.name === "Tendido" || stg.name === "Corte") ? { ...stg, responsible: opResponsible } : stg
                )
              };
            }
            return op;
          })
        );
      }, 50);
    }

    // Reset draft state
    setDraftItems([]);
    setCustomOrderId("");
    setOpResponsible("Operario de Tendido");
    setDistribution({ S: 5, M: 10, L: 10, XL: 5 });
    setSingleQty(10);
    if (typeof onCompleted === "function") {
      onCompleted();
    }
  };

  const totalLotUnits = draftItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    selectedProductId,
    setSelectedProductId,
    sizingMode,
    setSizingMode,
    singleSize,
    setSingleSize,
    singleQty,
    setSingleQty,
    distribution,
    setDistribution,
    customOrderId,
    setCustomOrderId,
    opResponsible,
    setOpResponsible,
    draftItems,
    setDraftItems,
    totalLotUnits,
    handleAddDraftItem,
    handleRemoveDraftItem,
    handleSaveOP
  };
}
