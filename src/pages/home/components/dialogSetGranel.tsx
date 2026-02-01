/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductoVenta } from "@/types/Producto";

interface DialogSetGranelProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    producto?: ProductoVenta | null;
    onConfirm: (cantidad: number) => void;
    inputRefMain: React.RefObject<HTMLInputElement | null>;
}

export default function DialogSetGranel({
    isOpen,
    setIsOpen,
    producto,
    onConfirm,
    inputRefMain,
}: DialogSetGranelProps) {
    const [cantidad, setCantidad] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            setCantidad("");
        }
    }, [isOpen]);

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        const cantidadFinal = parseFloat(cantidad);

        if (isNaN(cantidadFinal) || cantidadFinal <= 0) {
            return;
        }

        onConfirm(cantidadFinal);
        setIsOpen(false);

        // Regresar el foco al input principal después de cerrar
        setTimeout(() => {
            inputRefMain.current?.focus();
        }, 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setIsOpen(false);
            setTimeout(() => {
                inputRefMain.current?.focus();
            }, 100);
        }
    }

    // Cálculos rápidos de precio para mostrar al usuario
    const precioUnitario = producto?.precio_venta || 0;
    const totalEstimado = parseFloat(cantidad) > 0 ? (parseFloat(cantidad) * precioUnitario).toFixed(2) : "0.00";

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Venta a Granel</DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        Producto: <span className="font-medium text-foreground">{producto?.nombre_producto}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Precio x Kg: <span className="font-medium text-green-600">${precioUnitario.toFixed(2)}</span>
                    </div>
                </DialogHeader>

                <form onSubmit={handleConfirm} className="space-y-6 pt-4">

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="cantidad" className="text-lg">Peso / Cantidad (Kg)</Label>
                        <div className="relative">
                            <Input
                                id="cantidad"
                                type="number"
                                step="0.001"
                                autoFocus
                                className="h-14 text-2xl font-bold text-center"
                                placeholder="0.000"
                                value={cantidad}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setCantidad(e.target.value)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                Kg
                            </span>
                        </div>

                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center border">
                        <span className="font-medium">Total Estimado:</span>
                        <span className="text-2xl font-bold text-primary">${totalEstimado}</span>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => {
                            setIsOpen(false);
                            setTimeout(() => inputRefMain.current?.focus(), 100);
                        }}>
                            Cancelar (ESC)
                        </Button>
                        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!cantidad || parseFloat(cantidad) <= 0}>
                            Confirmar Agregar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
