
import type { TransferenciaItem, TransferenciaProducto } from "@/types/Transferencias";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";


type ListaTransProductosModel = {
    carrito: TransferenciaItem[]; // <--- El carrito ahora contiene CartItems
    addProduct: (product: TransferenciaProducto) => void; // Añade o incrementa cantidad
    removeProduct: (idUnidadVenta: number) => void; // Elimina completamente el producto basado en id_unidad_venta
    updateQuantity: (idUnidadVenta: number, newQuantity: number) => void; // Establece una cantidad específica
    decrementQuantity: (idUnidadVenta: number) => void; // Disminuye la cantidad en 1
    incrementQuantity: (idUnidadVenta: number) => void; // Aumenta la cantidad en 1
    clearCart: () => void; // Elimina todos los productos
    getTotalItems: () => number;
    getTotalPrice: () => number;
};

export const useTransferirProductos = create(
    persist<ListaTransProductosModel>(
        (set, get) => ({
            carrito: [],

            addProduct: (product: TransferenciaProducto) => {
                console.log("Agregando producto:", product.nombre_producto, product.id_unidad_venta);
                const currentCarrito = get().carrito;
                const existingItemIndex = currentCarrito.findIndex(
                    (item) => item.product.id_unidad_venta === product.id_unidad_venta
                );

                if (existingItemIndex > -1) {
                    const updatedCarrito = currentCarrito.map((item, index) =>
                        index === existingItemIndex
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                    set({ carrito: updatedCarrito });
                } else {
                    const newItem: TransferenciaItem = { product, quantity: 1 };
                    const updatedCarrito = [...currentCarrito, newItem];
                    set({ carrito: updatedCarrito });
                }
            },

            removeProduct: (idUnidadVenta: number) => {
                const currentCarrito = get().carrito;
                const updatedCarrito = currentCarrito.filter(
                    (item) => item.product.id_unidad_venta !== idUnidadVenta
                );
                set({ carrito: updatedCarrito });
            },

            updateQuantity: (idUnidadVenta: number, newQuantity: number) => {
                if (newQuantity < 1) {
                    get().removeProduct(idUnidadVenta);
                } else {
                    const currentCarrito = get().carrito;
                    const updatedCarrito = currentCarrito.map((item) =>
                        item.product.id_unidad_venta === idUnidadVenta
                            ? { ...item, quantity: newQuantity }
                            : item
                    );
                    set({ carrito: updatedCarrito });
                }
            },

            incrementQuantity: (idUnidadVenta: number) => {
                const currentCarrito = get().carrito;
                const updatedCarrito = currentCarrito.map((item) =>
                    item.product.id_unidad_venta === idUnidadVenta
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
                if (JSON.stringify(currentCarrito) !== JSON.stringify(updatedCarrito)) {
                    set({ carrito: updatedCarrito });
                }
            },

            decrementQuantity: (idUnidadVenta: number) => {
                const currentCarrito = get().carrito;
                const itemToDecrement = currentCarrito.find(
                    (item) => item.product.id_unidad_venta === idUnidadVenta
                );

                if (itemToDecrement) {
                    if (itemToDecrement.quantity > 1) {
                        get().updateQuantity(idUnidadVenta, itemToDecrement.quantity - 1);
                    } else {
                        get().removeProduct(idUnidadVenta);
                    }
                }
            },

            clearCart: () => {
                set({ carrito: [] });
            },

            getTotalItems: () => {
                const currentCarrito = get().carrito;
                return currentCarrito.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalPrice: () => {
                const currentCarrito = get().carrito;
                return currentCarrito.reduce((total, item) => total + (item.product.precio_venta * item.quantity), 0);
            }

        }),
        {
            name: "lista-transferencias",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
