import sharp from "sharp";

export const MAX_GUIDE_PHOTO_BYTES = 1024 * 1024;
export const MAX_GUIDE_PHOTO_PIXELS = 40_000_000;

export function flowError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

export function validateGuideNumber(value) {
  if (typeof value !== "string" || !value.length || value.length > 100 || value !== value.trim() || /[\x00-\x1f\x7f]/.test(value)) {
    throw flowError("Ingrese un número de guía válido, de hasta 100 caracteres y sin espacios al inicio o al final.");
  }
  return value;
}

// Only raster photographs are accepted. Check the decoded signature as well as
// the declared MIME type; SVG/HTML and arbitrary strings are never evidence.
export async function validateGuidePhoto(value) {
  if (typeof value !== "string" || value.length > Math.ceil(MAX_GUIDE_PHOTO_BYTES / 3) * 4 + 40) {
    throw flowError("La fotografía de la guía es obligatoria y debe pesar como máximo 1 MB.");
  }
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) {
    throw flowError("Seleccione una fotografía JPG, PNG o WebP válida.");
  }
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_GUIDE_PHOTO_BYTES || bytes.toString("base64") !== match[2]) {
    throw flowError("La fotografía debe ser válida y pesar como máximo 1 MB.");
  }
  const valid = validImageStructure(bytes, match[1]);
  if (!valid) throw flowError("El contenido de la fotografía no corresponde a un JPG, PNG o WebP válido.");
  try {
    const image = sharp(bytes, { failOn: "warning", limitInputPixels: MAX_GUIDE_PHOTO_PIXELS });
    const metadata = await image.metadata();
    if (metadata.format !== match[1] || !Number.isSafeInteger(metadata.width) || !Number.isSafeInteger(metadata.height) || metadata.width <= 0 || metadata.height <= 0 || metadata.width * metadata.height > MAX_GUIDE_PHOTO_PIXELS || (metadata.pages || 1) !== 1) throw new Error("Invalid format or dimensions");
    // metadata() alone does not decode pixels. Force full, strict decoding.
    await image.raw().toBuffer();
  } catch {
    throw flowError("La fotografía está corrupta o tiene formato o dimensiones no válidas.");
  }
  return value;
}

function validImageStructure(bytes, format) {
  if (format === "png") {
    if (bytes.length < 45 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false;
    if (bytes.readUInt32BE(8) !== 13 || bytes.toString("ascii", 12, 16) !== "IHDR" || !bytes.readUInt32BE(16) || !bytes.readUInt32BE(20)) return false;
    let offset = 8;
    let hasData = false;
    while (offset + 12 <= bytes.length) {
      const length = bytes.readUInt32BE(offset);
      const end = offset + length + 12;
      if (end > bytes.length) return false;
      const type = bytes.toString("ascii", offset + 4, offset + 8);
      if (type === "IDAT" && length) hasData = true;
      if (type === "IEND") return hasData && length === 0 && end === bytes.length;
      offset = end;
    }
    return false;
  }
  if (format === "webp") {
    if (bytes.length < 20 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP" || bytes.readUInt32LE(4) + 8 !== bytes.length) return false;
    let offset = 12;
    let hasImage = false;
    while (offset + 8 <= bytes.length) {
      const type = bytes.toString("ascii", offset, offset + 4);
      const size = bytes.readUInt32LE(offset + 4);
      if (["VP8 ", "VP8L", "ANMF"].includes(type) && size >= 5) hasImage = true;
      offset += 8 + size + (size % 2);
      if (offset > bytes.length) return false;
    }
    return hasImage && offset === bytes.length;
  }
  if (bytes.length < 20 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) return false;
  let offset = 2;
  let hasFrame = false;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset++] !== 0xff) return false;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (offset + 2 > bytes.length) return false;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) return false;
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (length < 8 || !bytes.readUInt16BE(offset + 3) || !bytes.readUInt16BE(offset + 5)) return false;
      hasFrame = true;
    }
    if (marker === 0xda) {
      const scan = bytes.subarray(offset + length, bytes.length - 2);
      // libjpeg may tolerate an empty scan made solely of marker fill bytes.
      return hasFrame && scan.length > 0 && scan.some((byte) => byte !== 0xff);
    }
    offset += length;
  }
  return false;
}

export async function validateGuideRegistration(payload) {
  if (!["CON_GUIA", "SIN_GUIA"].includes(payload.guideMode)) {
    throw flowError("Seleccione CON GUÍA o SIN GUÍA antes de generar la salida.");
  }
  if (payload.guideMode === "SIN_GUIA") {
    return { guideVersion: 1, guideMode: "SIN_GUIA" };
  }
  return {
    guideVersion: 1,
    guideMode: "CON_GUIA",
    guideNumber: validateGuideNumber(payload.guideNumber),
    guidePhoto: await validateGuidePhoto(payload.guidePhoto)
  };
}

export async function validateStoredGuide(movement) {
  // Absence of the version is reserved for persisted historical records.
  if (movement.guideVersion == null && movement.guideMode == null) return;
  await validateGuideRegistration(movement);
}

export async function validateDispatchGuide(movement, payload) {
  await validateStoredGuide(movement);
  if (movement.guideMode !== "CON_GUIA") return {};
  const number = validateGuideNumber(payload.guideNumber);
  if (number !== movement.guideNumber) {
    throw flowError("El número de guía no coincide exactamente con el registrado al generar la salida.");
  }
  return {
    dispatchGuideNumber: number,
    dispatchGuidePhoto: await validateGuidePhoto(payload.guidePhoto)
  };
}

export function movementSummary(movement) {
  const result = movement?.toObject ? movement.toObject() : { ...movement };
  delete result.guidePhoto;
  delete result.dispatchGuidePhoto;
  return result;
}
