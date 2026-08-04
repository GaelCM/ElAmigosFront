import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";

const COLS = 32;

export interface ProductoTicket {
    cantidad?: number | string;
    nombre?: string;
    importe?: number;
}

export interface VentaTicketData {
    sucursal?: string;
    direccion_sucursal?: string;
    telefono_sucursal?: string;
    usuario?: string;
    cliente?: string;
    folio?: number | string;
    fecha?: Date | string | number;
    productos?: ProductoTicket[];
    total?: number;
    pagoCon?: number;
    cambio?: number;
    ahorro?: number;
    turno?: number | string;
    metodo_pago?: number;
    isCopia?: boolean;
}

export interface MovimientoTicketData {
    sucursal?: string;
    usuario?: string;
    fecha?: Date | string | number;
    monto?: number;
    concepto?: string;
    tipo?: string;
}

export interface CorteVentasData {
    total?: number;
    efectivo?: number;
    tarjeta?: number;
    credito?: number;
    numero?: number | string;
}

export interface CorteEgresosData {
    compras?: number;
    gastos?: number;
}

export interface CorteMovimientosData {
    depositos?: number;
    retiros?: number;
}

export interface CorteEfectivoData {
    inicial?: number;
    esperado?: number;
    contado?: number;
    diferencia?: number;
}

export interface CorteTicketData {
    sucursal?: string;
    usuario?: string;
    fecha?: Date | string | number;
    id_turno?: number | string;
    ventas?: CorteVentasData;
    egresos?: CorteEgresosData;
    movimientos?: CorteMovimientosData;
    efectivo?: CorteEfectivoData;
    abonos_recibidos?: number;
}

export interface AbonoTicketData {
    sucursal?: string;
    usuario?: string;
    cliente?: string;
    fecha?: Date | string | number;
    monto?: number;
    saldoAnterior?: number;
    saldoNuevo?: number;
    concepto?: string;
    tipo?: string;
}

export interface TransferenciaProducto {
    nombre_producto?: string;
    nombre_presentacion?: string;
    cantidad_enviada?: number;
    factor_conversion_cantidad?: number;
    es_producto_compuesto?: number;
    componentes?: Array<{ nombre_componente?: string; total_piezas?: number }>;
}

export interface TransferenciaTicketData {
    id_transferencia?: number | string;
    sucursal_origen?: string;
    sucursal_destino?: string;
    usuario_origen?: string;
    fecha?: Date | string | number;
    productos?: TransferenciaProducto[];
    motivo?: string;
}

function newEncoder(): ReceiptPrinterEncoder {
    return new ReceiptPrinterEncoder({ language: "esc-pos", columns: COLS })
        .initialize()
        .codepage("cp850");
}

function money(value: number | string | undefined | null): string {
    return "$" + Number(value || 0).toFixed(2);
}

function fechaCorta(value: Date | string | number | undefined): string {
    const d = new Date(value || Date.now());
    return (
        d.toLocaleDateString("es-MX") +
        " " +
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    );
}

function fechaLarga(value: Date | string | number | undefined): string {
    return new Date(value || Date.now()).toLocaleString();
}

