import { ipcMain, BrowserWindow } from "electron";
import { exec } from "child_process";

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
        console.log("Solicitud de apertura de cajón para:", printerName);
        if (!printerName) return false;

        try {
            // Comando ESC/POS estándar para abrir cajón: ESC p 0 25 250
            // En decimal: 27 112 0 25 250
            const command = `powershell -Command "[char]27 + [char]112 + [char]0 + [char]25 + [char]250 | Out-Printer -Name '${printerName}'"`;

            exec(command, (error) => {
                if (error) {
                    console.error("Error ejecutando comando de apertura de cajón:", error);
                }
            });
            return true;
        } catch (error) {
            console.error("Error al intentar abrir el cajón:", error);
            return false;
        }
    });

    ipcMain.handle('print-test-escpos', async (event, printerName) => {
        console.log("Probando impresión ESC/POS (MODO RAW FILE) en:", printerName);
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');

        try {
            const { ThermalPrinter, PrinterTypes } = await import('node-thermal-printer');

            // TRUCO: Usamos 'tcp' dummy para que la librería cargue su driver interno
            // y no nos pida librerías nativas extrañas.
            // NO vamos a usar printer.execute(), solo printer.getBuffer(), así que da igual la IP.
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
            //console.log(`Ticket generado. Tamaño: ${buffer.length} bytes.`);

            // 1. Crear ruta de archivo temporal
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `print_job_${Date.now()}.bin`);

            // 2. Escribir el buffer al archivo
            await fs.promises.writeFile(tempFilePath, buffer);
            //console.log("Archivo temporal creado:", tempFilePath);

            // 3. Ordenar a PowerShell que envíe ese archivo RAW a la impresora
            // El comando Get-Content -ReadCount 0 -Encoding Byte lee el archivo como bytes puros
            // Pero una forma más segura y rápida en Windows modernos es copiar al puerto o usar lpr,
            // sin embargo, para usar el spooler de Windows con driver USB, la mejor forma compatible es:
            // "cmd /c copy /b archivo \\computadora\impresora" (si está compartida)
            // O mejor aún, usar un script de PowerShell que inyecte los bytes.

            // SOLUCIÓN FINAL: Usar el objeto COM de .NET 'System.Drawing.Printing' es complejo de invocar desde linea de comando.
            // Vamos a intentar el método de "Copy-Item" o similar si es posible, pero Out-Printer espera texto.
            // Para RAW printing en Windows sin drivers extra, lo más directo hacky es copiar al puerto COM/LPT si fuera serial.
            // Al ser USB/Driver Windows, necesitamos inyectar al Spooler.

            // Usaremos un pequeño script en linea de C# dentro de PowerShell para hacer "RawPrinterHelper.SendFileToPrinter"
            // Es la forma oficial de Microsoft para mandar RAW a una impresora USB por nombre.

            const psScript = `
                $printerName = "${printerName}"
                $file = "${tempFilePath}"
                
                # Definición de P/Invoke para enviar RAW a impresora
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

                    public static bool SendFileToPrinter(string szPrinterName, string szFileName)
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

                        bSuccess = SendBytesToPrinter(szPrinterName, pUnmanagedBytes, nLength);
                        Marshal.FreeCoTaskMem(pUnmanagedBytes);
                        fs.Close();
                        return bSuccess;
                    }

                    public static bool SendBytesToPrinter(string szPrinterName, IntPtr pBytes, Int32 dwCount)
                    {
                        Int32 dwWritten = 0;
                        IntPtr hPrinter = new IntPtr(0);
                        DOCINFOA di = new DOCINFOA();
                        bool bSuccess = false;

                        di.pDocName = "Ticket RAW Electron";
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
                [RawPrinterHelper]::SendFileToPrinter($printerName, $file)
            `;

            console.log("Ejecutando script RAW de PowerShell...");

            return new Promise((resolve, reject) => {
                // Ejecutamos powershell con el script in-line
                const psProcess = exec('powershell -Command -', (error, stdout, stderr) => {
                    // Limpiamos el archivo temporal siempre
                    fs.unlink(tempFilePath, (err) => {
                        if (err) console.error("Error borrando temp:", err);
                    });

                    if (error) {
                        console.error("Error PowerShell:", error);
                        console.error("Stderr:", stderr);
                        reject(error);
                    } else {
                        console.log("Salida PowerShell:", stdout);
                        // Si devuelve True (string), es éxito
                        if (stdout.includes("True")) {
                            console.log("Impresión RAW exitosa.");
                            resolve(true);
                        } else {
                            console.warn("PowerShell no retornó True. Salida:", stdout);
                            resolve(true); // Asumimos éxito si no hubo error de proceso pero logueamos warning
                        }
                    }
                });

                // Escribimos el script en el STDIN de powershell para evitar problemas de escape de comillas
                psProcess.stdin.write(psScript);
                psProcess.stdin.end();
            });

        } catch (error) {
            console.error("Error generando ticket ESC/POS:", error);
            throw error;
        }
    });


    ipcMain.handle('print-ticket-venta-escpos', async (event, data) => {
        const { printerName, sucursal, usuario, cliente, folio, fecha, productos, total, pagoCon, cambio, cortar = true } = data;
        console.log("Generando TICKET VENTA ESC/POS para:", printerName);

        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');

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
            // --- PRODUCTOS ---
            printer.alignLeft();

            // Usamos fuente B (más pequeña) para los productos para ahorrar espacio
            printer.setTypeFontB();

            printer.println("CANT  DESCRIPCION           IMPORTE");
            printer.drawLine();

            productos.forEach((p) => {
                // Formato: 2.00  Coca Cola 600ml       $35.00
                // Hacemos un poco de magia para alinear columnas si es posible
                let cant = p.cantidad.toString().padEnd(5); // 5 chars para cantidad
                let nombre = p.nombre.substring(0, 20).padEnd(21); // 20 chars para nombre
                let importe = "$" + p.importe.toFixed(2);

                // Si el nombre es muy largo, lo imprimimos en una linea y el precio abajo o truncado
                // Aquí optamos por truncado simple para mantener 1 linea por producto lo más posible
                printer.println(`${cant} ${nombre} ${importe}`);
            });

            // Regresamos a fuente normal para totales
            printer.setTypeFontA();

            printer.drawLine();
            printer.newLine();

            // --- TOTALES ---
            printer.alignRight();
            printer.bold(true);
            printer.println(`TOTAL: $${Number(total).toFixed(2)}`);
            printer.bold(false);
            printer.println(`Pago con: $${Number(pagoCon).toFixed(2)}`);
            printer.println(`Cambio: $${Number(cambio).toFixed(2)}`);
            printer.newLine();

            // --- FOOTER ---
            printer.alignCenter();
            printer.println("¡Gracias por su compra!");
            printer.println("Vuelva pronto");
            printer.newLine();
            printer.newLine();

            if (cortar) {
                printer.cut();
            }
            printer.beep();

            const buffer = printer.getBuffer();

            // --- INYECCIÓN RAW FILE ---
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `venta_${Date.now()}.bin`);
            await fs.promises.writeFile(tempFilePath, buffer);

            const psScript = `
                $printerName = "${printerName}"
                $file = "${tempFilePath}"
                $code = @"
                using System;
                using System.Runtime.InteropServices;
                using System.IO;
                public class RawPrinterHelper {
                    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
                    public class DOCINFOA {
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
                    public static bool SendFileToPrinter(string szPrinterName, string szFileName) {
                        FileStream fs = new FileStream(szFileName, FileMode.Open);
                        BinaryReader br = new BinaryReader(fs);
                        Byte[] bytes = new Byte[fs.Length];
                        bool bSuccess = false;
                        IntPtr pUnmanagedBytes = new IntPtr(0);
                        int nLength = Convert.ToInt32(fs.Length);
                        bytes = br.ReadBytes(nLength);
                        pUnmanagedBytes = Marshal.AllocCoTaskMem(nLength);
                        Marshal.Copy(bytes, 0, pUnmanagedBytes, nLength);
                        bSuccess = SendBytesToPrinter(szPrinterName, pUnmanagedBytes, nLength);
                        Marshal.FreeCoTaskMem(pUnmanagedBytes);
                        fs.Close();
                        return bSuccess;
                    }
                    public static bool SendBytesToPrinter(string szPrinterName, IntPtr pBytes, Int32 dwCount) {
                        Int32 dwWritten = 0;
                        IntPtr hPrinter = new IntPtr(0);
                        DOCINFOA di = new DOCINFOA();
                        bool bSuccess = false;
                        di.pDocName = "Ticket Venta Electron";
                        di.pDataType = "RAW";
                        if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) {
                            if (StartDocPrinter(hPrinter, 1, di)) {
                                if (StartPagePrinter(hPrinter)) {
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
                [RawPrinterHelper]::SendFileToPrinter($printerName, $file)
            `;

            return new Promise((resolve, reject) => {
                const psProcess = exec('powershell -Command -', (error, stdout, stderr) => {
                    fs.unlink(tempFilePath, (err) => { if (err) console.error("Error borrando temp:", err); });
                    if (error) {
                        console.error("Error PowerShell:", error);
                        reject(error);
                    } else {
                        resolve(true);
                    }
                });
                psProcess.stdin.write(psScript);
                psProcess.stdin.end();
            });

        } catch (error) {
            console.error("Error generando ticket Venta ESC/POS:", error);
            throw error;
        }
    });

    ipcMain.handle('print-ticket-movimiento-escpos', async (event, data) => {
        const { printerName, sucursal, usuario, fecha, monto, concepto, tipo, cortar = true, abrirCajon = true } = data;
        console.log("Generando TICKET MOVIMIENTO ESC/POS para:", printerName);

        // 1. Abrir Cajón si se solicita
        if (abrirCajon && printerName) {
            const openCommand = `powershell -Command "[char]27 + [char]112 + [char]0 + [char]25 + [char]250 | Out-Printer -Name '${printerName}'"`;
            exec(openCommand, (error) => {
                if (error) console.error("Error al abrir cajón en movimiento:", error);
            });
        }

        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');

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

            // --- INYECCIÓN RAW FILE ---
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `movimiento_${Date.now()}.bin`);
            await fs.promises.writeFile(tempFilePath, buffer);

            const psScript = `
                $printerName = "${printerName}"
                $file = "${tempFilePath}"
                $code = @"
                using System;
                using System.Runtime.InteropServices;
                using System.IO;
                public class RawPrinterHelper {
                    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
                    public class DOCINFOA {
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
                    public static bool SendFileToPrinter(string szPrinterName, string szFileName) {
                        FileStream fs = new FileStream(szFileName, FileMode.Open);
                        BinaryReader br = new BinaryReader(fs);
                        Byte[] bytes = new Byte[fs.Length];
                        bool bSuccess = false;
                        IntPtr pUnmanagedBytes = new IntPtr(0);
                        int nLength = Convert.ToInt32(fs.Length);
                        bytes = br.ReadBytes(nLength);
                        pUnmanagedBytes = Marshal.AllocCoTaskMem(nLength);
                        Marshal.Copy(bytes, 0, pUnmanagedBytes, nLength);
                        bSuccess = SendBytesToPrinter(szPrinterName, pUnmanagedBytes, nLength);
                        Marshal.FreeCoTaskMem(pUnmanagedBytes);
                        fs.Close();
                        return bSuccess;
                    }
                    public static bool SendBytesToPrinter(string szPrinterName, IntPtr pBytes, Int32 dwCount) {
                        Int32 dwWritten = 0;
                        IntPtr hPrinter = new IntPtr(0);
                        DOCINFOA di = new DOCINFOA();
                        bool bSuccess = false;
                        di.pDocName = "Ticket Movimiento Electron";
                        di.pDataType = "RAW";
                        if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) {
                            if (StartDocPrinter(hPrinter, 1, di)) {
                                if (StartPagePrinter(hPrinter)) {
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
                [RawPrinterHelper]::SendFileToPrinter($printerName, $file)
            `;

            return new Promise((resolve, reject) => {
                const psProcess = exec('powershell -Command -', (error, stdout, stderr) => {
                    fs.unlink(tempFilePath, (err) => { if (err) console.error("Error borrando temp:", err); });
                    if (error) {
                        console.error("Error PowerShell:", error);
                        reject(error);
                    } else {
                        resolve(true);
                    }
                });
                psProcess.stdin.write(psScript);
                psProcess.stdin.end();
            });

        } catch (error) {
            console.error("Error generando ticket Movimiento ESC/POS:", error);
            throw error;
        }
    });


    ipcMain.handle('print-ticket', async (event, { content, printerName }) => {
        console.log("1. Recibida solicitud de impresión para:", printerName);

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
            console.log("2. Ventana creada");

            await printWindow.loadURL('about:blank');
            console.log("3. about:blank cargado");

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        @page {
                            margin: 0;
                            size: 80mm auto; 
                        }
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background-color: white; 
                            font-family: monospace; 
                            width: 100%;
                        }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
                </html>
            `;

            await printWindow.webContents.executeJavaScript(`document.write(\`${htmlContent}\`); document.close();`);
            console.log("4. Contenido inyectado");

            // Esperar un poco más para asegurar que el renderizado esté completo
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log("5. Ejecutando print()...");
                    printWindow.webContents.print({
                        silent: true,
                        deviceName: printerName,
                        printBackground: true,
                        margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 }
                        // Eliminamos pageSize para dejar que el driver maneje el largo continuo
                    }, (success, errorType) => {
                        console.log("6. Callback de print. Success:", success, "Error:", errorType);
                        if (!success) {
                            reject(errorType);
                        } else {
                            resolve(true);
                        }
                        // Cerrar la ventana después de un breve delay para asegurar que el trabajo se envió
                        setTimeout(() => printWindow.close(), 500);
                    });
                }, 1500);
            });

        } catch (e) {
            console.error("ERROR CRÍTICO EN IMPRESIÓN:", e);
            throw e;
        }
    });
}

export { utilsController };
