"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useListaProductos } from "@/contexts/listaProductos"

import { useEffect } from "react"
import type { ProductoVenta } from "@/types/Producto"
import { useCurrentUser } from "@/contexts/currentUser"
/**
 * Esquema de validación para el producto temporal
 * Se requieren campos básicos como nombre y precio.
 */
const tempProductSchema = z.object({
    nombre_producto: z.string().min(1, "El nombre es requerido"),
    descripcion: z.string().optional(),
    precio_venta: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
    precio_mayoreo: z.coerce.number().min(0, "El precio no puede ser negativo").optional(),
    nombre_presentacion: z.string().default("Pieza"),
    cantidad: z.coerce.number().min(1, "Mínimo 1"),
})

type TempProductFormValues = z.infer<typeof tempProductSchema>

interface DialogNuevoProductoTempProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    inputRef?: React.RefObject<{ focus: () => void } | null>;
}

export default function DialogNuevoProductoTemp({ isOpen, setIsOpen, inputRef }: DialogNuevoProductoTempProps) {
    const { addProduct } = useListaProductos()
    const { user } = useCurrentUser();

    const form = useForm<TempProductFormValues>({
        resolver: zodResolver(tempProductSchema),
        defaultValues: {
            nombre_producto: "",
            descripcion: "",
            precio_venta: 0,
            precio_mayoreo: 0,
            nombre_presentacion: "Pieza",
            cantidad: 1,
        },
    })

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            form.reset({
                nombre_producto: "",
                descripcion: "",
                precio_venta: 0,
                precio_mayoreo: 0,
                nombre_presentacion: "Unidad",
                cantidad: 1,
            })
        }
    }, [isOpen, form])

    const onSubmit = (data: TempProductFormValues) => {
        const tempId = -Date.now();

        const newProduct: ProductoVenta = {
            id_producto: tempId,
            sku_pieza: `temp-${Math.abs(tempId)}`,
            nombre_producto: data.nombre_producto,
            descripcion: data.descripcion || "Producto Temporal",
            precio_costo: 0,
            es_producto_compuesto: 0,
            id_unidad_venta: tempId, // Crucial for cart logic (addProduct checks this)
            nombre_presentacion: data.nombre_presentacion,
            factor_conversion_cantidad: 1,
            sku_presentacion: `temp-vp-${Math.abs(tempId)}`,
            id_precio: 0,
            precio_venta: data.precio_venta,
            precio_mayoreo: data.precio_mayoreo || data.precio_venta,
            id_sucursal: user?.id_sucursal,
            stock_piezas: 9999,
            stock_disponible_presentacion: 9999,
            es_granel: false,
        }

        addProduct(newProduct, data.cantidad)

        setIsOpen(false)

        // Return focus to the search bar or main input if provided
        setTimeout(() => {
            inputRef?.current?.focus();
        }, 100);
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => {
            setIsOpen(false)
            setTimeout(() => {
                inputRef?.current?.focus();
            }, 100);
        }}>
            <DialogContent className="sm:max-w-[500px] border-l-4 border-l-blue-500">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        🛍️ Crear Producto Temporal
                    </DialogTitle>
                    <DialogDescription>
                        Agrega un producto rápido para venta inmediata. No se guardará permanentemente en el inventario.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <FormField
                            control={form.control}
                            name="nombre_producto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Nombre del Producto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Servicio Extra..." {...field} className="focus-visible:ring-blue-500" autoFocus />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="precio_venta"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-gray-700">Precio Venta</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                                                <Input type="number" step="0.50" placeholder="0.00" {...field} className="pl-7 focus-visible:ring-blue-500" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="precio_mayoreo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-gray-700">Precio Mayoreo (Opcional)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                                                <Input type="number" step="0.50" placeholder="0.00" {...field} className="pl-7 focus-visible:ring-blue-500" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nombre_presentacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-gray-700">Unidad / Presentación</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Pza, Kg, Servicio" {...field} className="focus-visible:ring-blue-500" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cantidad"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-gray-700">Cantidad</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="focus-visible:ring-blue-500 text-center font-bold" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Descripción (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles adicionales..."
                                            className="resize-none focus-visible:ring-blue-500"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0">

                            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold transition-all duration-200">
                                Agregar a Venta
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}