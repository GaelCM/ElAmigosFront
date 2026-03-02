import { ipcMain, BrowserWindow } from "electron";
import { exec } from "child_process";
import fs from 'fs';
import path from 'path';
import os from 'os';

// Helper para enviar datos RAW a la impresora en Windows usando P/Invoke desde PowerShell
const executeRawPrint = async (printerName, buffer, docName = "Hermes POS Print") => {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `print_job_${Date.now()}.bin`);
    await fs.promises.writeFile(tempFilePath, buffer);

    const psScript = `
        $printerName = "${printerName}"
        $file = "${tempFilePath}"
        
        $code = @"
        using System;
        using System.Runtime.InteropServices;
        using System.IO;

        public class RawPrinterHelper
        {
            [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
            public class DOCINFOA
            {
                [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
                [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
                [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
            }
            [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
            public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

            [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
            public static extern bool ClosePrinter(IntPtr hPrinter);

            [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
            public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

            [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
            public static extern bool EndDocPrinter(IntPtr hPrinter);

            [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
            public static extern bool StartPagePrinter(IntPtr hPrinter);

            [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
            public static extern bool EndPagePrinter(IntPtr hPrinter);

            [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
            public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

            public static bool SendFileToPrinter(string szPrinterName, string szFileName, string szDocName)
            {
                FileStream fs = new FileStream(szFileName, FileMode.Open);
                BinaryReader br = new BinaryReader(fs);
                Byte[] bytes = new Byte[fs.Length];
                bool bSuccess = false;
                IntPtr pUnmanagedBytes = new IntPtr(0);
                int nLength;

                nLength = Convert.ToInt32(fs.Length);
                bytes = br.ReadBytes(nLength);
                pUnmanagedBytes = Marshal.AllocCoTaskMem(nLength);
                Marshal.Copy(bytes, 0, pUnmanagedBytes, nLength);

                bSuccess = SendBytesToPrinter(szPrinterName, pUnmanagedBytes, nLength, szDocName);
                Marshal.FreeCoTaskMem(pUnmanagedBytes);
                fs.Close();
                return bSuccess;
            }

            public static bool SendBytesToPrinter(string szPrinterName, IntPtr pBytes, Int32 dwCount, string szDocName)
            {
                Int32 dwWritten = 0;
                IntPtr hPrinter = new IntPtr(0);
                DOCINFOA di = new DOCINFOA();
                bool bSuccess = false;

                di.pDocName = szDocName;
                di.pDataType = "RAW";

                if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero))
                {
                    if (StartDocPrinter(hPrinter, 1, di))
                    {
                        if (StartPagePrinter(hPrinter))
                        {
                            bSuccess = WritePrinter(hPrinter, pBytes, dwCount, out dwWritten);
                            EndPagePrinter(hPrinter);
                        }
                        EndDocPrinter(hPrinter);
                    }
                    ClosePrinter(hPrinter);
                }
                return bSuccess;
            }
        }
"@
        Add-Type -TypeDefinition $code
        [RawPrinterHelper]::SendFileToPrinter($printerName, $file, "${docName}")
    `;

    return new Promise((resolve, reject) => {
        const psProcess = exec('powershell -Command -', (error, stdout, stderr) => {
            fs.unlink(tempFilePath, (err) => {
                if (err) console.error("Error borrando temp:", err);
            });

            if (error) {
                console.error("Error PowerShell:", error);
                reject(error);
            } else {
                // Mantenemos la lógica original: si hay stdout pero no dice "True", igual resolvemos true con un warning
                if (!stdout.includes("True")) {
                    console.warn("PowerShell no retornó True. Salida:", stdout);
                }
                resolve(true);
            }
        });

        psProcess.stdin.write(psScript);
        psProcess.stdin.end();
    });
};

