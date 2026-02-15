
import type { ProductoItem, ProductoVenta } from "@/types/Producto";
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type CarritoCompra = {
    id: string;
    nombre: string;
    productos: ProductoItem[];
    fechaCreacion: Date;
    id_proveedor?: number;
}

type ListaComprasModel = {
    // CARRITOS
    carritos: CarritoCompra[];
    carritoActivo: string | null;

    // ACCIONES DE CARRITOS
    crearCarrito: (nombre?: string) => string;
    cambiarCarritoActivo: (id: string) => void;
    eliminarCarrito: (id: string) => void;

    // ACCIONES DEL CARRITO ACTIVO
    addProduct: (product: ProductoVenta, quantity?: number) => void;
    removeProduct: (id_unidad_venta: number) => void;
    updateQuantity: (id_unidad_venta: number, newQuantity: number) => void;
    updatePrice: (id_unidad_venta: number, newPrice: number) => void;
    decrementQuantity: (id_unidad_venta: number) => void;
    incrementQuantity: (id_unidad_venta: number) => void;
    clearCart: () => void;

    // SELECTORES
    getTotalItems: () => number;
    getTotalCost: () => number;
    getCarritoActivo: () => CarritoCompra | undefined;
};

export const useListaCompras = create(
    persist<ListaComprasModel>(
        (set, get) => ({
            carritos: [],
            carritoActivo: null,

            crearCarrito: (nombre?: string) => {
                const id = `compra_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const nuevoCarrito: CarritoCompra = {
                    id,
                    nombre: nombre || `Compra ${new Date().toLocaleTimeString()}`,
                    productos: [],
                    fechaCreacion: new Date(),
                };

                const currentCarritos = get().carritos;
                set({
                    carritos: [...currentCarritos, nuevoCarrito],
                    carritoActivo: id,
                });

                return id;
            },

            cambiarCarritoActivo: (id: string) => {
                const existe = get().carritos.find(c => c.id === id);
                if (existe) {
                    set({ carritoActivo: id });
                }
            },

            eliminarCarrito: (id: string) => {
                const currentCarritos = get().carritos;
                const carritoActual = get().carritoActivo;

                const updatedCarritos = currentCarritos.filter(c => c.id !== id);
                let nuevoCarritoActivo = carritoActual;

                if (carritoActual === id) {
                    nuevoCarritoActivo = updatedCarritos.length > 0 ? updatedCarritos[0].id : null;
                }

                set({
                    carritos: updatedCarritos,
                    carritoActivo: nuevoCarritoActivo,
                });
            },

            addProduct: (product: ProductoVenta, quantity: number = 1) => {
                const carritoActivo = get().carritoActivo;
                if (!carritoActivo) {
                    get().crearCarrito();
                    // Volver a llamar después de crear
                    // get().addProduct(product, quantity); // Cuidado con recursión infinita
                }

                const activeId = get().carritoActivo;
                const currentCarritos = get().carritos;

                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === activeId) {
                        const existingItemIndex = carrito.productos.findIndex(
                            (item) => item.product.id_unidad_venta === product.id_unidad_venta
                        );

                        if (existingItemIndex > -1) {
                            const updatedProductos = carrito.productos.map((item, index) =>
                                index === existingItemIndex
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            );
                            return { ...carrito, productos: updatedProductos };
                        } else {
                            // Calcular el precio de compra según la presentación
                            const precioPorPresentacion = product.precio_costo * (product.factor_conversion_cantidad || 1);

                            return {
                                ...carrito,
                                productos: [
                                    ...carrito.productos,
                                    {
                                        product,
                                        quantity: quantity,
                                        usarPrecioMayoreo: false,
                                        precio_compra: precioPorPresentacion
                                    }
                                ],
                            };
                        }
                    }
                    return carrito;
                });
                set({ carritos: updated });
            },

            removeProduct: (id_unidad_venta: number) => {
                const activeId = get().carritoActivo;
                if (!activeId) return;

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === activeId) {
                        return {
                            ...carrito,
                            productos: carrito.productos.filter(
                                (item) => item.product.id_unidad_venta !== id_unidad_venta
                            ),
                        };
                    }
                    return carrito;
                });

                set({ carritos: updated });
            },

            updateQuantity: (id_unidad_venta: number, newQuantity: number) => {
                const activeId = get().carritoActivo;
                if (!activeId) return;

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === activeId) {
                        return {
                            ...carrito,
                            productos: carrito.productos.map((item) =>
                                item.product.id_unidad_venta === id_unidad_venta
                                    ? { ...item, quantity: newQuantity }
                                    : item
                            ),
                        };
                    }
                    return carrito;
                });

                set({ carritos: updated });
            },

            updatePrice: (id_unidad_venta: number, newPrice: number) => {
                const activeId = get().carritoActivo;
                if (!activeId) return;

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === activeId) {
                        return {
                            ...carrito,
                            productos: carrito.productos.map((item) =>
                                item.product.id_unidad_venta === id_unidad_venta
                                    ? { ...item, precio_compra: newPrice }
                                    : item
                            ),
                        };
                    }
                    return carrito;
                });

                set({ carritos: updated });
            },

            incrementQuantity: (id_unidad_venta: number) => {
                const activeId = get().carritoActivo;
                if (!activeId) return;

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === activeId) {
                        return {
                            ...carrito,
                            productos: carrito.productos.map((item) =>
                                item.product.id_unidad_venta === id_unidad_venta
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                        };
                    }
                    return carrito;
                });

                set({ carritos: updated });
            },

            decrementQuantity: (id_unidad_venta: number) => {
                const activeId = get().carritoActivo;
                if (!activeId) return;

                const currentCarritos = get().carritos;
                const carrito = currentCarritos.find(c => c.id === activeId);
                if (!carrito) return;

                const itemToDecrement = carrito.productos.find(
                    (item) => item.product.id_unidad_venta === id_unidad_venta
                );

                if (itemToDecrement) {
                    get().updateQuantity(id_unidad_venta, itemToDecrement.quantity - 1);
                }
            },

            clearCart: () => {
                const activeId = get().carritoActivo;
                if (!activeId) return;

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === activeId) {
                        return { ...carrito, productos: [] };
                    }
                    return carrito;
                });

                set({ carritos: updated });
            },

            getCarritoActivo: () => {
                const activeId = get().carritoActivo;
                if (!activeId) return undefined;
                return get().carritos.find(c => c.id === activeId);
            },

            getTotalItems: () => {
                const activeCart = get().getCarritoActivo();
                if (!activeCart) return 0;
                return activeCart.productos.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalCost: () => {
                const activeCart = get().getCarritoActivo();
                if (!activeCart) return 0;
                return activeCart.productos.reduce((total, item) => {
                    const costo = item.precio_compra ?? item.product.precio_costo;
                    return total + (costo * item.quantity);
                }, 0);
            },
        }),
        {
            name: "lista-compras-v1",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
