import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Edit, Trash2, User } from "lucide-react";
import type { Proveedor } from "@/types/Proveedor";

interface ProveedorCardProps {
    proveedor: Proveedor;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

export function ProveedorCard({ proveedor, onEdit, onDelete }: ProveedorCardProps) {
    return (
        <Card className="w-full hover:shadow-md transition-all duration-300 border border-l-8 border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold text-foreground truncate flex items-center gap-2" title={proveedor.nombre_proveedor}>
                        <User className="w-5 h-5 text-primary" />
                        {proveedor.nombre_proveedor}
                    </CardTitle>
                    <Badge variant={proveedor.isactive === 1 ? "default" : "secondary"} className="shrink-0">
                        {proveedor.isactive === 1 ? "Activo" : "Inactivo"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{proveedor.telefono}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2 pb-4 px-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(proveedor.id_proveedor)}
                    className="h-8 px-2 text-muted-foreground hover:text-primary"
                >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(proveedor.id_proveedor)}
                    className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Eliminar
                </Button>
            </CardFooter>
        </Card>
    );
}