function wrapWords(text: string, width: number): string[] {
    const lines: string[] = [];
    let current = "";
    for (const word of text.split(" ")) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= width) {
            current = candidate;
        } else {
            if (current) lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function line32(enc: ReceiptPrinterEncoder, text: string, indent = 0): ReceiptPrinterEncoder {
    const t = text.length > COLS - indent ? text.slice(0, COLS - indent) : text;
    if (indent) enc.raw(" ".repeat(indent));
    return enc.line(t);
}

function bigLine(enc: ReceiptPrinterEncoder, text: string): ReceiptPrinterEncoder {
    const truncated = text.length > 16 ? text.slice(0, 16) : text;
    enc.size(2).bold(true).line(truncated).bold(false).size(1);
    return enc;
}

const SEP = "=".repeat(COLS);
const SEP_LIGHT = "-".repeat(COLS);

export function encodeVentaTicket(data: VentaTicketData, cortar: boolean): Uint8Array {
    const enc = newEncoder();

    enc.align("center");
    enc.bold(true).line((data.sucursal || "SUCURSAL").toUpperCase()).bold(false);
    line32(enc, (data.direccion_sucursal || "DIRECCION NO DISPONIBLE").toUpperCase());
    if (data.telefono_sucursal) line32(enc, `TEL: ${data.telefono_sucursal}`);
    enc.line(fechaCorta(data.fecha));
    enc.newline();

    enc.align("left");
    enc.line(`CAJERO:    ${(data.usuario || "GENERAL").toUpperCase()}`);
    enc.line(`TURNO #    ${data.turno ?? "0"}`);
    enc.align("right").line(`FOLIO VENTA: ${data.folio ?? "S/N"}`);
    enc.align("left").line(`CLIENTE:   ${(data.cliente || "GENERAL").toUpperCase()}`);
    enc.line(SEP_LIGHT);

    const productos = data.productos || [];
    enc.line("CANT. DESCRIPCION IMPORTE".padEnd(COLS));
    enc.line(SEP);

    const totalPiezas = productos.reduce((sum, p) => sum + Number(p.cantidad || 0), 0);

    for (const p of productos) {
        const cantidadVal = Number(p.cantidad || 0);
        const importeVal = Number(p.importe || 0);

        const cant = cantidadVal.toString().padEnd(3);
        const descLines = wrapWords((p.nombre || "PRODUCTO SIN NOMBRE").toUpperCase(), 19);

        line32(enc, `${cant} ${descLines[0].padEnd(19)} ${money(importeVal).padStart(8)}`);

        for (let i = 1; i < descLines.length; i++) {
            line32(enc, descLines[i], 4);
        }
    }

    enc.line(SEP_LIGHT);
    enc.bold(true).line(`NO. DE ARTICULOS: ${totalPiezas}`).bold(false);

    enc.align("right");
    bigLine(enc, `TOTAL: ${money(data.total)}`);

    if (data.metodo_pago === 2) {
        enc.line("METODO DE PAGO: CREDITO");
    } else {
        enc.line(`PAGO CON: ${money(data.pagoCon)}`);
        enc.line(`SU CAMBIO: ${money(data.cambio)}`);
    }
    enc.line(`USTED AHORRO: ${money(data.ahorro)}`);
    enc.newline();

    if (data.metodo_pago === 2) {
        enc.align("center");
        enc.newline();
        enc.line("______________________");
        enc.line("FIRMA DEL CLIENTE");
        enc.newline();
        enc.newline();
        enc.line("______________________");
        enc.line("FIRMA DEL CAJERO");
        enc.newline();
    }

    enc.align("center");
    enc.line("GRACIAS POR SU COMPRA");
    enc.line("VUELVA PRONTO");
    line32(enc, `PEDIDOS POR WHATSAPP ${data.telefono_sucursal || "9512036123"}`);
    if (data.isCopia) line32(enc, "ESTA ES UNA COPIA DEL TICKET");
    enc.newline(3);

    if (cortar) enc.cut();
    return enc.encode();
}

export function encodeMovimientoTicket(data: MovimientoTicketData, cortar: boolean): Uint8Array {
    const enc = newEncoder();

    enc.align("center");
    enc.bold(true).line((data.sucursal || "SUCURSAL").toUpperCase()).bold(false);
    enc.line("COMPROBANTE DE MOVIMIENTO");
    enc.line(SEP);
    enc.newline();

    enc.align("left");
    enc.line(`TIPO:      ${(data.tipo || "N/A").toUpperCase()}`);
    line32(enc, `FECHA:     ${fechaLarga(data.fecha)}`);
    enc.line(`USUARIO:   ${(data.usuario || "GENERAL").toUpperCase()}`);
    enc.line(`SUCURSAL:  ${(data.sucursal || "SUCURSAL").toUpperCase()}`);
    enc.newline();

    enc.line(SEP);
    enc.align("center");
    bigLine(enc, `MONTO: ${money(data.monto)}`);
    enc.line(SEP);
    enc.newline();

    enc.align("left");
    enc.line("CONCEPTO:");
    line32(enc, (data.concepto || "SIN CONCEPTO").toUpperCase());
    enc.newline(2);

    enc.align("center");
    enc.line("______________________");
    enc.line("FIRMA");
    enc.newline(2);

    if (cortar) enc.cut();
    return enc.encode();
}

export function encodeCorteTicket(data: CorteTicketData, cortar: boolean): Uint8Array {
    const enc = newEncoder();
    const ventas = data.ventas || {};
    const egresos = data.egresos || {};
    const movimientos = data.movimientos || {};
    const efectivo = data.efectivo || {};

    enc.align("center");
    enc.bold(true);
    enc.line((data.sucursal || "SUCURSAL").toUpperCase());
    enc.line("CORTE DE CAJA");
    enc.bold(false);
    enc.line(`TURNO # ${data.id_turno ?? ""}`);
    enc.line(SEP);
    enc.newline();

    enc.align("left");
    line32(enc, `FECHA:   ${fechaLarga(data.fecha)}`);
    enc.line(`USUARIO: ${(data.usuario || "GENERAL").toUpperCase()}`);
    enc.newline();

    enc.bold(true).line("RESUMEN DE VENTAS").bold(false);
    line32(enc, `TOTAL VENTAS:      ${money(ventas.total)}`, 2);
    line32(enc, `(+) EFECTIVO:      ${money(ventas.efectivo)}`, 2);
    line32(enc, `(+) TARJETA:       ${money(ventas.tarjeta)}`, 2);
    line32(enc, `(+) CREDITO:       ${money(ventas.credito)}`, 2);
    line32(enc, `NO. VENTAS:        ${ventas.numero ?? 0}`, 2);
    enc.newline();

    enc.bold(true).line("EGRESOS Y MOVIMIENTOS").bold(false);
    line32(enc, `(-) COMPRAS:       ${money(egresos.compras)}`, 2);
    line32(enc, `(-) GASTOS:        ${money(egresos.gastos)}`, 2);
    line32(enc, `(+) DEPOSITOS:     ${money(movimientos.depositos)}`, 2);
    line32(enc, `(-) RETIROS:       ${money(movimientos.retiros)}`, 2);
    enc.newline();

    enc.line(SEP);
    enc.align("right");
    line32(enc, `EFECTIVO INICIAL:    ${money(efectivo.inicial)}`);
    line32(enc, `VENTAS EFECTIVO:    ${money(ventas.efectivo)}`);
    if (data.abonos_recibidos) {
        line32(enc, `ABONOS RECIBIDOS:   ${money(data.abonos_recibidos)}`);
    }
    enc.bold(true);
    line32(enc, `ESPERADO CAJA:      ${money(efectivo.esperado)}`);
    bigLine(enc, `CONTADO: ${money(efectivo.contado)}`);
    enc.line(`DIFERENCIA:         ${money(efectivo.diferencia)}`);
    enc.bold(false);
    enc.line(SEP);
    enc.newline();

    const diferencia = Number(efectivo.diferencia || 0);
    enc.align("center");
    if (diferencia < 0) {
        enc.line("*** FALTANTE DETECTADO ***");
    } else if (diferencia > 0) {
        enc.line("*** SOBRANTE DETECTADO ***");
    } else {
        enc.line("*** CAJA CUADRADA ***");
    }
    enc.newline();

    enc.line("______________________");
    enc.line("FIRMA DE RESPONSABLE");
    enc.newline(2);

    if (cortar) enc.cut();
    return enc.encode();
}

export function encodeAbonoTicket(data: AbonoTicketData, cortar: boolean): Uint8Array {
    const enc = newEncoder();

    enc.align("center");
    enc.bold(true).line((data.sucursal || "SUCURSAL").toUpperCase()).bold(false);
    enc.line("COMPROBANTE DE PAGO");
    enc.line(SEP);
    enc.newline();

    enc.align("left");
    enc.line(`TIPO:      ${(data.tipo || "ABONO").toUpperCase()}`);
    line32(enc, `FECHA:     ${fechaLarga(data.fecha)}`);
    enc.line(`CLIENTE:   ${(data.cliente || "N/A").toUpperCase()}`);
    enc.line(`CAJERO:    ${(data.usuario || "GENERAL").toUpperCase()}`);
    enc.newline();

    enc.line(SEP);
    enc.align("right");
    line32(enc, `SALDO ANTERIOR: ${money(data.saldoAnterior)}`);
    bigLine(enc, `ABONO: ${money(data.monto)}`);
    line32(enc, `SALDO ACTUAL: ${money(data.saldoNuevo)}`);
    enc.line(SEP);
    enc.newline();

    if (data.concepto) {
        enc.align("left");
        enc.line("CONCEPTO:");
        line32(enc, data.concepto.toUpperCase());
        enc.newline();
    }

    if (Number(data.saldoNuevo || 0) <= 0) {
        enc.align("center");
        enc.bold(true);
        enc.line("¡CUENTA LIQUIDADA!");
        enc.line("GRACIAS POR SU PUNTUALIDAD");
        enc.bold(false);
        enc.newline();
    }

    enc.align("center");
    enc.line("______________________");
    enc.line("FIRMA DE RECIBIDO");
    enc.newline();
    enc.line("CONSERVE ESTE COMPROBANTE");
    enc.newline(2);

    if (cortar) enc.cut();
    return enc.encode();
}

export function encodeTransferenciaTicket(data: TransferenciaTicketData, cortar: boolean): Uint8Array {
    const enc = newEncoder();

    enc.align("center");
    enc.bold(true);
    enc.line("EL AMIGOS - TRANSFERENCIA");
    enc.line("COMPROBANTE DE ENVIO");
    enc.bold(false);
    enc.line(SEP);
    enc.newline();

    enc.align("left");
    enc.line(`FOLIO:      #${data.id_transferencia ?? ""}`);
    line32(enc, `FECHA:      ${fechaLarga(data.fecha)}`);
    line32(enc, `ORIGEN:     ${(data.sucursal_origen || "N/A").toUpperCase()}`);
    line32(enc, `DESTINO:    ${(data.sucursal_destino || "N/A").toUpperCase()}`);
    line32(enc, `SOLICITA:   ${(data.usuario_origen || "N/A").toUpperCase()}`);
    enc.newline();

    if (data.motivo) {
        enc.line("MOTIVO:");
        line32(enc, data.motivo.toUpperCase());
        enc.newline();
    }

    enc.line(SEP);
    enc.line("CANT.PKT PIEZAS DESCRIPCION");
    enc.line(SEP);

    const productos = data.productos || [];
    for (const p of productos) {
        const factor = Number(p.factor_conversion_cantidad) || 1;
        const piezas = Number(p.cantidad_enviada) || 0;
        const paquetes = Math.round(piezas / factor);

        const cantPkt = paquetes.toString().padEnd(8);
        const cantPzas = piezas.toString().padEnd(6);
        const nombreFull = `${p.nombre_presentacion || ""} ${p.nombre_producto || ""}`.trim().toUpperCase();

        const descLines = wrapWords(nombreFull, 18);

        line32(enc, `${cantPkt}${cantPzas}${descLines[0] || ""}`);

        for (let i = 1; i < descLines.length; i++) {
            line32(enc, descLines[i], 14);
        }

        if (Number(p.es_producto_compuesto) === 1 && Array.isArray(p.componentes) && p.componentes.length > 0) {
            line32(enc, "DESGLOSE:", 2);
            for (const comp of p.componentes) {
                line32(enc, `- ${(comp.nombre_componente || "").toUpperCase()}: ${Number(comp.total_piezas) || 0} pzas`, 4);
            }
        }
    }

    enc.line(SEP);
    enc.newline(2);

    enc.align("center");
    enc.line("______________________");
    enc.line("ENTREGA (ORIGEN)");
    enc.newline();
    enc.line("______________________");
    enc.line("RECIBE (DESTINO)");
    enc.newline();
    line32(enc, "ESTE DOCUMENTO ES UN COMPROBANTE");
    line32(enc, "DE TRASLADO DE MERCANCIA");
    line32(enc, "POR FAVOR VERIFIQUE SU MERCANCIA");
    enc.newline(2);

    if (cortar) enc.cut();
    return enc.encode();
}

export function encodeTestTicket(printerName: string | null, cortar: boolean): Uint8Array {
    const enc = newEncoder();

    enc.align("center");
    enc.bold(true).line("TEST DE IMPRESION").bold(false);
    enc.line("IMPRESORA BLUETOOTH 58MM");
    enc.line(SEP);
    enc.newline();

    enc.align("left");
    enc.line(`Impresora: ${printerName || "WEB BLUETOOTH"}`);
    enc.line("Metodo: Web Bluetooth");
    enc.line("Estado: FUNCIONANDO");
    enc.newline();

    enc.align("center");
    enc.bold(true).line("¡FUNCIONA!").bold(false);
    enc.newline(3);

    if (cortar) enc.cut();
    return enc.encode();
}
