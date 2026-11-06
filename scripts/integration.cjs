const { chromium } = require("../.tools/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.UI_BASE || "http://localhost:4201";
const browserPath =
  process.env.BROWSER_EXE ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const stamp = Date.now().toString().slice(-7);
const name = "Integración AutoFix " + stamp;
const body = String(21000000 + (Number(stamp) % 7000000));
function dv(n) {
  let sum = 0,
    m = 2;
  for (const c of n.split("").reverse()) {
    sum += Number(c) * m;
    m = m === 7 ? 2 : m + 1;
  }
  const r = 11 - (sum % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
}
const plate = "ZX" + stamp.slice(-4);
const withParts = process.env.WITH_PARTS === "1";
let expectedTotal = 45000;
(async () => {
  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1500, height: 1000 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  fs.mkdirSync(".integration", { recursive: true });
  try {
    await page.goto(base);
    await page
      .getByLabel("Correo electrónico", { exact: true })
      .fill("admin@autofix.cl");
    await page.getByLabel("Contraseña", { exact: true }).fill("Autofix2026!");
    await page.getByRole("button", { name: "Ingresar a AutoFix" }).click();
    await page.getByRole("heading", { name: "Panel de operaciones" }).waitFor();
    await page.locator(".stats").waitFor();
    await page
      .getByText("Cargando información…", { exact: true })
      .waitFor({ state: "hidden" });
    console.log("OK Inicio de sesión y dashboard");
    await page.screenshot({
      path: ".integration/dashboard.png",
      fullPage: true,
    });
    await page.getByRole("link", { name: "Clientes", exact: false }).click();
    await page.getByRole("button", { name: "Nuevo cliente" }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nombre completo").fill(name);
    await dialog.getByLabel("RUT", { exact: true }).fill(body + "-" + dv(body));
    await dialog.getByRole("button", { name: "Guardar registro" }).click();
    await dialog.waitFor({ state: "hidden" });
    console.log("OK Cliente con RUT validado");
    await page.getByRole("link", { name: "Vehículos", exact: false }).click();
    await page.getByRole("button", { name: "Nuevo vehículo" }).click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Cliente", { exact: true })
      .selectOption({ label: name + " · " + body + "-" + dv(body) });
    await dialog.getByLabel("Patente", { exact: true }).fill(plate);
    await dialog.getByLabel("Marca", { exact: true }).fill("Toyota");
    await dialog.getByLabel("Modelo", { exact: true }).fill("Corolla");
    await dialog.getByRole("button", { name: "Guardar registro" }).click();
    await dialog.waitFor({ state: "hidden" });
    console.log("OK Vehículo asociado al cliente");
    await page.getByRole("link", { name: "Agenda de taller" }).click();
    await page.getByRole("button", { name: "Nueva reserva" }).click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Cliente", { exact: true })
      .selectOption({ label: name + " · " + body + "-" + dv(body) });
    await dialog
      .getByLabel("Vehículo", { exact: true })
      .selectOption({ label: plate + " · Toyota Corolla" });
    await dialog
      .getByLabel("Sucursal", { exact: true })
      .selectOption({ label: "Santiago" });
    const date = new Date(Date.now() + 7 * 86400000);
    await dialog
      .getByLabel("Fecha", { exact: true })
      .fill(date.toISOString().slice(0, 10));
    await dialog.getByLabel("Fecha", { exact: true }).dispatchEvent("change");
    const slots = dialog.getByLabel("Horario disponible");
    await slots
      .locator("option:not([disabled])")
      .nth(1)
      .waitFor({ state: "attached" });
    const value = await slots
      .locator("option:not([disabled])")
      .nth(1)
      .getAttribute("value");
    await slots.selectOption(value);
    await dialog
      .getByLabel("Motivo de ingreso")
      .fill("Mantención programada de integración");
    await dialog.getByRole("button", { name: "Guardar registro" }).click();
    await dialog.waitFor({ state: "hidden" });
    const reservation = page.getByRole("row").filter({ hasText: name });
    await reservation
      .getByRole("button", { name: "Recepcionar vehículo" })
      .click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Guardar registro" }).click();
    await dialog.waitFor({ state: "hidden" });
    console.log("OK Reserva, disponibilidad y recepción de vehículo");
    await page.getByRole("link", { name: "Órdenes de trabajo" }).click();
    await page.getByRole("textbox", { name: "Buscar registros" }).fill(plate);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByRole("button", { name: "Ver orden" }).first().click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Siguiente estado").selectOption("EN_DIAGNOSTICO");
    await dialog.getByRole("button", { name: "Actualizar estado" }).click();
    await dialog
      .locator(".detail-summary")
      .getByText("En diagnostico", { exact: true })
      .waitFor();
    await dialog
      .getByRole("button", { name: "Agregar ítem de presupuesto" })
      .click();
    await dialog
      .getByPlaceholder("Descripción", { exact: true })
      .fill("Mantención preventiva");
    await dialog
      .getByRole("spinbutton", { name: "Precio unitario CLP" })
      .fill("45000");
    if (withParts) {
      await dialog
        .getByRole("button", { name: "Agregar ítem de presupuesto" })
        .click();
      await dialog
        .locator(".budget-item")
        .nth(1)
        .locator("select")
        .first()
        .selectOption("REPUESTO");
      await dialog
        .getByRole("combobox", { name: "Repuesto del presupuesto" })
        .selectOption({ label: "Filtro de aceite · FIL-ACE-001" });
      expectedTotal += Number(
        await dialog
          .getByRole("spinbutton", { name: "Precio unitario CLP" })
          .nth(1)
          .inputValue(),
      );
      await dialog
        .getByRole("spinbutton", { name: "Garantía del trabajo en meses" })
        .nth(1)
        .fill("12");
    }
    await dialog.getByRole("button", { name: "Guardar borrador" }).click();
    await dialog.getByRole("button", { name: "Enviar al cliente" }).click();
    await dialog.getByText("Enviado", { exact: true }).waitFor();
    await dialog
      .getByRole("button", { name: "Generar enlace del cliente" })
      .click();
    const link = dialog.getByRole("link", {
      name: "Abrir portal de este cliente",
    });
    await link.waitFor();
    const url = await link.getAttribute("href");
    console.log("OK Diagnóstico y presupuesto enviado");
    const publicContext = await browser.newContext();
    const portal = await publicContext.newPage();
    portal.on("pageerror", (e) => errors.push(e.message));
    await portal.goto(url);
    await portal.getByLabel("Tu nombre", { exact: true }).fill(name);
    await portal.getByRole("checkbox").check();
    await portal.getByRole("button", { name: /Aprobar/ }).click();
    await portal.getByText("Aprobado", { exact: true }).waitFor();
    await portal.screenshot({
      path: ".integration/portal.png",
      fullPage: true,
    });
    await publicContext.close();
    console.log("OK Aprobación del cliente sin sesión interna");
    await dialog.getByRole("button", { name: "Cerrar orden" }).click();
    await page.getByRole("button", { name: "Ver orden" }).first().click();
    dialog = page.getByRole("dialog");
    await dialog
      .locator(".detail-summary")
      .getByText("En reparacion", { exact: true })
      .waitFor();
    if (withParts) {
      await dialog
        .getByRole("combobox", { name: "Repuesto", exact: true })
        .selectOption({ label: "Filtro de aceite · FIL-ACE-001" });
      await dialog.getByLabel("Cantidad", { exact: true }).fill("1");
      await dialog.getByLabel("Garantía (meses)", { exact: true }).fill("12");
      await dialog
        .getByRole("button", { name: "Asignar repuesto", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Retirar y restituir stock" })
        .waitFor();
      await dialog
        .getByRole("button", { name: "Retirar y restituir stock" })
        .click();
      await dialog
        .getByRole("button", { name: "Declarar trabajo sin repuestos" })
        .waitFor();
      await dialog
        .getByRole("button", { name: "Asignar repuesto", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Validar consumo registrado" })
        .click();
      console.log("OK Catálogo, asignación, reversa de stock y garantía");
    } else {
      await dialog
        .getByRole("button", { name: "Declarar trabajo sin repuestos" })
        .click();
    }
    await dialog.getByText(/Consumo validado/).waitFor();
    await dialog.getByLabel("Siguiente estado").selectOption("LISTA_ENTREGA");
    await dialog.getByRole("button", { name: "Actualizar estado" }).click();
    await dialog
      .locator(".detail-summary")
      .getByText("Lista entrega", { exact: true })
      .waitFor();
    await dialog.getByLabel("Siguiente estado").selectOption("ENTREGADA");
    await dialog.getByRole("button", { name: "Actualizar estado" }).click();
    await dialog.getByText(/Total final autorizado/).waitFor();
    assert(
      (await dialog.innerText()).includes(
        new Intl.NumberFormat("es-CL").format(expectedTotal),
      ),
    );
    await dialog.getByRole("button", { name: "Cerrar orden" }).click();
    console.log(
      "OK Reparación, validación de consumo y entrega con monto autorizado",
    );
    await page.getByRole("link", { name: "Garantías e historial" }).click();
    await page
      .getByRole("heading", { name: "Garantías e historial", exact: true })
      .waitFor();
    await page.getByRole("textbox", { name: "Buscar registros" }).fill(plate);
    await page
      .getByRole("textbox", { name: "Buscar registros" })
      .press("Enter");
    await page.getByText("Historial encontrado", { exact: true }).waitFor();
    assert(
      (await page.locator(".workspace").innerText()).includes("Entregada"),
    );
    if (withParts)
      assert(
        (await page.locator(".workspace").innerText()).includes(
          "Filtro de aceite",
        ),
      );
    console.log("OK Historial multisucursal");
    await page.getByRole("link", { name: "Proyecto SUGO" }).click();
    await page
      .getByRole("heading", { name: "Cronograma del proyecto" })
      .waitFor();
    assert.equal(await page.locator(".gantt-row").count(), 20);
    await page.screenshot({
      path: ".integration/proyecto.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Hitos", exact: true }).click();
    await page.locator(".milestone").first().waitFor();
    assert.equal(await page.locator(".milestone").count(), 5);
    await page.getByRole("button", { name: "Recursos", exact: true }).click();
    await page
      .getByRole("columnheader", { name: "Costo planificado" })
      .waitFor();
    assert.equal(await page.locator("tbody tr").count(), 20);
    console.log("OK Contexto: Gantt, hitos y recursos");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    await page.getByRole("heading", { name: "Panel de operaciones" }).waitFor();
    await page.locator(".stats").waitFor();
    await page.screenshot({ path: ".integration/mobile.png", fullPage: true });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    console.log("OK Vista móvil sin desbordamiento");
    const permissions = await page.evaluate(async () => {
      const login = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "mecanico.stgo@autofix.cl",
          password: "Autofix2026!",
        }),
      });
      const token = (await login.json()).accessToken;
      return {
        anonymous: (await fetch("/api/proyecto/contexto")).status,
        forbidden: (
          await fetch("/api/integraciones/sync", {
            headers: { Authorization: "Bearer " + token },
          })
        ).status,
      };
    });
    assert.deepEqual(permissions, { anonymous: 401, forbidden: 403 });
    console.log("OK API exige sesión y permisos");
    assert.deepEqual(errors, []);
    console.log("OK Sin errores JavaScript");
  } catch (e) {
    await page.screenshot({ path: ".integration/failure.png", fullPage: true });
    console.error("ERROR", e);
    console.error((await page.locator("body").innerText()).slice(-7000));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
