import { createSalidaService } from "../../backend/services/salidaService.js";

function matches(row, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    if (key === "$or") return value.some((entry) => matches(row, entry));
    if (value && typeof value === "object") {
      if ("$exists" in value) return (row[key] !== undefined) === value.$exists;
      if ("$ne" in value) return row[key] !== value.$ne;
    }
    return row[key] === value;
  });
}
export function memory(seed = {}) {
  let state = structuredClone({ Movement: [], Order: [], Product: [{ id: "P1", stockPhysical: 10, stockCommitted: 2, sizes: { M: { stockPhysical: 10, stockCommitted: 2 } } }], ProductionOrder: [], Kardex: [], ...seed });
  let failLedger = false;
  const query = (work) => ({ select() { return this; }, session() { return this; }, sort() { return this; }, then(resolve, reject) { return Promise.resolve().then(work).then(resolve, reject); } });
  const models = Object.fromEntries(Object.keys(state).map((name) => [name, {
    find: (filter) => query(() => structuredClone(state[name].filter((r) => matches(r, filter)))),
    findOne: (filter) => query(() => structuredClone(state[name].find((r) => matches(r, filter)) || null)),
    findOneAndUpdate: (filter, update) => query(() => {
      const row = state[name].find((r) => matches(r, filter));
      if (!row) return null;
      Object.assign(row, structuredClone(update.$set || {}));
      for (const [key, amount] of Object.entries(update.$inc || {})) row[key] = (row[key] || 0) + amount;
      return structuredClone(row);
    }),
    create: async (rows) => {
      if (name === "Kardex" && failLedger) throw new Error("Simulated ledger failure");
      for (const row of rows) {
        if (row.id && state[name].some((r) => r.id === row.id)) throw Object.assign(new Error("Duplicate id"), { code: 11000 });
        state[name].push(structuredClone(row));
      }
      return structuredClone(rows);
    }
  }]));
  // Serialize isolated transactions to simulate write-conflict retry semantics.
  let queue = Promise.resolve();
  const transaction = (work) => {
    const run = queue.then(async () => {
      const before = structuredClone(state);
      try { return await work({ simulated: true }); }
      catch (error) { state = before; throw error; }
    });
    queue = run.catch(() => {});
    return run;
  };
  return { service: createSalidaService({ models, transaction }), models, snapshot: () => structuredClone(state), failLedger: () => { failLedger = true; } };
}
