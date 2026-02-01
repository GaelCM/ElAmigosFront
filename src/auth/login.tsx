
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import "../App.css";
import { iniciarSesionApi } from "@/api/authApi/authApi";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";
import logo from "../assets/logo.jpg"


import { toast } from "sonner";

const formSchema = z.object({
  usuario: z.string().min(2, {
    message: "El usuario debe tener al menos 2 caracteres.",
  }),
  password: z.string().min(3, {
    message: "La contraseña debe tener al menos 3 caracteres.",
  }),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { addUser } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usuario: "",
      password: "",
    },
  });

  async function login(values: z.infer<typeof formSchema>) {
    const res = await iniciarSesionApi(values.usuario, values.password);
    if (res.success) {
      localStorage.setItem('tkn', res.token);
      addUser(res.data)
      navigate(res.ruta);
      toast.success('Sesion iniciada correctamente');
    } else {
      toast.error('Error al iniciar sesion: ' + res.message);
      navigate(res.ruta);
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-lg p-8 shadow-2xl">
        <CardHeader className="mb-6 text-center">
          <div className="flex justify-center">
            <img src={logo} className="w-54 h-44 mb-2"></img>
          </div>
          <CardDescription className="text-base text-muted-foreground">por G-Labs</CardDescription>
          <CardTitle className="text-3xl font-bold text-primary mb-1">Iniciar Sesión</CardTitle>

        </CardHeader>
        <form onSubmit={handleSubmit(login)} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Usuario</label>
            <Input
              type="text"
              placeholder="Ingresa tu usuario"
              {...register("usuario")}
              aria-invalid={!!errors.usuario}
            />
            {errors.usuario && (
              <span className="text-xs text-red-500 mt-1 block">{errors.usuario.message}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Contraseña</label>
            <Input
              type="password"
              placeholder="Ingresa tu contraseña"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
            )}
          </div>
          <Button type="submit" className="mt-2 w-full text-lg font-semibold" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">version 2.7.0</p>
      </Card>
    </div>
  );
}