import { useState } from "react";

/**
 * Custom hook to manage the draft items for warehouse stock reception
 */
export function useIncomeDraft() {
  const [incomeItems, setIncomeItems] = useState([]);
  const [tempProductId, setTempProductId] = useState("");
  const [tempQuantity, setTempQuantity] = useState(10);

  const addItem = () => {
    if (!tempProductId) return;
    setIncomeItems((prev) => [
      ...prev,
      { productId: tempProductId, quantity: tempQuantity }
    ]);
    setTempProductId("");
    setTempQuantity(10);
  };

  const removeItem = (index) => {
    setIncomeItems((prev) => prev.filter((_, i) => i !== index));
  };

  const initDraft = (productId = null, defaultQty = 10) => {
    if (productId) {
      setIncomeItems([{ productId, quantity: defaultQty }]);
    } else {
      setIncomeItems([]);
    }
    setTempProductId("");
    setTempQuantity(10);
  };

  const clearDraft = () => {
    setIncomeItems([]);
    setTempProductId("");
    setTempQuantity(10);
  };

  return {
    incomeItems,
    setIncomeItems,
    tempProductId,
    setTempProductId,
    tempQuantity,
    setTempQuantity,
    addItem,
    removeItem,
    initDraft,
    clearDraft
  };
}

export default useIncomeDraft;
