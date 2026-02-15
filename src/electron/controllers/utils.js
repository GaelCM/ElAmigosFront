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
        const { printerName, sucursal, id_sucursal, usuario, cliente, folio, fecha, productos, total, pagoCon, cambio, cortar = true } = data;
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

            // Abrir cajón si es necesario (generalmente se abre al imprimir el ticket de venta)
            printer.openCashDrawer();

            // --- HEADER ---
            printer.alignCenter();
            printer.bold(true);
            printer.println(sucursal);
            printer.bold(false);
            printer.println("Abarrotes y Refrescos");
            printer.newLine();

            printer.println(`Folio: ${folio}`);
            printer.println(`Fecha: ${new Date(fecha).toLocaleString()}`);
            printer.println(`Atendio: ${usuario}`);
            printer.println(`Cliente: ${cliente}`);
            printer.newLine();

            // --- PRODUCTOS ---
            printer.alignLeft();
            printer.setTypeFontA();
            printer.println("CANT  DESCRIPCION           IMPORTE");
            printer.drawLine();

            productos.forEach((p) => {
                const maxDescLen = 20;
                let cant = p.cantidad.toString().padEnd(5);
                let importe = "$" + p.importe.toFixed(2);

                // Dividir el nombre en varias líneas si es necesario
                const nombreFull = p.nombre || "";
                let words = nombreFull.split(' ');
                let lines = [];
                let currentLine = '';

                words.forEach(word => {
                    if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxDescLen) {
                        currentLine += (currentLine ? ' ' : '') + word;
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                        // Si una palabra es más larga que el límite, la forzamos a cortarse
                        while (currentLine.length > maxDescLen) {
                            lines.push(currentLine.substring(0, maxDescLen));
                            currentLine = currentLine.substring(maxDescLen);
                        }
                    }
                });
                if (currentLine) lines.push(currentLine);

                // Si no hay líneas (nombre vacío), al menos ponemos una vacía
                if (lines.length === 0) lines.push("");

                // Imprimir la primera línea con cantidad e importe
                printer.println(`${cant} ${lines[0].padEnd(maxDescLen + 1)} ${importe}`);

                // Imprimir líneas adicionales (solo la descripción, indentada)
                for (let i = 1; i < lines.length; i++) {
                    // Indentamos 6 espacios (5 de cantidad + 1 espacio)
                    printer.println(`${"".padEnd(6)}${lines[i]}`);
                }
            });

            printer.setTypeFontA();
            printer.drawLine();
            printer.newLine();

            // --- TOTALES ---
            printer.alignRight();
            printer.setTextDoubleHeight();
            printer.setTextDoubleWidth();
            printer.bold(true);
            printer.println(`TOTAL: $${Number(total).toFixed(2)}`);
            printer.println(`Pago con: $${Number(pagoCon).toFixed(2)}`);
            printer.println(`Cambio: $${Number(cambio).toFixed(2)}`);
            printer.setTextNormal();
            printer.bold(false);
            printer.newLine();

            // --- FOOTER ---
            printer.alignCenter();
            if (id_sucursal == 2) {
                printer.println("Pedidos al 951 115 4965");
                printer.println("¡Gracias por su compra!");
            } else {
                printer.println("¡Gracias por su compra!");
            }
            printer.println("Vuelva pronto");
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
            printer.println(sucursal);
            printer.bold(false);
            printer.println("COMPROBANTE DE MOVIMIENTO");
            printer.drawLine();
            printer.newLine();

            printer.alignLeft();
            printer.println(`TIPO:      ${tipo}`);
            printer.println(`FECHA:     ${new Date(fecha).toLocaleString()}`);
            printer.println(`USUARIO:   ${usuario}`);
            printer.println(`SUCURSAL:  ${sucursal}`);
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
            printer.italic(true);
            printer.println(concepto || "SIN CONCEPTO");
            printer.italic(false);
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
