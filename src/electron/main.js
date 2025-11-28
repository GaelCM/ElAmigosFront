import { app, BrowserWindow } from "electron";
import path from 'path';


function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: path.join(app.getAppPath(), 'src/electron/logo.jpg'), // Ajusta la ruta si es necesario
        webPreferences: {
            // Si tienes un preload.js, descomenta la siguiente línea y crea el archivo
            //preload: path.join(app.getAppPath(), 'src/electron/preload.js'),
            nodeIntegration: true, // Puedes cambiar esto según tus necesidades de seguridad
            // contextIsolation: true, // Recomendado para seguridad, pero requiere preload.js
        },
    });

    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
        // En desarrollo, carga desde el servidor local de Vite/React
        mainWindow.loadURL('http://localhost:5173'); // Cambia el puerto si usas otro
    } else {
        // En producción, carga el archivo generado
        mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
    }
   
    //mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});