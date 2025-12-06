import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Tag } from "lucide-react";
import type { Categoria } from "@/types/Categoria";

interface CategoriaCardProps {
    categoria: Categoria;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

export function CategoriaCard({ categoria, onEdit, onDelete }: CategoriaCardProps) {
    return (
        <Card className="w-full hover:shadow-md transition-all duration-300 border border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full shrink-0">
                            <Tag className="w-4 h-4 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground truncate" title={categoria.category_name}>
                            {categoria.category_name}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${categoria.estatus === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-muted-foreground">
                        {categoria.estatus === 1 ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2 pb-4 px-4 border-t border-border/40">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(categoria.id_categoria)}
                    className="h-8 px-2 text-muted-foreground hover:text-primary"
                >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(categoria.id_categoria)}
                    className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Eliminar
                </Button>
            </CardFooter>
        </Card>
    );
}
