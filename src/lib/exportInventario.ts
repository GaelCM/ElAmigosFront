import ExcelJS from "exceljs";
import JsBarcode from "jsbarcode";
import type { ProductoVenta } from "@/types/Producto";

/**
 * Cede el control al event loop del navegador para que React pueda
 * re-renderizar (spinner, progreso) sin que el hilo principal se congele.
 * Usa MessageChannel porque tiene menos latencia que setTimeout(0).
 */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => resolve();
    ch.port2.postMessage(undefined);
  });
}

let sharedCanvas: HTMLCanvasElement | null = null;

/** Genera un PNG en base64 del código de barras Code128 del SKU dado reutilizando canvas */
function generarBarcodePNG(sku: string): string {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
  }
  JsBarcode(sharedCanvas, sku, {
    format: "CODE128",
    width: 1.2,
    height: 35,
    displayValue: false,
    margin: 2,
    background: "#ffffff",
    lineColor: "#000000",
  });
  // Devuelve solo la parte base64, sin el prefijo "data:image/png;base64,"
  return sharedCanvas.toDataURL("image/png").split(",")[1];
}

export async function exportarInventarioExcel(
  productos: ProductoVenta[],
  idSucursal: number,
  onProgress?: (current: number, total: number, status?: string) => void
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ElAmigos POS";
  wb.created = new Date();

  const ws = wb.addWorksheet("Inventario", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
    views: [{ state: "frozen", ySplit: 2 }], // congela las 2 primeras filas (título + encabezado)
  });

  // ─── Colores de marca ───────────────────────────────────────────────────────
  const COLOR_HEADER_BG = "1E3A5F";   // azul oscuro
  const COLOR_HEADER_FG = "FFFFFF";   // blanco
  const COLOR_ROW_ALT = "EEF4FB";   // azul muy claro para filas alternadas
  const COLOR_STOCK_BG = "FFF3CD";   // amarillo suave para columna stock sistema
  const COLOR_FISICO_BG = "D4EDDA";   // verde suave para stock físico
  const COLOR_DIFF_BG = "F8D7DA";   // rojo suave para diferencia

  // ─── Anchos de columna ──────────────────────────────────────────────────────
  ws.columns = [
    { key: "barcode", width: 22 }, // A – imagen del código
    { key: "sku_pieza", width: 16 }, // B – SKU producto
    { key: "sku_pres", width: 16 }, // C – SKU presentación
    { key: "nombre", width: 32 }, // D – Nombre
    { key: "presentacion", width: 14 }, // E – Presentación
    { key: "descripcion", width: 28 }, // F – Descripción
    { key: "precio_venta", width: 14 }, // G – Precio venta
    { key: "precio_mayoreo", width: 14 }, // H – Precio mayoreo
    { key: "stock_sistema", width: 16 }, // I – Stock sistema (piezas)
    { key: "stock_fisico", width: 16 }, // J – Stock físico (a llenar)
    { key: "diferencia", width: 16 }, // K – Diferencia (fórmula)
  ];

  // ─── Fila 1: Título general ──────────────────────────────────────────────────
  ws.mergeCells("A1:K1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `Inventario Sucursal #${idSucursal} — ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`;
  titleCell.font = { name: "Calibri", bold: true, size: 14, color: { argb: COLOR_HEADER_FG } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 28;

  // ─── Fila 2: Encabezados ────────────────────────────────────────────────────
  const headers = [
    "Código de Barras",
    "SKU Producto",
    "SKU Presentación",
    "Nombre Producto",
    "Presentación",
    "Descripción",
    "Precio Venta",
    "Precio Mayoreo",
    "Stock Sistema\n(piezas)",
    "Stock Físico\n(llenar)",
    "Diferencia",
  ];

  const headerRow = ws.getRow(2);
  headerRow.height = 36;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: "Calibri", bold: true, size: 10, color: { argb: COLOR_HEADER_FG } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "AAAAAA" } },
      bottom: { style: "medium", color: { argb: COLOR_HEADER_FG } },
      left: { style: "thin", color: { argb: "AAAAAA" } },
      right: { style: "thin", color: { argb: "AAAAAA" } },
    };
  });

  // ─── Filas de datos ─────────────────────────────────────────────────────────
  const DATA_START_ROW = 3;
  const ROW_HEIGHT = 52; // altura para acomodar la imagen del barcode
  const YIELD_EVERY = 5; // ceder al event loop cada N productos
  const barcodeImageCache = new Map<string, number>(); // Cache SKU -> imageId para no duplicar imágenes en el zip

  for (let idx = 0; idx < productos.length; idx++) {
    const p = productos[idx];

    // Cada YIELD_EVERY productos, ceder al hilo principal para que React
    // pueda re-renderizar el progreso sin congelar la UI
    if (idx % YIELD_EVERY === 0) {
      onProgress?.(idx, productos.length);
      await yieldToMain();
    }

    const rowNum = DATA_START_ROW + idx;
    const isAlt = idx % 2 === 1;
    const baseBg = isAlt ? COLOR_ROW_ALT : "FFFFFF";
    const dataRow = ws.getRow(rowNum);
    dataRow.height = ROW_HEIGHT;

    // Helper para aplicar estilo base a una celda
    const styleCell = (
      col: number,
      bg: string = baseBg,
      bold = false,
      alignH: ExcelJS.Alignment["horizontal"] = "center"
    ) => {
      const c = dataRow.getCell(col);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      c.font = { name: "Calibri", size: 10, bold };
      c.alignment = { horizontal: alignH, vertical: "middle", wrapText: true };
      c.border = {
        top: { style: "thin", color: { argb: "DDDDDD" } },
        bottom: { style: "thin", color: { argb: "DDDDDD" } },
        left: { style: "thin", color: { argb: "DDDDDD" } },
        right: { style: "thin", color: { argb: "DDDDDD" } },
      };
      return c;
    };

    // Col A – barcode (imagen, se agrega abajo por separado)
    styleCell(1); // aplica el estilo base a la celda vacía

    // Col B – SKU Producto
    styleCell(2, baseBg, true).value = p.sku_pieza;

    // Col C – SKU Presentación
    styleCell(3).value = p.sku_presentacion;

    // Col D – Nombre
    styleCell(4, baseBg, false, "left").value =
      `${p.nombre_producto}${p.factor_conversion_cantidad > 1 ? ` (${p.factor_conversion_cantidad} pzas)` : ""}`;

    // Col E – Presentación
    styleCell(5).value = p.es_granel ? "Granel" : p.nombre_presentacion;

    // Col F – Descripción
    styleCell(6, baseBg, false, "left").value = p.descripcion ?? "";

    // Col G – Precio Venta
    const gCell = styleCell(7);
    gCell.value = p.precio_venta;
    gCell.numFmt = '"$"#,##0.00';

    // Col H – Precio Mayoreo
    const hCell = styleCell(8);
    hCell.value = p.precio_mayoreo;
    hCell.numFmt = '"$"#,##0.00';

    // Col I – Stock Sistema (piezas, fondo amarillo)
    const iCell = styleCell(9, COLOR_STOCK_BG, true);
    iCell.value = p.stock_piezas;
    iCell.numFmt = "#,##0";

    // Col J – Stock Físico (vacío, fondo verde — el usuario lo llena)
    const jCell = styleCell(10, COLOR_FISICO_BG);
    jCell.value = null;
    jCell.numFmt = "#,##0";

    // Col K – Diferencia (fórmula automática, fondo rojo suave)
    const kCell = styleCell(11, COLOR_DIFF_BG, true);
    kCell.value = { formula: `J${rowNum}-I${rowNum}` };
    kCell.numFmt = '+#,##0;-#,##0;"-"';

    // ─── Generar e insertar imagen del barcode (con caché de SKU) ───────────
    try {
      const skuParaBarcode = p.sku_pieza?.trim();
      if (skuParaBarcode) {
        let imageId = barcodeImageCache.get(skuParaBarcode);
        if (imageId === undefined) {
          const pngBase64 = generarBarcodePNG(skuParaBarcode);
          imageId = wb.addImage({ base64: pngBase64, extension: "png" });
          barcodeImageCache.set(skuParaBarcode, imageId);
        }

        ws.addImage(imageId, {
          tl: { col: 0.1, row: rowNum - 1 + 0.1 },
          ext: { width: 140, height: 40 },
          editAs: "oneCell",
        });
      }
    } catch {
      dataRow.getCell(1).value = p.sku_pieza;
    }
  } // fin for

  // Progreso final antes de serializar el buffer (writeBuffer comprime con JSZip)
  onProgress?.(productos.length, productos.length, "Generando archivo...");
  await yieldToMain();

  // ─── Regla de formato condicional en Diferencia ──────────────────────────────
  const lastRow = DATA_START_ROW + productos.length - 1;
  if (productos.length > 0) {
    // Negativo → rojo intenso
    ws.addConditionalFormatting({
      ref: `K${DATA_START_ROW}:K${lastRow}`,
      rules: [
        {
          type: "cellIs",
          operator: "lessThan",
          formulae: ["0"],
          priority: 1,
          style: {
            fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFCCCC" } },
            font: { bold: true, color: { argb: "CC0000" } },
          },
        },
        {
          type: "cellIs",
          operator: "greaterThan",
          formulae: ["0"],
          priority: 2,
          style: {
            fill: { type: "pattern", pattern: "solid", bgColor: { argb: "C3E6CB" } },
            font: { bold: true, color: { argb: "155724" } },
          },
        },
      ],
    });
  }

  // ─── Fila de totales al final ────────────────────────────────────────────────
  if (productos.length > 0) {
    const totalRow = ws.getRow(lastRow + 2);
    totalRow.height = 24;
    ws.mergeCells(`A${lastRow + 2}:H${lastRow + 2}`);

    const labelCell = totalRow.getCell(1);
    labelCell.value = "TOTALES";
    labelCell.font = { bold: true, size: 11, color: { argb: COLOR_HEADER_FG } };
    labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    labelCell.alignment = { horizontal: "right", vertical: "middle" };

    const totalStockCell = totalRow.getCell(9);
    totalStockCell.value = { formula: `SUM(I${DATA_START_ROW}:I${lastRow})` };
    totalStockCell.font = { bold: true, size: 11, color: { argb: COLOR_HEADER_FG } };
    totalStockCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    totalStockCell.numFmt = "#,##0";
    totalStockCell.alignment = { horizontal: "center", vertical: "middle" };

    const totalFisicoCell = totalRow.getCell(10);
    totalFisicoCell.value = { formula: `SUM(J${DATA_START_ROW}:J${lastRow})` };
    totalFisicoCell.font = { bold: true, size: 11, color: { argb: COLOR_HEADER_FG } };
    totalFisicoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    totalFisicoCell.numFmt = "#,##0";
    totalFisicoCell.alignment = { horizontal: "center", vertical: "middle" };

    const totalDiffCell = totalRow.getCell(11);
    totalDiffCell.value = { formula: `SUM(K${DATA_START_ROW}:K${lastRow})` };
    totalDiffCell.font = { bold: true, size: 11, color: { argb: COLOR_HEADER_FG } };
    totalDiffCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    totalDiffCell.numFmt = '+#,##0;-#,##0;"-"';
    totalDiffCell.alignment = { horizontal: "center", vertical: "middle" };
  }

  // ─── Descargar el archivo ────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `inventario_suc${idSucursal}_${fecha}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

