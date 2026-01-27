import { useEffect, useMemo, useState, useRef } from "react"
import { Card, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import type { ProductoVenta } from "@/types/Producto"
import { useListaProductos } from "@/contexts/listaProductos"
import { getProductos } from "@/api/productosApi/productosApi"
import { ShoppingCart, Search, SquarePen } from "lucide-react"
import { Input } from "./ui/input"
import { toast } from "sonner"
import { Link } from "react-router"
import { useCurrentUser } from "@/contexts/currentUser"




type Props = {
  idSucursal: number
  inputRef?: React.RefObject<{ focus: () => void } | null>;
}

export function ProductTable({ idSucursal, inputRef }: Props) {
  const [productos, setProductos] = useState<ProductoVenta[]>([])
  const { user } = useCurrentUser();
  const [filteredProductos, setFilteredProductos] = useState<ProductoVenta[]>([])
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const { addProduct } = useListaProductos();

  useEffect(() => {
    setLoading(true)
    getProductos(idSucursal).then(res => {
      if (res.success) {
        setProductos(res.data);
        setFilteredProductos(res.data)
      } else {
        setProductos([]);
        setFilteredProductos([]);
      }
    }
    ).finally(() => { setLoading(false) })
  }, [idSucursal])

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = productos.filter((item) => {
      return item.nombre_producto.toLowerCase().includes(lowercasedFilter) || item.sku_pieza.toLowerCase().includes(lowercasedFilter);
    });
    setFilteredProductos(filteredData);
    setCurrentPage(1);
    setSelectedIndex(0);
  }, [productos, searchTerm]);

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(50)


  const totalItems = filteredProductos.length || 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  useEffect(() => {
    // clamp page if productos or pageSize change
    if (currentPage > totalPages) setCurrentPage(totalPages)
    if (currentPage < 1) setCurrentPage(1)
    setSelectedIndex(0); // Reset selected index cuando cambias de página
  }, [currentPage, totalPages])

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProductos.slice(start, start + pageSize)
  }, [filteredProductos, currentPage, pageSize])

  // Manejo de teclado para navegación
  useEffect(() => {
    if (pageItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : pageItems.length - 1));
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < pageItems.length - 1 ? prev + 1 : 0));
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const selectedProduct = pageItems[selectedIndex];
          if (selectedProduct && selectedProduct.stock_disponible_presentacion > 0) {
            addProduct(selectedProduct);
            toast.success("Producto agregado correctamente");
            setTimeout(() => {
              inputRef?.current?.focus();
            }, 100);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageItems, selectedIndex, addProduct, inputRef]);

  // Scroll automático al elemento seleccionado
  useEffect(() => {
    if (tableRef.current && pageItems.length > 0) {
      const selectedRow = tableRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedRow) {
        // Usar setTimeout para asegurar que el DOM está actualizado
        setTimeout(() => {
          selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 0);
      }
    }
  }, [selectedIndex, pageItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="p-2 border-0 flex flex-col h-full">
      <CardHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos por nombre o sku..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            value={searchTerm}
            autoFocus
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <div className="flex-1 overflow-y-auto w-full" ref={tableRef}>
        <table className="w-full table-auto">
          <thead className="sticky top-0 bg-background">
            <tr className="text-left text-sm text-muted-foreground border-b">
              <th className="px-3 py-2">Sku Presentación</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Unidad</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2">Precio</th>
              <th className="px-3 py-2">Stock Disponible</th>
              <th className="px-3 py-2">Stock Piezas</th>
              <th className="px-3 py-2">Precio Mayoreo</th>
              <th className="px-3 py-2 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p, index) => {
              const lowStock = p.stock_disponible_presentacion > 0 && p.stock_disponible_presentacion < 5
              const outStock = p.stock_disponible_presentacion === 0
              const isSelected = index === selectedIndex;

              return (
                <tr
                  key={p.id_unidad_venta}
                  data-index={index}

                  className={`align-top border-t cursor-pointer transition-colors ${isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'hover:bg-muted/50'
                    } ${outStock ? 'opacity-50' : ''}`}
                >
                  <td className="px-3 py-3 align-middle text-sm text-muted-foreground">{p.sku_presentacion}</td>
                  <td className="px-3 py-3 align-middle">
                    <div className="font-medium text-sm">{p.nombre_producto + " " + p.nombre_presentacion + " " + (p.factor_conversion_cantidad > 1 ? p.factor_conversion_cantidad + " Pzas" : "")}</div>
                  </td>

                  <td className="px-3 py-3 align-middle text-sm ">
                    <Badge className={`${p.nombre_presentacion === "Pieza" ? 'bg-blue-600' : 'bg-orange-600'}`}>{p.nombre_presentacion}</Badge>
                  </td>

                  <td className="px-3 py-3 align-middle">
                    <div className="text-sm text-muted-foreground max-w-md truncate">{p.descripcion}</div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="text-sm font-semibold">${p.precio_venta.toFixed(2)}</div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.stock_disponible_presentacion}</span>
                      {outStock ? (
                        <Badge variant="destructive">Agotado</Badge>
                      ) : lowStock ? (
                        <Badge variant="secondary" className="bg-red-500 text-white">Bajo</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="text-sm font-semibold">{p.stock_piezas}</div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="text-sm font-semibold">${p.precio_mayoreo.toFixed(2)}</div>
                  </td>



                  <td className="px-3 py-3 align-middle flex justify-center ">
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        addProduct(p)
                        toast.success("Producto agregado correctamente")
                        setTimeout(() => {
                          inputRef?.current?.focus();
                        }, 100);
                      }}
                      disabled={outStock}
                      aria-label={`Agregar ${p.nombre_producto} al carrito`}
                    >
                      <ShoppingCart></ShoppingCart>
                    </Button>

                    {user.id_rol === 1 && p.es_producto_compuesto === 0 ? (
                      <Link to={`/productos/editProducto?id=${p.id_producto}`} >
                        <Button size="sm" variant={"default"} className="ml-2" aria-label={`Editar ${p.nombre_producto}`}>
                          <SquarePen></SquarePen>
                        </Button>
                      </Link>
                    ) : null}

                    {user.id_rol === 1 && p.es_producto_compuesto === 1 ? (
                      <Link to={`/productos/editProductoEspecial?id=${p.id_producto}&suc=${idSucursal}`} >
                        <Button size="sm" variant={"outline"} className="ml-2" aria-label={`Editar ${p.nombre_producto}`}>
                          <SquarePen></SquarePen>
                        </Button>
                      </Link>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {pageItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No hay productos</p>
            <p className="text-sm">Intenta con otra búsqueda</p>
          </div>
        )}
      </div>
      {/* Pagination controls */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> de <span className="font-medium">{totalItems}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Button size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Ant
            </Button>

            {/* simple page numbers window */}
            {Array.from({ length: totalPages }).map((_, idx) => {
              const page = idx + 1
              // show only a window for large number of pages
              if (totalPages > 7) {
                if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                  return (
                    <Button key={page} size="sm" variant={page === currentPage ? "secondary" : "ghost"} onClick={() => setCurrentPage(page)}>
                      {page}
                    </Button>
                  )
                }
                if (page === 2 && currentPage > 4) return <span key={page} className="px-2">...</span>
                if (page === totalPages - 1 && currentPage < totalPages - 3) return <span key={page} className="px-2">...</span>
                return null
              }
              return (
                <Button key={page} size="sm" variant={page === currentPage ? "secondary" : "ghost"} onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              )
            })}

            <Button size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Sig
            </Button>
          </div>

          <div className="flex items-center gap-2 justify-center sm:justify-start mt-2 sm:mt-0">
            <label className="text-sm text-muted-foreground">Por página:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="h-8 rounded-md border bg-background px-2 text-sm"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ProductTable
