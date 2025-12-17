import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron-api", {
    listPrints: () => ipcRenderer.invoke('list-prints'),
    printTicket: (data) => ipcRenderer.invoke('print-ticket', data),
    openCashDrawer: (printerName) => ipcRenderer.invoke('open-cash-drawer', printerName),
    printAndOpen: (data) => ipcRenderer.invoke('print-and-open', data)
})


