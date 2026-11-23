export const MAX_GUIDE_PHOTO_BYTES = 1024 * 1024;

export function validateGuideFields(number, photo) {
  if (typeof number !== "string" || !number || number.length > 100 || number !== number.trim() || /[\x00-\x1f\x7f]/.test(number)) {
    throw new Error("Ingrese el número de guía sin espacios al inicio o al final (máximo 100 caracteres).");
  }
  if (!photo) throw new Error("Seleccione la fotografía de la guía.");
}

export async function readGuidePhoto(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Seleccione una fotografía JPG, PNG o WebP.");
  if (file.size > MAX_GUIDE_PHOTO_BYTES || file.size === 0) throw new Error("La fotografía debe pesar como máximo 1 MB y no estar vacía.");
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la fotografía. Intente nuevamente."));
    reader.readAsDataURL(file);
  });
  await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve() : reject(new Error("La fotografía no es válida."));
    image.onerror = () => reject(new Error("El archivo no contiene una fotografía válida."));
    image.src = data;
  });
  return data;
}

// Never rely on the first movement returned by a list. This helper is also used
// by the dispatch modal to capture every guided partial movement on the order.
export function orderSalidas(movements, orderId) {
  return movements.filter((m) => m.type === "Salida" && m.orderId === orderId);
}
