import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCliente } from "@/api/clientesApi/clientesApi";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, UserPlus, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";

const clientSchema = z.object({
    nombre_cliente: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

type props = {
    isOpen: boolean,
    onClose: (open: boolean) => void,
    onSuccess?: (id: number) => void
}

export default function DialogCreateCliente({ isOpen, onClose, onSuccess }: props) {
    const [loading, setLoading] = useState(false);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            nombre_cliente: "",
            direccion: "",
            telefono: "",
        },
    });

    const onSubmit = async (values: ClientFormValues) => {
        setLoading(true);
        try {
            const res = await createCliente({
                nombre_cliente: values.nombre_cliente,
                direccion: values.direccion || "",
                telefono: values.telefono || ""
            });

            if (res.success) {
                toast.success("Cliente creado correctamente");
                form.reset();
                onSuccess?.(res.data);
                onClose(false);
            } else {
                toast.error("Error al crear cliente", { description: res.message });
            }
        } catch (error) {
            console.error("Error creating client:", error);
            toast.error("Error de conexión al crear el cliente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 pb-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Nuevo Cliente</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">
                                Registra un nuevo cliente en el sistema.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 pt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="nombre_cliente"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                            Nombre Completo <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej. Juan Pérez"
                                                {...field}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        form.handleSubmit(onSubmit)();
                                                    }
                                                }}
                                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-medium text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 gap-6">
                                <FormField
                                    control={form.control}
                                    name="telefono"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-indigo-500" />
                                                Teléfono
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej. 1234567890"
                                                    {...field}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            form.handleSubmit(onSubmit)();
                                                        }
                                                    }}
                                                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs font-medium text-red-500" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="direccion"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-indigo-500" />
                                                Dirección
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Calle, Número, Colonia..."
                                                    {...field}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            form.handleSubmit(onSubmit)();
                                                        }
                                                    }}
                                                    className="h-12 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs font-medium text-red-500" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onClose(false)}
                                    className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-800 font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        "Guardar Cliente"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}