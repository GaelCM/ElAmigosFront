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

    ipcMain.handle('print-and-open', async (event, { content, printerName }) => {
        console.log("Solicitud de impresión y apertura para:", printerName);

        // 1. Abrir Cajón
        if (printerName) {
            const openCommand = `powershell -Command "[char]27 + [char]112 + [char]0 + [char]25 + [char]250 | Out-Printer -Name '${printerName}'"`;
            exec(openCommand, (error) => {
                if (error) console.error("Error al abrir cajón en print-and-open:", error);
            });
        }

        // 2. Imprimir (Reutilizando lógica)
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

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    printWindow.webContents.print({
                        silent: true,
                        deviceName: printerName,
                        printBackground: true,
                        margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 },
                        pageSize: { width: 80000, height: 200000 }
                    }, (success, errorType) => {
                        if (!success) reject(errorType);
                        else resolve(true);
                        printWindow.close();
                    });
                }, 500);
            });
        } catch (e) {
            console.error("ERROR EN PRINT-AND-OPEN:", e);
            throw e;
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

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log("5. Ejecutando print()...");
                    printWindow.webContents.print({
                        silent: true,
                        deviceName: printerName,
                        printBackground: true,
                        margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 },
                        pageSize: { width: 80000, height: 200000 }
                    }, (success, errorType) => {
                        console.log("6. Callback de print. Success:", success, "Error:", errorType);
                        if (!success) {
                            reject(errorType);
                        } else {
                            resolve(true);
                        }
                        printWindow.close();
                    });
                }, 500);
            });

        } catch (e) {
            console.error("ERROR CRÍTICO EN IMPRESIÓN:", e);
            throw e;
        }
    });
}

export { utilsController };
