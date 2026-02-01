import { ipcMain } from "electron";
import db from "../db.js";

function offlineController() {
    // Sincronizar catálogo de productos completo
    ipcMain.handle('sincronizar-productos', (event, productos) => {
        try {
            const deleteStmt = db.prepare('DELETE FROM offline_productos');
            const insertStmt = db.prepare(`
                INSERT INTO offline_productos (
                    id_unidad_venta, id_producto, sku_pieza, nombre_producto, 
                    descripcion, precio_costo, es_producto_compuesto, 
                    nombre_presentacion, factor_conversion_cantidad, 
                    sku_presentacion, id_precio, precio_venta, 
                    precio_mayoreo, id_sucursal, stock_piezas, 
                    stock_disponible_presentacion, es_granel
                ) VALUES (
                    @id_unidad_venta, @id_producto, @sku_pieza, @nombre_producto, 
                    @descripcion, @precio_costo, @es_producto_compuesto, 
                    @nombre_presentacion, @factor_conversion_cantidad, 
                    @sku_presentacion, @id_precio, @precio_venta, 
                    @precio_mayoreo, @id_sucursal, @stock_piezas, 
                    @stock_disponible_presentacion, @es_granel
                )
            `);

            const sync = db.transaction((prods) => {
                deleteStmt.run();
                for (const p of prods) {
                    insertStmt.run({
                        ...p,
                        es_granel: p.es_granel ? 1 : 0
                    });
                }
            });

            sync(productos);
            return { success: true, count: productos.length };
        } catch (error) {
            console.error("Error al sincronizar productos:", error);
            return { success: false, error: error.message };
        }
    });

    // Buscar producto localmente (por código de barras)
    ipcMain.handle('buscar-producto-local', (event, sku) => {
        try {
            const stmt = db.prepare(`
                SELECT * FROM offline_productos 
                WHERE sku_presentacion = ? OR sku_pieza = ?
            `);
            const res = stmt.all(sku, sku);
            return { success: res.length > 0, data: res };
        } catch (error) {
            console.error("Error al buscar producto local:", error);
            return { success: false, error: error.message };
        }
    });

    // Obtener todos los productos locales
    ipcMain.handle('obtener-productos-local', (event) => {
        try {
            const stmt = db.prepare('SELECT * FROM offline_productos');
            const res = stmt.all();
            return { success: true, data: res };
        } catch (error) {
            console.error("Error al obtener productos locales:", error);
            return { success: false, error: error.message };
        }
    });

    // Guardar una venta en la cola offline
    ipcMain.handle('guardar-venta-offline', (event, ventaPayload) => {
        try {
            const stmt = db.prepare('INSERT INTO offline_ventas (data_venta) VALUES (?)');
            const info = stmt.run(JSON.stringify(ventaPayload));
            return { success: true, id: info.lastInsertRowid };
        } catch (error) {
            console.error("Error al guardar venta offline:", error);
            return { success: false, error: error.message };
        }
    });

    // Obtener ventas pendientes de sincronizar
    ipcMain.handle('obtener-ventas-pendientes', () => {
        try {
            const stmt = db.prepare('SELECT * FROM offline_ventas ORDER BY fecha ASC');
            const res = stmt.all();
            return res.map(v => ({
                id: v.id,
                fecha: v.fecha,
                venta: JSON.parse(v.data_venta)
            }));
        } catch (error) {
            console.error("Error al obtener ventas pendientes:", error);
            return [];
        }
    });

    // Eliminar venta una vez sincronizada con éxito
    ipcMain.handle('eliminar-venta-sincronizada', (event, id) => {
        try {
            const stmt = db.prepare('DELETE FROM offline_ventas WHERE id = ?');
            stmt.run(id);
            return { success: true };
        } catch (error) {
            console.error("Error al eliminar venta sincronizada:", error);
            return { success: false, error: error.message };
        }
    });
}

export { offlineController };