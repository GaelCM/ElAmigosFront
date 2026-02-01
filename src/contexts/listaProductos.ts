




import type { ProductoItem, ProductoVenta } from "@/types/Producto";
import type { Cliente } from "@/types/Cliente";
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type Carrito = {
    id: string;
    nombre: string;
    productos: ProductoItem[];
    cliente?: Cliente;
    fechaCreacion: Date;
}

type ListaProductosModel = {
    // CARRITOS
    carritos: Carrito[];
    carritoActivo: string | null;

    // ACCIONES DE CARRITOS
    crearCarrito: (nombre?: string) => string; // Retorna el ID del nuevo carrito
    cambiarCarritoActivo: (id: string) => void;
    eliminarCarrito: (id: string) => void;
    renombrarCarrito: (id: string, nuevoNombre: string) => void;
    asignarClienteCarrito: (id: string, cliente: Cliente) => void;

    // ACCIONES DEL CARRITO ACTIVO
    addProduct: (product: ProductoVenta, quantity?: number) => void;
    removeProduct: (id_producto: number) => void;
    updateQuantity: (id_producto: number, newQuantity: number) => void;
    decrementQuantity: (id_producto: number) => void;
    incrementQuantity: (id_producto: number) => void;
    clearCart: () => void;
    togglePrecioMayoreo: (id_producto: number) => void;

    // SELECTORES
    getTotalItems: () => number;
    getTotalPrice: () => number;
    getCarritoActivo: () => Carrito | undefined;
    getCarritoById: (id: string) => Carrito | undefined;
};

