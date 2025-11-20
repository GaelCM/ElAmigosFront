import { useEffect, useMemo, useState } from "react"
import { Card,CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import type { Producto } from "@/types/Producto"
import { useListaProductos } from "@/contexts/listaProductos"
import { getProductos } from "@/api/productosApi/productosApi"
import { ShoppingCart,Search } from "lucide-react"
import { Input } from "./ui/input"
import { toast } from "sonner"




type Props = {
  idSucursal:number
  inputRef?: React.RefObject<{ focus: () => void } | null>;
}

export function ProductTable({idSucursal,inputRef }: Props) {
  const [productos,setProductos]=useState<Producto[]>([])
  const [filteredProductos,setFilteredProductos]=useState<Producto[]>([])
   const [searchTerm, setSearchTerm] = useState('');
  const [loading,setLoading]=useState(false);
  const {addProduct}=useListaProductos()

 useEffect(()=>{
    setLoading(true)
    getProductos(idSucursal).then(res=>{
        if(res.success){
          setProductos(res.data);
          setFilteredProductos(res.data)
        }else{
          setProductos([]);
          setFilteredProductos([]);
        }}
      ).finally(()=>{setLoading(false)})
 },[idSucursal])

  useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = productos.filter((item) => {
            return item.nombre_producto.toLowerCase().includes(lowercasedFilter)||item.sku_pieza.toLowerCase().includes(lowercasedFilter);
        });
        setFilteredProductos(filteredData);
        setCurrentPage(1); 
    }, [productos, searchTerm]);

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(50)


  const totalItems = filteredProductos.length||0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  useEffect(() => {
    // clamp page if productos or pageSize change
    if (currentPage > totalPages) setCurrentPage(totalPages)
    if (currentPage < 1) setCurrentPage(1)
  }, [currentPage, totalPages])

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProductos.slice(start, start + pageSize)
  }, [filteredProductos, currentPage, pageSize])

  if(loading){
    return(
       <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="p-2 overflow-auto border-0">
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
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-full md:min-w-3xl table-auto">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="px-3 py-2">Sku</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2">Precio</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Unidad</th>
              <th className="px-3 py-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => {
              const lowStock = p.stock_disponible_presentacion > 0 && p.stock_disponible_presentacion < 10
              const outStock = p.stock_disponible_presentacion === 0

              return (
                <tr key={p.id_unidad_venta} className="align-top border-t">
                  <td className="px-3 py-3 align-middle text-sm text-muted-foreground">{p.sku_pieza}</td>
                  <td className="px-3 py-3 align-middle">
                    <div className="font-medium text-sm">{p.nombre_producto}</div>
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
                        <Badge variant="secondary" className="bg-red-300">Bajo</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle text-sm text-muted-foreground"><Badge>{p.nombre_presentacion}</Badge></td>
                  <td className="px-3 py-3 align-middle text-right">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                            addProduct(p)
                            toast.success("Producto agregado correctamente")
                            // Usar setTimeout para asegurarnos que el focus se aplique después de que el diálogo se cierre
                            setTimeout(() => {
                                inputRef?.current?.focus();
                            }, 100);                       
                        }}
                        disabled={outStock}
                        aria-label={`Agregar ${p.nombre_producto} al carrito`}
                      >
                        <ShoppingCart></ShoppingCart>
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