function utilsController() {
    ipcMain.handle('list-prints', async (event) => {
        try {
            return await event.sender.getPrintersAsync();
        } catch (error) {
            console.error("Error al obtener impresoras:", error);
            return [];
        }
    });

    ipcMain.handle('open-cash-drawer', async (event, printerName) => {
        console.log("Solicitud de apertura de cajón (MODE RAW) para:", printerName);
        if (!printerName) return false;

        try {
            const { ThermalPrinter, PrinterTypes } = await import('node-thermal-printer');
            let printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: 'tcp://127.0.0.1', // dummy
            });

            printer.openCashDrawer();
            const buffer = printer.getBuffer();
            return await executeRawPrint(printerName, buffer, "Cash Drawer Kick");
        } catch (error) {
            console.error("Error al intentar abrir el cajón:", error);
            return false;
        }
    });

    ipcMain.handle('print-test-escpos', async (event, printerName) => {
        console.log("Probando impresión ESC/POS (MODO RAW FILE) en:", printerName);
        try {
            const { ThermalPrinter, PrinterTypes } = await import('node-thermal-printer');

            let printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: 'tcp://127.0.0.1',
                width: 48,
                characterSet: 'SLOVENIA',
                removeSpecialCharacters: false,
                lineCharacter: "=",
            });

            printer.alignCenter();
            printer.println("TEST IMPRESION RAW (FILE)");
            printer.newLine();
            printer.alignLeft();
            printer.println("Metodo: Archivo Temporal");
            printer.println("Estado: FUNCIONANDO");
            printer.println("--------------------------------");
            printer.println("Este ticket ha sido generado");
            printer.println("byte, guardado en disco y");
            printer.println("enviado directo al spooler.");
            printer.newLine();
            printer.alignCenter();
            printer.println("¡CORTE DE PAPEL!");
            printer.newLine();
            printer.println("--------------------------------");
            printer.newLine();
            printer.newLine();

            printer.cut();
            printer.beep();

            const buffer = printer.getBuffer();
            return await executeRawPrint(printerName, buffer, "Test Print Job");
        } catch (error) {
            console.error("Error generando ticket ESC/POS:", error);
            throw error;
        }
    });

    ipcMain.handle('print-ticket-venta-escpos', async (event, data) => {
        const { printerName, sucursal, id_sucursal, direccion_sucursal, telefono_sucursal, usuario, cliente, folio, fecha, productos, total, pagoCon, cambio, ahorro = 0, turno = "0", metodo_pago = 0, cortar = true } = data;
        console.log("Generando TICKET VENTA ESC/POS para:", printerName);

        try {
            const { ThermalPrinter, PrinterTypes } = await import('node-thermal-printer');

            let printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: 'tcp://127.0.0.1',
                width: 48,
                characterSet: 'SLOVENIA',
                removeSpecialCharacters: false,
                lineCharacter: "=",
            });

            // Abrir cajón si es necesario
            printer.openCashDrawer();

            // --- HEADER ---
            printer.alignCenter();
            printer.bold(true);
            printer.println((sucursal || "SUCURSAL").trim().toUpperCase());
            printer.bold(false);
            printer.println((direccion_sucursal || "DIRECCION NO DISPONIBLE").trim().toUpperCase());
            if (telefono_sucursal) printer.println(`TEL: ${telefono_sucursal}`);

            const fechaObj = new Date(fecha || Date.now());
            const fechaStr = fechaObj.toLocaleDateString('es-MX') + " " + fechaObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            printer.println(fechaStr);
            printer.newLine();

            printer.alignLeft();
            printer.println(`CAJERO:    ${(usuario || "GENERAL").toUpperCase()}`);
            printer.println(`TURNO #    ${turno}`);
            // En la imagen el folio parece estar a la derecha del turno o abajo
            printer.alignRight();
            printer.println(`FOLIO VENTA: ${folio || "S/N"}`);

            printer.alignLeft();
            printer.println(`CLIENTE:   ${(cliente || "GENERAL").toUpperCase()}`);
            printer.println("------------------------------------------------");

            printer.println("CANT. DESCRIPCION      PRECIO  IMPORTE");
            printer.println("================================================");

            // --- PRODUCTOS ---
            const listaProductos = productos || [];
            listaProductos.forEach((p) => {
                const cantidadVal = Number(p.cantidad || 0);
                const cant = cantidadVal.toString().padEnd(4);

                // Si el precio no viene, lo calculamos buscando no dividir por cero
                const importeVal = Number(p.importe || 0);
                const precioVal = p.precio || (cantidadVal > 0 ? (importeVal / cantidadVal) : 0);

                const precio = "$" + precioVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const importe = "$" + importeVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                const descWidth = 19;
                const priceWidth = 10;
                const impWidth = 11;

                const nombreFull = (p.nombre || "PRODUCTO SIN NOMBRE").toUpperCase();
                let words = nombreFull.split(' ');
                let lines = [];
                let currentLine = '';

                words.forEach(word => {
                    if ((currentLine + (currentLine ? ' ' : '') + word).length <= descWidth) {
                        currentLine += (currentLine ? ' ' : '') + word;
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                    }
                });
                if (currentLine) lines.push(currentLine);
                if (lines.length === 0) lines.push("");

                // Primera línea con cantidad, descripción parcial, precio e importe
                printer.println(`${cant} ${lines[0].padEnd(descWidth)} ${precio.padStart(priceWidth)} ${importe.padStart(impWidth)}`);

                // Líneas adicionales de descripción (indentadas)
                for (let i = 1; i < lines.length; i++) {
                    printer.println(`     ${lines[i]}`);
                }
            });

            printer.println("------------------------------------------------");

            // --- TOTAL PIEZAS ---
            const totalPiezas = listaProductos.reduce((sum, p) => sum + Number(p.cantidad || 0), 0);
            printer.alignLeft();
            printer.println(`NO. DE ARTICULOS: ${totalPiezas}`);

            // --- TOTALES ---
            printer.alignRight();
            printer.setTextDoubleHeight();
            printer.setTextDoubleWidth();
            printer.bold(true);
            printer.println(`TOTAL: $${Number(total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            printer.setTextNormal();
            printer.bold(false);

            if (metodo_pago === 2) {
                printer.println("METODO DE PAGO: CREDITO");
            } else {
                printer.println(`PAGO CON: $${Number(pagoCon || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                printer.println(`SU CAMBIO: $${Number(cambio || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            }

            printer.println(`USTED AHORRO: $${Number(ahorro || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            printer.bold(false);
            printer.newLine();

            // --- FIRMAS (Solo para crédito) ---
            if (metodo_pago === 2) {
                printer.alignCenter();
                printer.newLine();
                printer.println("__________________________");
                printer.println("FIRMA DEL CLIENTE");
                printer.newLine();
                printer.newLine();
                printer.println("__________________________");
                printer.println("FIRMA DEL CAJERO");
                printer.newLine();
            }

            // --- FOOTER ---
            printer.alignCenter();
            printer.println("GRACIAS POR SU COMPRA");
            printer.println("VUELVA PRONTO");
            printer.println(`PEDIDOS POR WHATSAPP ${telefono_sucursal || '9512036123'}`);
            printer.newLine();
            printer.newLine();

            if (cortar) {
                printer.cut();
            }
            printer.beep();

            const buffer = printer.getBuffer();
            return await executeRawPrint(printerName, buffer, `Ticket Venta ${folio}`);
        } catch (error) {
            console.error("Error generando ticket Venta ESC/POS:", error);
            throw error;
        }
    });

    ipcMain.handle('print-ticket-movimiento-escpos', async (event, data) => {
        const { printerName, sucursal, usuario, fecha, monto, concepto, tipo, cortar = true, abrirCajon = true } = data;
        console.log("Generando TICKET MOVIMIENTO ESC/POS para:", printerName);

        try {
            const { ThermalPrinter, PrinterTypes } = await import('node-thermal-printer');

            let printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: 'tcp://127.0.0.1',
                width: 48,
                characterSet: 'SLOVENIA',
                removeSpecialCharacters: false,
                lineCharacter: "=",
            });

            if (abrirCajon) {
                printer.openCashDrawer();
            }

            // --- HEADER ---
            printer.alignCenter();
            printer.bold(true);
            printer.println((sucursal || "SUCURSAL").toUpperCase());
            printer.bold(false);
            printer.println("COMPROBANTE DE MOVIMIENTO");
            printer.drawLine();
            printer.newLine();

            printer.alignLeft();
            printer.println(`TIPO:      ${(tipo || "N/A").toUpperCase()}`);
            printer.println(`FECHA:     ${new Date(fecha || Date.now()).toLocaleString()}`);
            printer.println(`USUARIO:   ${(usuario || "GENERAL").toUpperCase()}`);
            printer.println(`SUCURSAL:  ${(sucursal || "SUCURSAL").toUpperCase()}`);
            printer.newLine();

            printer.drawLine();
            printer.alignCenter();
            printer.setTextDoubleHeight();
            printer.setTextDoubleWidth();
            printer.bold(true);
            printer.println(`MONTO: $${Number(monto).toFixed(2)}`);
            printer.bold(false);
            printer.setTextNormal();
            printer.drawLine();
            printer.newLine();

            printer.alignLeft();
            printer.println("CONCEPTO:");
            printer.println(concepto || "SIN CONCEPTO");
            printer.newLine();
            printer.newLine();

            printer.alignCenter();
            printer.println("__________________________");
            printer.println("FIRMA");
            printer.newLine();
            printer.newLine();

            if (cortar) {
                printer.cut();
            }
            printer.beep();

            const buffer = printer.getBuffer();
            return await executeRawPrint(printerName, buffer, "Ticket Movimiento");
        } catch (error) {
            console.error("Error generando ticket Movimiento ESC/POS:", error);
            throw error;
        }
    });

    ipcMain.handle('print-ticket-corte-escpos', async (event, data) => {
        const { printerName, sucursal, usuario, fecha, id_turno, ventas, egresos, movimientos, efectivo, cortar = true } = data;
        console.log("Generando TICKET CORTE ESC/POS para:", printerName);

        try {
            const { ThermalPrinter, PrinterTypes } = await import('node-thermal-printer');

            let printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: 'tcp://127.0.0.1',
                width: 48,
                characterSet: 'SLOVENIA',
                removeSpecialCharacters: false,
                lineCharacter: "=",
            });

            // --- HEADER ---
            printer.alignCenter();
            printer.bold(true);
            printer.println((sucursal || "SUCURSAL").toUpperCase());
            printer.println("CORTE DE CAJA");
            printer.bold(false);
            printer.println(`TURNO # ${id_turno}`);
            printer.println("------------------------------------------------");
            printer.newLine();

            printer.alignLeft();
            printer.println(`FECHA:   ${new Date(fecha || Date.now()).toLocaleString()}`);
            printer.println(`USUARIO: ${(usuario || "GENERAL").toUpperCase()}`);
            printer.newLine();

            // --- VENTAS ---
            printer.bold(true);
            printer.println("RESUMEN DE VENTAS");
            printer.bold(false);
            printer.println(`  TOTAL VENTAS:      $${Number(ventas.total).toFixed(2)}`);
            printer.println(`  (+) EFECTIVO:      $${Number(ventas.efectivo).toFixed(2)}`);
            printer.println(`  (+) TARJETA:       $${Number(ventas.tarjeta).toFixed(2)}`);
            printer.println(`  (+) CREDITO:       $${Number(ventas.credito).toFixed(2)}`);
            printer.println(`  NO. VENTAS:        ${ventas.numero}`);
            printer.newLine();

            // --- EGRESOS ---
            printer.bold(true);
            printer.println("EGRESOS Y MOVIMIENTOS");
            printer.bold(false);
            printer.println(`  (-) COMPRAS:       $${Number(egresos.compras).toFixed(2)}`);
            printer.println(`  (-) GASTOS:        $${Number(egresos.gastos).toFixed(2)}`);
            printer.println(`  (+) DEPOSITOS:     $${Number(movimientos.depositos).toFixed(2)}`);
            printer.println(`  (-) RETIROS:       $${Number(movimientos.retiros).toFixed(2)}`);
            printer.newLine();

            // --- AUDITORIA ---
            printer.println("------------------------------------------------");
            printer.alignRight();
            printer.println(`EFECTIVO INICIAL:    $${Number(efectivo.inicial).toFixed(2)}`);
            printer.println(`VENTAS EFECTIVO:    $${Number(ventas.efectivo).toFixed(2)}`);

            // Abonos/Cobranza si están disponibles
            if (data.abonos_recibidos) {
                printer.println(`ABONOS RECIBIDOS:   $${Number(data.abonos_recibidos).toFixed(2)}`);
            }

            printer.bold(true);
            printer.println(`ESPERADO CAJA:      $${Number(efectivo.esperado).toFixed(2)}`);

            printer.setTextDoubleHeight();
            printer.setTextDoubleWidth();
            printer.println(`CONTADO: $${Number(efectivo.contado).toFixed(2)}`);
            printer.setTextNormal();

            printer.println(`DIFERENCIA:         $${Number(efectivo.diferencia).toFixed(2)}`);
            printer.bold(false);
            printer.println("------------------------------------------------");
            printer.newLine();

            if (efectivo.diferencia < 0) {
                printer.alignCenter();
                printer.println("*** FALTANTE DETECTADO ***");
            } else if (efectivo.diferencia > 0) {
                printer.alignCenter();
                printer.println("*** SOBRANTE DETECTADO ***");
            } else {
                printer.alignCenter();
                printer.println("*** CAJA CUADRADA ***");
            }
            printer.newLine();

            printer.alignCenter();
            printer.println("__________________________");
            printer.println("FIRMA DE RESPONSABLE");
            printer.newLine();

            if (cortar) {
                printer.cut();
            }
            printer.beep();

            const buffer = printer.getBuffer();
            return await executeRawPrint(printerName, buffer, `Corte Turno ${id_turno}`);
        } catch (error) {
            console.error("Error generando ticket Corte ESC/POS:", error);
            throw error;
        }
    });

    ipcMain.handle('print-ticket-abono-escpos', async (event, data) => {
        const { printerName, sucursal, usuario, cliente, fecha, monto, saldoAnterior, saldoNuevo, concepto, tipo, cortar = true } = data;
        console.log("Generando TICKET ABONO ESC/POS para:", printerName);

        try {
            const { ThermalPrinter, PrinterTypes } = await import('node-thermal-printer');

            let printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: 'tcp://127.0.0.1',
                width: 48,
                characterSet: 'SLOVENIA',
                removeSpecialCharacters: false,
                lineCharacter: "=",
            });

            // --- HEADER ---
            printer.alignCenter();
            printer.bold(true);
            printer.println((sucursal || "SUCURSAL").toUpperCase());
            printer.bold(false);
            printer.println("COMPROBANTE DE PAGO");
            printer.println("------------------------------------------------");
            printer.newLine();

            printer.alignLeft();
            printer.println(`TIPO:      ${(tipo || "ABONO").toUpperCase()}`);
            printer.println(`FECHA:     ${new Date(fecha || Date.now()).toLocaleString()}`);
            printer.println(`CLIENTE:   ${(cliente || "N/A").toUpperCase()}`);
            printer.println(`CAJERO:    ${(usuario || "GENERAL").toUpperCase()}`);
            printer.newLine();

            printer.println("------------------------------------------------");
            printer.alignRight();
            printer.println(`SALDO ANTERIOR: $${Number(saldoAnterior).toFixed(2)}`);

            printer.setTextDoubleHeight();
            printer.setTextDoubleWidth();
            printer.bold(true);
            printer.println(`ABONO: $${Number(monto).toFixed(2)}`);
            printer.setTextNormal();

            printer.println(`SALDO ACTUAL: $${Number(saldoNuevo).toFixed(2)}`);
            printer.bold(false);
            printer.println("------------------------------------------------");
            printer.newLine();

            if (concepto) {
                printer.alignLeft();
                printer.println("CONCEPTO:");
                printer.println(concepto.toUpperCase());
                printer.newLine();
            }

            if (Number(saldoNuevo) <= 0) {
                printer.alignCenter();
                printer.bold(true);
                printer.println("¡CUENTA LIQUIDADA!");
                printer.println("GRACIAS POR SU PUNTUALIDAD");
                printer.bold(false);
                printer.newLine();
            }

            printer.alignCenter();
            printer.println("__________________________");
            printer.println("FIRMA DE RECIBIDO");
            printer.newLine();
            printer.println("CONSERVE ESTE COMPROBANTE");
            printer.newLine();

            if (cortar) {
                printer.cut();
            }
            printer.beep();

            const buffer = printer.getBuffer();
            return await executeRawPrint(printerName, buffer, "Ticket Abono");
        } catch (error) {
            console.error("Error generando ticket Abono ESC/POS:", error);
            throw error;
        }
    });

    ipcMain.handle('print-ticket-transferencia-escpos', async (event, data) => {
        const { printerName, id_transferencia, sucursal_origen, sucursal_destino, usuario_origen, fecha, productos, motivo, cortar = true } = data;
        console.log("Generando TICKET TRANSFERENCIA ESC/POS para:", printerName);

        try {
            const { ThermalPrinter, PrinterTypes } = await import('node-thermal-printer');

            let printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: 'tcp://127.0.0.1',
                width: 48,
                characterSet: 'SLOVENIA',
                removeSpecialCharacters: false,
                lineCharacter: "=",
            });

            // --- HEADER ---
            printer.alignCenter();
            printer.bold(true);
            printer.println("EL AMIGOS - TRANSFERENCIA");
            printer.println("COMPROBANTE DE ENVIO");
            printer.bold(false);
            printer.drawLine();
            printer.newLine();

            printer.alignLeft();
            printer.println(`FOLIO:      #${id_transferencia}`);
            printer.println(`FECHA:      ${new Date(fecha || Date.now()).toLocaleString()}`);
            printer.println(`ORIGEN:     ${(sucursal_origen || "N/A").toUpperCase()}`);
            printer.println(`DESTINO:    ${(sucursal_destino || "N/A").toUpperCase()}`);
            printer.println(`SOLICITA:   ${(usuario_origen || "N/A").toUpperCase()}`);
            printer.newLine();

            if (motivo) {
                printer.println("MOTIVO:");
                printer.println(motivo.toUpperCase());
                printer.newLine();
            }

            printer.drawLine();
            printer.println("CANT.   DESCRIPCION");
            printer.println("================================================");

            // --- PRODUCTOS ---
            (productos || []).forEach((p) => {
                const cant = p.cantidad_enviada.toString().padEnd(7);
                const descWidth = 40;
                const nombreFull = `${p.nombre_producto} ${p.nombre_presentacion || ""}`.trim().toUpperCase();

                let words = nombreFull.split(' ');
                let lines = [];
                let currentLine = '';

                words.forEach(word => {
                    if ((currentLine + (currentLine ? ' ' : '') + word).length <= descWidth) {
                        currentLine += (currentLine ? ' ' : '') + word;
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                    }
                });
                if (currentLine) lines.push(currentLine);

                // Primera línea
                printer.println(`${cant} ${lines[0] || ""}`);

                // Líneas adicionales
                for (let i = 1; i < lines.length; i++) {
                    printer.println(`        ${lines[i]}`);
                }
            });

            printer.drawLine();
            printer.newLine();
            printer.newLine();

            // --- FIRMAS ---
            printer.alignCenter();
            printer.println("__________________________      __________________________");
            printer.println("      ENTREGA (ORIGEN)                RECIBE (DESTINO)    ");
            printer.newLine();
            printer.println("ESTE DOCUMENTO ES UN COMPROBANTE DE TRASLADO DE MERCANCIA");
            printer.println("POR FAVOR VERIFIQUE SU MERCANCIA AL RECIBIR");
            printer.newLine();
            printer.newLine();

            if (cortar) {
                printer.cut();
            }
            printer.beep();

            const buffer = printer.getBuffer();
            return await executeRawPrint(printerName, buffer, `Transferencia #${id_transferencia}`);
        } catch (error) {
            console.error("Error generando ticket Transferencia ESC/POS:", error);
            throw error;
        }
    });



    ipcMain.handle('print-ticket', async (event, { content, printerName }) => {
        console.log("Recibida solicitud de impresión HTML para:", printerName);

        try {
            let printWindow = new BrowserWindow({
                show: false,
                width: 360,
                height: 600,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });

            await printWindow.loadURL('about:blank');

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        @page { margin: 0; size: 80mm auto; }
                        body { margin: 0; padding: 0; background-color: white; font-family: monospace; width: 100%; }
                    </style>
                </head>
                <body>${content}</body>
                </html>
            `;

            await printWindow.webContents.executeJavaScript(`document.write(\`${htmlContent}\`); document.close();`);

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    printWindow.webContents.print({
                        silent: true,
                        deviceName: printerName,
                        printBackground: true,
                        margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 }
                    }, (success, errorType) => {
                        if (!success) {
                            reject(errorType);
                        } else {
                            resolve(true);
                        }
                        setTimeout(() => printWindow.close(), 500);
                    });
                }, 1500);
            });
        } catch (e) {
            console.error("ERROR CRÍTICO EN IMPRESIÓN HTML:", e);
            throw e;
        }
    });


}

export { utilsController };
