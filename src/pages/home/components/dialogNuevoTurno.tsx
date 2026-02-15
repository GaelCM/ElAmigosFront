import { nuevoCorteApi } from "@/api/cortesApi/cortesApi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useCurrentUser } from "@/contexts/currentUser"
import { useOnlineStatus } from "@/hooks/isOnline"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const formSchema = z.object({
    efectivo_inicial: z.number(),
    observaciones_apertura: z.string().min(1, {
        message: "Debe ingresar una observación.",
    }),
})

type DialogNuevoTurnoProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCajaOpened: () => void;
}

export default function DialogNuevoTurno({ isOpen, onOpenChange, onCajaOpened }: DialogNuevoTurnoProps) {

    const [loading, setLoading] = useState(false)
    const isOnline = useOnlineStatus()
    const { user } = useCurrentUser();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            efectivo_inicial: 0,
            observaciones_apertura: "",
        },
    })

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!isOnline) {
            toast("No tienes conexión a internet.", {
                description: "Por favor, conectate a internet para abrir un nuevo turno.",
            })
            return
        }
        setLoading(true)
        try {
            const res = await nuevoCorteApi({
                id_usuario: user.id_usuario,
                id_sucursal: user.id_sucursal,
                efectivo_inicial: data.efectivo_inicial,
                observaciones_apertura: data.observaciones_apertura,
            })
            if (res.success) {
                console.log(res.data)
                localStorage.setItem("openCaja", JSON.stringify(res.data))
                toast.success("Turno abierto exitosamente.", {
                    description: "El turno se abrió correctamente.",
                })
                onOpenChange(false)
                onCajaOpened()

                // Abrir cajón de dinero al iniciar turno nuevo
                const printerName = localStorage.getItem("printer_device");
                if (printerName) {
                    // @ts-ignore
                    window["electron-api"]?.openCashDrawer(printerName);
                }
            } else {
                toast("Error al abrir el turno.", {
                    description: res.message,
                })
            }
        } catch (error) {
            toast("Error al abrir el turno.", {
                description: "Por favor, intenta de nuevo.",
            })
        } finally {
            setLoading(false)
        }
    }


    return (
        <div>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent>
                    {loading && (
                        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Cargando sucursales...</p>
                            </div>
                        </div>
                    )}
                    <DialogHeader>
                        <DialogTitle>Abrir Turno</DialogTitle>
                        <DialogDescription>
                            Ingrese los datos para abrir un nuevo turno.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="efectivo_inicial"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Efectivo Inicial</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="observaciones_apertura"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Observaciones de Apertura</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit">Abrir Turno</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}