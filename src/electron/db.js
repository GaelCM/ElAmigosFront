import { app } from "electron";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(app.getPath("userData"), "sistema-hermesPos.db");

const db = new Database(dbPath);

// Inicializar tablas
db.exec(`
    CREATE TABLE IF NOT EXISTS offline_productos (
        id_unidad_venta INTEGER PRIMARY KEY,
        id_producto INTEGER,
        sku_pieza TEXT,
        nombre_producto TEXT,
        descripcion TEXT,
        precio_costo REAL,
        es_producto_compuesto INTEGER,
        nombre_presentacion TEXT,
        factor_conversion_cantidad REAL,
        sku_presentacion TEXT,
        id_precio INTEGER,
        precio_venta REAL,
        precio_mayoreo REAL,
        id_sucursal INTEGER,
        stock_piezas REAL,
        stock_disponible_presentacion REAL
    );

    CREATE TABLE IF NOT EXISTS offline_ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data_venta TEXT,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log("Base de datos lista en: ", dbPath);

export default db;
