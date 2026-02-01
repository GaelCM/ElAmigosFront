import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron-api", {
    listPrints: () => ipcRenderer.invoke('list-prints'),
    printTicket: (data) => ipcRenderer.invoke('print-ticket', data),
    openCashDrawer: (printerName) => ipcRenderer.invoke('open-cash-drawer', printerName),
    printAndOpen: (data) => ipcRenderer.invoke('print-and-open', data),
    printTestEscPos: (printerName) => ipcRenderer.invoke('print-test-escpos', printerName),
    printTicketVentaEscPos: (data) => ipcRenderer.invoke('print-ticket-venta-escpos', data),
    printTicketMovimientoEscPos: (data) => ipcRenderer.invoke('print-ticket-movimiento-escpos', data),

    // Offline API
    sincronizarProductos: (productos) => ipcRenderer.invoke('sincronizar-productos', productos),
    buscarProductoLocal: (sku) => ipcRenderer.invoke('buscar-producto-local', sku),
    obtenerProductosLocal: () => ipcRenderer.invoke('obtener-productos-local'),
    guardarVentaOffline: (venta) => ipcRenderer.invoke('guardar-venta-offline', venta),
    obtenerVentasPendientes: () => ipcRenderer.invoke('obtener-ventas-pendientes'),
    eliminarVentaSincronizada: (id) => ipcRenderer.invoke('eliminar-venta-sincronizada', id),
})


