import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, User as UserIcon, Edit, Store } from "lucide-react";
import type { Usuario } from "@/types/Usuarios";

interface UsuarioCardProps {
    usuario: Usuario;
    onEdit: (id: number) => void;
}

export function UsuarioCard({ usuario, onEdit }: UsuarioCardProps) {
    return (
        <Card className="w-full hover:shadow-md transition-all duration-300 border border-l-8 border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold text-foreground truncate" title={usuario.nombre}>
                        {usuario.nombre}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0">
                        {usuario.id_rol === 1 ? "Admin" : "Empleado"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2.5">
                        <UserIcon className="w-4 h-4 shrink-0" />
                        <span className="font-medium text-foreground">{usuario.usuario}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="break-all">{usuario.email}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2" title="Sucursal">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{usuario.nombre_sucursal || "Sin Sucursal"}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2 pb-4 px-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(usuario.id_usuario!)}
                    className="h-8 px-2 text-muted-foreground hover:text-primary"
                >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                </Button>

            </CardFooter>
        </Card>
    );
}
