import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { transformSync } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.resolve(import.meta.dirname, "..");
// Transform JSX in memory. This imports UI components only, with no server,
// network listener, DOM automation, or MongoDB configuration.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) specifier = pathToFileURL(path.join(root, "frontend/src", specifier.slice(2))).href;
    if (specifier === "motion/react") specifier = "framer-motion";
    if (context.parentURL?.includes("/frontend/src/") && (specifier.startsWith("file:") || specifier.startsWith(".")) && !path.extname(specifier)) {
      const url = new URL(specifier, context.parentURL);
      for (const suffix of [".js", ".jsx"]) if (existsSync(fileURLToPath(url) + suffix)) return next(url.href + suffix, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("file:") && url.endsWith(".jsx")) return { format: "module", shortCircuit: true, source: transformSync(readFileSync(fileURLToPath(url), "utf8"), { loader: "jsx", format: "esm" }).code };
    return next(url, context);
  }
});
const { default: GuideModeModal } = await import("../frontend/src/features/warehouse/components/GuideModeModal.jsx");
const { default: GuideEvidenceFields } = await import("../frontend/src/features/warehouse/components/GuideEvidenceFields.jsx");
const { default: GuideDispatchModal } = await import("../frontend/src/features/warehouse/components/GuideDispatchModal.jsx");
const { default: CreateSalidaModal } = await import("../frontend/src/features/inventory/components/CreateSalidaModal.jsx");
const { default: SalesManagementView } = await import("../frontend/src/features/orders/SalesManagementView.jsx");
const noop = () => {};

test("generation opens explicit CON GUIA / SIN GUIA selection for both order types", () => {
  for (const type of ["direct", "pedido"]) {
    const html = renderToStaticMarkup(React.createElement(CreateSalidaModal, { isOpen: true, onClose: noop, initialOrderId: "O1", orders: [{ id: "O1", type, items: [], total: 60 }], onCreateSalida: noop }));
    assert.match(html, /role="dialog"/);
    assert.match(html, /CON GUÍA/);
    assert.match(html, /SIN GUÍA/);
    assert.match(html, /sm:grid-cols-2/);
  }
});

test("evidence inputs require manual number and supported photo formats", () => {
  const html = renderToStaticMarkup(React.createElement(GuideEvidenceFields, { number: "", photo: "", onNumberChange: noop, onPhotoChange: noop, onError: noop }));
  assert.match(html, /autoComplete="off"/);
  assert.match(html, /maxLength="100"/);
  assert.match(html, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.equal((html.match(/required=""/g) || []).length, 2);
  assert.match(html, /Máximo 1 MB/);
});

test("dispatch asks for fresh blank evidence for every guided partial movement", () => {
  const movements = [{ id: "S1", guideNumber: "SECRET-ORIGINAL" }, { id: "S2", guideNumber: "SECRET-SECOND" }];
  const html = renderToStaticMarkup(React.createElement(GuideDispatchModal, { order: { id: "O1" }, movements, onSubmit: noop, onClose: noop }));
  assert.match(html, /Confirmar despacho/);
  assert.equal((html.match(/type="file"/g) || []).length, 2);
  assert.doesNotMatch(html, /SECRET-ORIGINAL|SECRET-SECOND/);
  assert.match(html, /max-h-\[90dvh\]/);
  assert.match(html, /sm:flex-row/);
});

test("sales cannot mark Enviado with the status selector", () => {
  const html = renderToStaticMarkup(React.createElement(SalesManagementView, { orders: [{ id: "O1", type: "direct", status: "Pagado Total", total: 60, items: [] }], onShipOrder: noop, onUpdateOrder: noop }));
  assert.match(html, /<option value="Enviado" disabled=""/);
});