export const useListaProductos = create(
    persist<ListaProductosModel>(
        (set, get) => ({
            // --- ESTADO INICIAL ---
            carritos: [],
            carritoActivo: null,

            // --- ACCIONES DE CARRITOS ---

            /**
             * Crea un nuevo carrito y lo asigna como activo
             */
            crearCarrito: (nombre?: string) => {
                const id = `carrito_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const nuevoCarrito: Carrito = {
                    id,
                    nombre: nombre || `Venta ${new Date().toLocaleTimeString()}`,
                    productos: [],
                    fechaCreacion: new Date(),
                };

                const currentCarritos = get().carritos;
                set({
                    carritos: [...currentCarritos, nuevoCarrito],
                    carritoActivo: id,
                });

                console.log("Nuevo carrito creado:", id);
                return id;
            },

            /**
             * Cambia el carrito activo
             */
            cambiarCarritoActivo: (id: string) => {
                const existe = get().carritos.find(c => c.id === id);
                if (existe) {
                    set({ carritoActivo: id });
                    console.log("Carrito activo cambiado a:", id);
                } else {
                    console.warn("Carrito no encontrado:", id);
                }
            },

            /**
             * Elimina un carrito (normalmente después de confirmar la venta)
             */
            eliminarCarrito: (id: string) => {
                const currentCarritos = get().carritos;
                const carritoActual = get().carritoActivo;

                const updatedCarritos = currentCarritos.filter(c => c.id !== id);
                let nuevoCarritoActivo = carritoActual;

                // Si eliminamos el carrito activo, cambiar a otro
                if (carritoActual === id) {
                    nuevoCarritoActivo = updatedCarritos.length > 0 ? updatedCarritos[0].id : null;
                }

                set({
                    carritos: updatedCarritos,
                    carritoActivo: nuevoCarritoActivo,
                });

                console.log("Carrito eliminado:", id);
            },

            /**
             * Renombra un carrito existente
             */
            renombrarCarrito: (id: string, nuevoNombre: string) => {
                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(c =>
                    c.id === id ? { ...c, nombre: nuevoNombre } : c
                );
                set({ carritos: updated });
                console.log("Carrito renombrado:", id, "->", nuevoNombre);
            },

            /**
             * Asigna un cliente a un carrito específico
             */
            asignarClienteCarrito: (id: string, cliente: Cliente) => {
                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(c =>
                    c.id === id ? { ...c, cliente } : c
                );
                set({ carritos: updated });
                console.log("Cliente asignado al carrito:", id);
            },

            // --- ACCIONES DEL CARRITO ACTIVO ---

            /**
             * Añade un Producto al carrito activo
             */
            addProduct: (product: ProductoVenta, quantity: number = 1) => {
                const carritoActivo = get().carritoActivo;
                if (!carritoActivo) {
                    console.warn("No hay carrito activo");
                    return;
                }

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === carritoActivo) {
                        const existingItemIndex = carrito.productos.findIndex(
                            (item) => item.product.id_unidad_venta === product.id_unidad_venta
                        );

                        if (existingItemIndex > -1) {
                            // Ya existe → solo incrementar cantidad
                            const updatedProductos = carrito.productos.map((item, index) =>
                                index === existingItemIndex
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            );
                            return { ...carrito, productos: updatedProductos };
                        } else {
                            // NUEVO PRODUCTO → añadir con usarPrecioMayoreo por defecto
                            return {
                                ...carrito,
                                productos: [
                                    ...carrito.productos,
                                    { product, quantity: quantity, usarPrecioMayoreo: false }
                                ],
                            };
                        }
                    }
                    return carrito;
                });
                set({ carritos: updated });
                //console.log("Producto agregado:", product.nombre_producto);
            },

            /**
             * Elimina un Producto del carrito activo
             */
            removeProduct: (id_producto: number) => {
                const carritoActivo = get().carritoActivo;
                if (!carritoActivo) return;

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === carritoActivo) {
                        return {
                            ...carrito,
                            productos: carrito.productos.filter(
                                (item) => item.product.id_unidad_venta !== id_producto
                            ),
                        };
                    }
                    return carrito;
                });

                set({ carritos: updated });
                //console.log("Producto eliminado del carrito:", id_producto);
            },

            /**
             * Actualiza la cantidad de un Producto en el carrito activo
             */
            updateQuantity: (id_producto: number, newQuantity: number) => {
                const carritoActivo = get().carritoActivo;
                if (!carritoActivo) return;

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === carritoActivo) {
                        if (newQuantity < 1) {
                            // Eliminar si la cantidad es 0 o menor
                            return {
                                ...carrito,
                                productos: carrito.productos.filter(
                                    (item) => item.product.id_unidad_venta !== id_producto
                                ),
                            };
                        } else {
                            // Actualizar la cantidad
                            return {
                                ...carrito,
                                productos: carrito.productos.map((item) =>
                                    item.product.id_unidad_venta === id_producto
                                        ? { ...item, quantity: newQuantity }
                                        : item
                                ),
                            };
                        }
                    }
                    return carrito;
                });

                set({ carritos: updated });
            },

            /**
             * Incrementa la cantidad de un Producto en el carrito activo
             */
            incrementQuantity: (id_producto: number) => {
                const carritoActivo = get().carritoActivo;
                if (!carritoActivo) return;

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === carritoActivo) {
                        return {
                            ...carrito,
                            productos: carrito.productos.map((item) =>
                                item.product.id_unidad_venta === id_producto
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                        };
                    }
                    return carrito;
                });

                set({ carritos: updated });
            },

            /**
             * Disminuye la cantidad de un Producto en el carrito activo
             */
            decrementQuantity: (id_producto: number) => {
                const carritoActivo = get().carritoActivo;
                if (!carritoActivo) return;

                const currentCarritos = get().carritos;
                const carrito = currentCarritos.find(c => c.id === carritoActivo);
                if (!carrito) return;

                const itemToDecrement = carrito.productos.find(
                    (item) => item.product.id_unidad_venta === id_producto
                );

                if (itemToDecrement) {
                    if (itemToDecrement.quantity > 1) {
                        get().updateQuantity(id_producto, itemToDecrement.quantity - 1);
                    } else {
                        get().removeProduct(id_producto);
                    }
                }
            },

            /**
             * Limpia todos los Productos del carrito activo
             */
            clearCart: () => {
                const carritoActivo = get().carritoActivo;
                if (!carritoActivo) return;

                const currentCarritos = get().carritos;
                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === carritoActivo) {
                        return { ...carrito, productos: [] };
                    }
                    return carrito;
                });

                set({ carritos: updated });
                console.log("Carrito limpiado");
            },

            // --- SELECTORES ---

            /**
             * Obtiene el carrito activo
             */
            getCarritoActivo: () => {
                const carritoActivo = get().carritoActivo;
                if (!carritoActivo) return undefined;
                return get().carritos.find(c => c.id === carritoActivo);
            },

            /**
             * Obtiene un carrito por ID
             */
            getCarritoById: (id: string) => {
                return get().carritos.find(c => c.id === id);
            },

            /**
             * Obtiene el total de items del carrito activo
             */
            getTotalItems: () => {
                const carritoActivo = get().getCarritoActivo();
                if (!carritoActivo) return 0;
                return carritoActivo.productos.reduce((total, item) => total + item.quantity, 0);
            },

            /**
             * Obtiene el precio total del carrito activo
             */
            getTotalPrice: () => {
                const carritoActivo = get().getCarritoActivo();
                if (!carritoActivo) return 0;
                return carritoActivo.productos.reduce(
                    (total, item) => {
                        const precio = item.usarPrecioMayoreo ? item.product.precio_mayoreo : item.product.precio_venta;
                        return total + (precio * item.quantity);
                    },
                    0
                );
            },

            /**
             * Alterna entre precio mayoreo y precio venta para un producto
             */
            togglePrecioMayoreo: (id_producto: number) => {
                const carritoActivo = get().carritoActivo;
                if (!carritoActivo) return;

                const currentCarritos = get().carritos;

                const updated = currentCarritos.map(carrito => {
                    if (carrito.id === carritoActivo) {
                        const nuevosProductos = carrito.productos.map(item =>
                            item.product.id_unidad_venta === id_producto
                                ? {
                                    ...item,
                                    usarPrecioMayoreo: !item.usarPrecioMayoreo
                                }
                                : item
                        );

                        return { ...carrito, productos: nuevosProductos };
                    }
                    return carrito;
                });

                set({ carritos: updated });
            },
        }),
        {
            name: "lista-Productos-v2",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
