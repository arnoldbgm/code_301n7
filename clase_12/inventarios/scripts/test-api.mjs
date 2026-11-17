// Smoke test for the productos y ventas API endpoints.
// Usage: npm run dev (in another terminal), then `npm run test:api`.

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function check(name, condition, extra = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${extra ? ` -> ${extra}` : ""}`);
  }
}

async function call(method, path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { status: response.status, json };
}

async function findOrCreateCustomer(customer) {
  const list = await call("GET", "/api/clientes");

  const existing = list.json?.data?.find((item) => item.dni === customer.dni);

  if (existing) {
    return existing;
  }

  const created = await call("POST", "/api/clientes", customer);

  return created.json?.data ?? null;
}

async function main() {
  const stamp = Date.now().toString().slice(-6);
  const productCode = `T-${stamp}`;

  console.log(`\nSmoke tests against ${BASE_URL}\n`);

  // --- Productos -----------------------------------------------------------
  console.log("[productos]");

  const created = await call("POST", "/api/productos", {
    code: productCode,
    name: `Producto de prueba ${stamp}`,
    price: 10.5,
    stock: 8,
    isActive: true,
  });

  check(
    "POST /api/productos crea con codigo, precio y stock",
    created.status === 201 &&
      created.json?.data?.code === productCode &&
      created.json?.data?.price === "10.5" &&
      created.json?.data?.stock === 8,
    JSON.stringify(created.json),
  );

  const productId = created.json?.data?.id;

  const duplicated = await call("POST", "/api/productos", {
    code: productCode,
    name: "Duplicado",
    price: 1,
    stock: 1,
  });

  check(
    "POST /api/productos con codigo duplicado responde 409",
    duplicated.status === 409 &&
      duplicated.json?.error?.code === "PRODUCT_CODE_ALREADY_EXISTS",
    JSON.stringify(duplicated.json),
  );

  const invalid = await call("POST", "/api/productos", {
    code: "X-1",
    name: "Invalido",
    price: -5,
    stock: -3,
  });

  check(
    "POST /api/productos con precio/stock negativos responde 400",
    invalid.status === 400 &&
      Array.isArray(invalid.json?.error?.details) &&
      invalid.json.error.details.length >= 2,
    JSON.stringify(invalid.json),
  );

  const listed = await call("GET", "/api/productos");

  check(
    "GET /api/productos lista el producto creado",
    listed.status === 200 &&
      listed.json?.data?.some((item) => item.id === productId),
  );

  const updated = await call("PUT", `/api/productos/${productId}`, {
    code: productCode,
    name: `Producto actualizado ${stamp}`,
    price: 12.5,
    stock: 5,
    isActive: true,
  });

  check(
    "PUT /api/productos actualiza precio y stock",
    updated.status === 200 &&
      updated.json?.data?.price === "12.5" &&
      updated.json?.data?.stock === 5,
    JSON.stringify(updated.json),
  );

  // --- Clientes (soporte RUC para facturas) ----------------------------------
  console.log("\n[clientes]");

  const walkIn = await findOrCreateCustomer({
    documentType: "DNI",
    dni: "00000000",
    firstName: "Walk-in",
    lastName: "Customer",
    address: "N/A",
  });

  check(
    "walk-in customer disponible para boletas",
    Boolean(walkIn?.id),
    JSON.stringify(walkIn),
  );

  const company = await findOrCreateCustomer({
    documentType: "RUC",
    dni: "20512345678",
    businessName: "Enter School SAC",
    firstName: "Compras",
    lastName: "Corporativas",
    address: "Av. Educacion 123",
  });

  check(
    "cliente con RUC y razon social disponible para facturas",
    Boolean(company?.id) && company?.businessName === "Enter School SAC",
    JSON.stringify(company),
  );

  const badRuc = await call("POST", "/api/clientes", {
    documentType: "RUC",
    dni: "12345678",
    firstName: "RUC",
    lastName: "Invalido",
    address: "N/A",
  });

  check(
    "POST /api/clientes con RUC de 8 digitos responde 400",
    badRuc.status === 400,
    JSON.stringify(badRuc.json),
  );

  // --- Ventas ---------------------------------------------------------------
  console.log("\n[ventas]");

  const boleta = await call("POST", "/api/ventas", {
    type: "BOLETA",
    customerId: walkIn.id,
    items: [{ productId, quantity: 2 }],
  });

  // 2 x 12.50 = 25.00 total; subtotal = 25.00 / 1.18 = 21.19; igv = 3.81
  check(
    "POST /api/ventas emite boleta con serie BBB1 y correlativo >= 6",
    boleta.status === 201 &&
      boleta.json?.data?.series === "BBB1" &&
      typeof boleta.json?.data?.number === "number" &&
      boleta.json?.data?.number >= 6 &&
      Number(boleta.json?.data?.subtotal) === 21.19 &&
      Number(boleta.json?.data?.igv) === 3.81 &&
      Number(boleta.json?.data?.total) === 25,
    JSON.stringify(boleta.json),
  );

  if (boleta.json?.data?.sunatAccepted !== undefined) {
    console.log(
      `  INFO  boleta ${boleta.json.data.series}-${boleta.json.data.number}: SUNAT ${
        boleta.json.data.sunatAccepted ? "aceptada" : "rechazada"
      } (${boleta.json.data.sunatDescription ?? "sin detalle"})`,
    );
  }

  const boletaId = boleta.json?.data?.id;

  const stockAfterSale = await call("GET", `/api/productos/${productId}`);

  check(
    "la venta descuenta el stock del producto (5 - 2 = 3)",
    stockAfterSale.json?.data?.stock === 3,
    JSON.stringify(stockAfterSale.json),
  );

  const factura = await call("POST", "/api/ventas", {
    type: "FACTURA",
    customerId: company.id,
    items: [{ productId, quantity: 1 }],
  });

  check(
    "POST /api/ventas emite factura con serie FFF1 y correlativo >= 8",
    factura.status === 201 &&
      factura.json?.data?.series === "FFF1" &&
      typeof factura.json?.data?.number === "number" &&
      factura.json?.data?.number >= 8 &&
      Number(factura.json?.data?.total) === 12.5,
    JSON.stringify(factura.json),
  );

  const facturaId = factura.json?.data?.id;

  const facturaSinRuc = await call("POST", "/api/ventas", {
    type: "FACTURA",
    customerId: walkIn.id,
    items: [{ productId, quantity: 1 }],
  });

  check(
    "POST /api/ventas factura a cliente sin RUC responde 422",
    facturaSinRuc.status === 422 &&
      facturaSinRuc.json?.error?.code === "FACTURA_REQUIRES_RUC_CUSTOMER",
    JSON.stringify(facturaSinRuc.json),
  );

  const noStock = await call("POST", "/api/ventas", {
    type: "BOLETA",
    customerId: walkIn.id,
    items: [{ productId, quantity: 999 }],
  });

  check(
    "POST /api/ventas con stock insuficiente responde 409",
    noStock.status === 409 &&
      noStock.json?.error?.code === "INSUFFICIENT_STOCK",
    JSON.stringify(noStock.json),
  );

  const emptyItems = await call("POST", "/api/ventas", {
    type: "BOLETA",
    customerId: walkIn.id,
    items: [],
  });

  check(
    "POST /api/ventas sin items responde 400",
    emptyItems.status === 400,
    JSON.stringify(emptyItems.json),
  );

  const vouchers = await call("GET", "/api/ventas");

  check(
    "GET /api/ventas lista boleta y factura con cliente e items",
    vouchers.status === 200 &&
      vouchers.json?.data?.length >= 2 &&
      vouchers.json.data.every((item) => item.customer && item.items),
  );

  const detail = await call("GET", `/api/ventas/${boletaId}`);

  check(
    "GET /api/ventas/:id devuelve el detalle con producto",
    detail.status === 200 &&
      detail.json?.data?.items?.[0]?.product?.id === productId,
    JSON.stringify(detail.json),
  );

  const detailNotFound = await call(
    "GET",
    "/api/ventas/00000000-0000-4000-8000-000000000000",
  );

  check(
    "GET /api/ventas/:id inexistente responde 404",
    detailNotFound.status === 404,
    JSON.stringify(detailNotFound.json),
  );

  const annulled = await call("DELETE", `/api/ventas/${boletaId}`);

  check("DELETE /api/ventas/:id anula la venta (204)", annulled.status === 204);

  const reAnnul = await call("DELETE", `/api/ventas/${boletaId}`);

  check(
    "DELETE /api/ventas/:id de una venta ya anulada responde 409",
    reAnnul.status === 409 &&
      reAnnul.json?.error?.code === "VOUCHER_ALREADY_ANNULLED",
    JSON.stringify(reAnnul.json),
  );

  const listAfterAnnul = await call("GET", "/api/ventas");

  check(
    "GET /api/ventas excluye las ventas anuladas",
    listAfterAnnul.status === 200 &&
      !listAfterAnnul.json?.data?.some((item) => item.id === boletaId),
  );

  const stockAfterAnnul = await call("GET", `/api/productos/${productId}`);

  // 5 - 2 (boleta) - 1 (factura) + 2 (anulacion de la boleta) = 4
  check(
    "anular la venta devuelve el stock al producto (2 + 2 = 4)",
    stockAfterAnnul.json?.data?.stock === 4,
    JSON.stringify(stockAfterAnnul.json),
  );

  // --- Limpieza --------------------------------------------------------------
  console.log("\n[cleanup]");

  await call("DELETE", `/api/ventas/${facturaId}`);
  const productDeleted = await call("DELETE", `/api/productos/${productId}`);

  check(
    "DELETE /api/productos elimina el producto de prueba (204)",
    productDeleted.status === 204,
  );

  const productInUse = await call("POST", "/api/productos", {
    code: `T2-${stamp}`,
    name: "Producto en uso",
    price: 5,
    stock: 5,
  });

  const inUseId = productInUse.json?.data?.id;

  await call("POST", "/api/ventas", {
    type: "BOLETA",
    customerId: walkIn.id,
    items: [{ productId: inUseId, quantity: 1 }],
  });

  const deleteInUse = await call("DELETE", `/api/productos/${inUseId}`);

  check(
    "DELETE /api/productos con ventas asociadas responde 409",
    deleteInUse.status === 409 && deleteInUse.json?.error?.code === "RECORD_IN_USE",
    JSON.stringify(deleteInUse.json),
  );

  console.log(
    `\nResultado: ${passed} passed, ${failed} failed (${passed + failed} total)\n`,
  );

  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exitCode = 1;
});
