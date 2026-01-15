import { crearUsuarioApi } from "@/api/usuariosAPi/usuariosApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import type { Sucursal } from "@/types/Sucursal";

const formSchema = z.object({
    nombre: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    usuario: z.string().min(2, {
        message: "El usuario debe tener al menos 2 caracteres.",
    }),
    email: z.string().email({
        message: "Debe ser un correo válido.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }),
    id_rol: z.string().min(1, {
        message: "Selecciona un rol.",
    }),
    id_sucursal: z.string().min(1, {
        message: "Selecciona una sucursal.",
    }),
});

export default function NuevoUsuarioForm() {
    const [loading, setLoading] = useState(false);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const navigate = useNavigate();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            usuario: "",
            email: "",
            password: "",
            id_rol: "",
            id_sucursal: "",
        },
    });

    useEffect(() => {
        const fetchSucursales = async () => {
            const res = await obtenerSucursalesApi();
            if (res.success) {
                setSucursales(res.data);
            }
        };
        fetchSucursales();
    }, []);

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setLoading(true);
        const res = await crearUsuarioApi({
            ...data,
            id_rol: parseInt(data.id_rol),
            id_sucursal: parseInt(data.id_sucursal),
        });

        if (res.success) {
            toast.success(res.message);
            form.reset();
            setLoading(false);
            navigate("/usuarios");
        } else {
            toast.error(res.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center p-10 bg-muted/20">
            <Card className="w-full max-w-2xl shadow-lg border-t-4 border-t-primary">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Nuevo Usuario</CardTitle>
                    <CardDescription>
                        Ingresa los datos para registrar un nuevo usuario en el sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="Ej. Juan Pérez" className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="usuario"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre de Usuario</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="Ej. jperez" className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo Electrónico</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Ej. juan@ejemplo.com" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="password" placeholder="******" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="id_rol"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rol</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un rol" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="1">Administrador</SelectItem>
                                                    <SelectItem value="2">Empleado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="id_sucursal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sucursal</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona una sucursal" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {sucursales.map((sucursal) => (
                                                        <SelectItem key={sucursal.id_sucursal} value={sucursal.id_sucursal.toString()}>
                                                            {sucursal.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex flex-col gap-2 pt-4">
                                <Button type="button" variant="outline" className="w-full" asChild>
                                    <Link to="/usuarios">
                                        Cancelar
                                    </Link>
                                </Button>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Registrando..." : "Registrar Usuario"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
