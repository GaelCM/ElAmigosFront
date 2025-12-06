import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Edit, Trash2, Box, Layers } from "lucide-react";
import type { Sucursal } from "@/types/Sucursal";

interface SucursalCardProps {
    sucursal: Sucursal;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

export function SucursalCard({ sucursal, onEdit, onDelete }: SucursalCardProps) {
    return (
        <Card className="w-full hover:shadow-md transition-all duration-300 border border-l-8  border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold text-foreground truncate" title={sucursal.nombre}>
                        {sucursal.nombre}
                    </CardTitle>
                    <Badge variant={sucursal.stock_total_piezas > 0 ? "default" : "destructive"} className="shrink-0">
                        {sucursal.stock_total_piezas > 0 ? "Activa" : "Sin Stock"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="line-clamp-2 leading-tight">{sucursal.direccion}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{sucursal.telefono}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2" title="Total Productos">
                        <Box className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{sucursal.total_productos} <span className="text-xs text-muted-foreground font-normal">Productos</span></span>
                    </div>
                    <div className="h-4 w-px bg-border/60"></div>
                    <div className="flex items-center gap-2" title="Total Presentaciones">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{sucursal.total_presentaciones} <span className="text-xs text-muted-foreground font-normal">Presentaciones</span></span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2 pb-4 px-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(sucursal.id_sucursal)}
                    className="h-8 px-2 text-muted-foreground hover:text-primary"
                >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(sucursal.id_sucursal)}
                    className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Eliminar
                </Button>
            </CardFooter>
        </Card>
    );
}
