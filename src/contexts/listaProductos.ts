




import type { ProductoItem, ProductoVenta } from "@/types/Producto";
import {create} from "zustand"
import {createJSONStorage, persist} from "zustand/middleware"

type ListaProductosModel = {
    carrito: ProductoItem[]; // <--- El carrito ahora contiene CartItems
    addProduct: (product: ProductoVenta) => void; // Añade o incrementa cantidad
    removeProduct: (id_producto: number) => void; // Elimina completamente el Producto
    updateQuantity: (id_producto: number, newQuantity: number) => void; // Establece una cantidad específica
    decrementQuantity: (id_producto: number) => void; // Disminuye la cantidad en 1 (o elimina si llega a 0)
    incrementQuantity: (id_producto: number) => void; // Aumenta la cantidad en 1 (si ya existe)
    clearCart: () => void; // Elimina todos los Productos
    // Opcional: Selector para obtener la cantidad total de ítems (suma de quantities)
    getTotalItems: () => number;
     // Opcional: Selector para obtener el precio total del carrito
    getTotalPrice: () => number;
};

export const useListaProductos = create(
    persist<ListaProductosModel>(
        (set, get) => ({
            // --- ESTADO INICIAL ---
            carrito: [], // Inicializamos la lista vacía de CartItems

            // --- ACCIONES ---

            /**
             * Añade un Producto al carrito.
             * Si el Producto ya existe, incrementa su cantidad en 1.
             * Si no existe, lo añade con cantidad 1.
             */
            addProduct: (product: ProductoVenta) => {
                console.log("Agregando Producto:", product.nombre_producto);
                const currentCarrito = get().carrito;
                const existingItemIndex = currentCarrito.findIndex(
                    (item) => item.product.id_producto === product.id_producto
                );

                if (existingItemIndex > -1) {
                    // Producto ya existe: Incrementar cantidad
                    const updatedCarrito = currentCarrito.map((item, index) =>
                        index === existingItemIndex
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                    console.log("Producto existente, incrementando cantidad. Nuevo carrito:", updatedCarrito);
                    set({ carrito: updatedCarrito });
                } else {
                    // Producto no existe: Añadir nuevo item con cantidad 1
                    const newItem: ProductoItem = { product, quantity: 1 };
                    const updatedCarrito = [...currentCarrito, newItem];
                    console.log("Nuevo Producto agregado. Nuevo carrito:", updatedCarrito);
                    set({ carrito: updatedCarrito });
                }
            },

            /**
             * Elimina un Producto completamente del carrito, sin importar su cantidad.
             */
            removeProduct: (id_producto: number) => {
                console.log("Eliminando Producto con ID:", id_producto);
                const currentCarrito = get().carrito;
                const updatedCarrito = currentCarrito.filter(
                    (item) => item.product.id_producto !== id_producto
                );
                console.log("Producto eliminado. Nuevo carrito:", updatedCarrito);
                set({ carrito: updatedCarrito });
            },

            /**
             * Actualiza la cantidad de un Producto específico.
             * Si la nueva cantidad es 0 o menor, elimina el Producto.
             */
            updateQuantity: (id_producto: number, newQuantity: number) => {
                if (newQuantity < 1) {
                    // Si la cantidad es 0 o negativa, eliminar el Producto
                    get().removeProduct(id_producto);
                } else {
                    // Actualizar la cantidad del Producto
                    const currentCarrito = get().carrito;
                    const updatedCarrito = currentCarrito.map((item) =>
                        item.product.id_producto === id_producto
                            ? { ...item, quantity: newQuantity }
                            : item
                    );
                    // Filtrar por si acaso el item no existía (aunque map no lo añadiría)
                    const finalCarrito = updatedCarrito.filter(item => item.product.id_producto === id_producto ? item.quantity >= 1 : true);
                    set({ carrito: finalCarrito });
                }
            },

             /**
             * Incrementa la cantidad de un Producto existente en 1.
             * No hace nada si el Producto no está en el carrito.
             */
            incrementQuantity: (id_producto: number) => {
                console.log("Incrementando cantidad para Producto:", id_producto);
                const currentCarrito = get().carrito;
                const updatedCarrito = currentCarrito.map((item) =>
                    item.product.id_producto === id_producto
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
                 // Solo actualiza si realmente encontró y modificó el item
                 if (JSON.stringify(currentCarrito) !== JSON.stringify(updatedCarrito)) {
                    console.log("Cantidad incrementada. Nuevo carrito:", updatedCarrito);
                    set({ carrito: updatedCarrito });
                 }
            },

            /**
             * Disminuye la cantidad de un Producto en 1.
             * Si la cantidad llega a 0, elimina el Producto del carrito.
             */
            decrementQuantity: (id_producto: number) => {
                console.log("Decrementando cantidad para Producto:", id_producto);
                const currentCarrito = get().carrito;
                const itemToDecrement = currentCarrito.find(
                    (item) => item.product.id_producto === id_producto
                );

                if (itemToDecrement) {
                    if (itemToDecrement.quantity > 1) {
                        // Disminuir cantidad
                        get().updateQuantity(id_producto, itemToDecrement.quantity - 1);
                    } else {
                        // Eliminar Producto si la cantidad es 1
                        get().removeProduct(id_producto);
                    }
                }
                // No hacer nada si el Producto no se encuentra
            },

            /**
             * Elimina todos los Productos del carrito.
             */
            clearCart: () => {
                console.log("Limpiando carrito");
                set({ carrito: [] });
            },

            // --- SELECTORES (Opcionales pero útiles) ---

            /**
             * Calcula el número total de ítems individuales en el carrito.
             */
            getTotalItems: () => {
                const currentCarrito = get().carrito;
                return currentCarrito.reduce((total, item) => total + item.quantity, 0);
            },

             /**
             * Calcula el precio total de todos los Productos en el carrito.
             */
            getTotalPrice: () => {
                 const currentCarrito = get().carrito;
                 const total = currentCarrito.reduce((total, item) => total + (item.product.precio_venta * item.quantity), 0);
                 //console.log("Calculando total del carrito:", total, "Productos:", currentCarrito.length);
                 return total;
            },

        }),
        {
            name: "lista-Productos", // nombre para guardar la lista en el storage
            storage: createJSONStorage(() => localStorage),
        }
    )
);
