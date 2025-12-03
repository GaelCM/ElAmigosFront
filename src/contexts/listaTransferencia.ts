
import type { TransferenciaItem, TransferenciaProducto } from "@/types/Transferencias";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";


type ListaTransProductosModel = {
    carrito: TransferenciaItem[]; // <--- El carrito ahora contiene CartItems
    addProduct: (product: TransferenciaProducto ) => void; // Añade o incrementa cantidad
    removeProduct: (idProducto: number) => void; // Elimina completamente el producto
    updateQuantity: (idProducto: number, newQuantity: number) => void; // Establece una cantidad específica
    decrementQuantity: (idProducto: number) => void; // Disminuye la cantidad en 1 (o elimina si llega a 0)
    incrementQuantity: (idProducto: number) => void; // Aumenta la cantidad en 1 (si ya existe)
    clearCart: () => void; // Elimina todos los productos
    // Opcional: Selector para obtener la cantidad total de ítems (suma de quantities)
    getTotalItems: () => number;
     // Opcional: Selector para obtener el precio total del carrito
    getTotalPrice: () => number;
};

export const useTransferirProductos = create(
    persist<ListaTransProductosModel>(
        (set, get) => ({
            // --- ESTADO INICIAL ---
            carrito: [], // Inicializamos la lista vacía de CartItems

            // --- ACCIONES ---

            /**
             * Añade un producto al carrito.
             * Si el producto ya existe, incrementa su cantidad en 1.
             * Si no existe, lo añade con cantidad 1.
             */
            addProduct: (product: TransferenciaProducto) => {
                console.log("Agregando producto:", product.nombre_producto);
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
                    const newItem: TransferenciaItem = { product, quantity: 1 };
                    const updatedCarrito = [...currentCarrito, newItem];
                    console.log("Nuevo producto agregado. Nuevo carrito:", updatedCarrito);
                    set({ carrito: updatedCarrito });
                }
            },

            /**
             * Elimina un producto completamente del carrito, sin importar su cantidad.
             */
            removeProduct: (idProducto: number) => {
                console.log("Eliminando producto con ID:", idProducto);
                const currentCarrito = get().carrito;
                const updatedCarrito = currentCarrito.filter(
                    (item) => item.product.id_producto !== idProducto
                );
                console.log("Producto eliminado. Nuevo carrito:", updatedCarrito);
                set({ carrito: updatedCarrito });
            },

            /**
             * Actualiza la cantidad de un producto específico.
             * Si la nueva cantidad es 0 o menor, elimina el producto.
             */
            updateQuantity: (idProducto: number, newQuantity: number) => {
                if (newQuantity < 1) {
                    // Si la cantidad es 0 o negativa, eliminar el producto
                    get().removeProduct(idProducto);
                } else {
                    // Actualizar la cantidad del producto
                    const currentCarrito = get().carrito;
                    const updatedCarrito = currentCarrito.map((item) =>
                        item.product.id_producto === idProducto
                            ? { ...item, quantity: newQuantity }
                            : item
                    );
                    // Filtrar por si acaso el item no existía (aunque map no lo añadiría)
                    const finalCarrito = updatedCarrito.filter(item => item.product.id_producto === idProducto ? item.quantity >= 1 : true);
                    set({ carrito: finalCarrito });
                }
            },

             /**
             * Incrementa la cantidad de un producto existente en 1.
             * No hace nada si el producto no está en el carrito.
             */
            incrementQuantity: (idProducto: number) => {
                console.log("Incrementando cantidad para producto:", idProducto);
                const currentCarrito = get().carrito;
                const updatedCarrito = currentCarrito.map((item) =>
                    item.product.id_producto === idProducto
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
             * Disminuye la cantidad de un producto en 1.
             * Si la cantidad llega a 0, elimina el producto del carrito.
             */
            decrementQuantity: (idProducto: number) => {
                console.log("Decrementando cantidad para producto:", idProducto);
                const currentCarrito = get().carrito;
                const itemToDecrement = currentCarrito.find(
                    (item) => item.product.id_producto === idProducto
                );

                if (itemToDecrement) {
                    if (itemToDecrement.quantity > 1) {
                        // Disminuir cantidad
                        get().updateQuantity(idProducto, itemToDecrement.quantity - 1);
                    } else {
                        // Eliminar producto si la cantidad es 1
                        get().removeProduct(idProducto);
                    }
                }
                // No hacer nada si el producto no se encuentra
            },

            /**
             * Elimina todos los productos del carrito.
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
             * Calcula el precio total de todos los productos en el carrito.
             */
            getTotalPrice: () => {
                 const currentCarrito = get().carrito;
                 const total = currentCarrito.reduce((total, item) => total + (item.product.precio_venta * item.quantity), 0);
                 //console.log("Calculando total del carrito:", total, "Productos:", currentCarrito.length);
                 return total;
            }

        }),
        {
            name: "lista-transferencias", // Cambiado nombre para evitar conflictos si la versión vieja aún existe
            storage: createJSONStorage(() => localStorage),
        }
    )
);
