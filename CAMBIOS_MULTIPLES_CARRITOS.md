# 🛒 Sistema de Múltiples Carritos - Implementación

## ✅ Cambios Realizados

### 1. **Refactorización del Contexto de Carritos** (`listaProductos.ts`)

Se modernizó completamente la estructura del almacenamiento de carritos:

#### Nuevos Tipos:
```typescript
export type Carrito = {
    id: string;              // ID único del carrito
    nombre: string;          // Nombre personalizable (Ej: "Venta Cliente A")
    productos: ProductoItem[]; // Productos en el carrito
    cliente?: Cliente;       // Cliente asociado (opcional)
    fechaCreacion: Date;     // Timestamp de creación
}
```

#### Nuevas Funciones Disponibles:
- **Gestión de Carritos:**
  - `crearCarrito(nombre?)` - Crea un nuevo carrito y lo activa
  - `cambiarCarritoActivo(id)` - Cambia entre carritos abiertos
  - `eliminarCarrito(id)` - Elimina un carrito (normalmente después de confirmar venta)
  - `renombrarCarrito(id, nuevoNombre)` - Edita el nombre del carrito
  - `asignarClienteCarrito(id, cliente)` - Asigna un cliente a un carrito

- **Operaciones en Carrito Activo:**
  - `addProduct()`, `removeProduct()`, `incrementQuantity()`, `decrementQuantity()`, `clearCart()` - Como antes, pero ahora operan sobre el carrito activo

- **Selectores:**
  - `getCarritoActivo()` - Obtiene el carrito activo completo
  - `getCarritoById(id)` - Busca un carrito por ID
  - `getTotalPrice()` - Total del carrito activo
  - `getTotalItems()` - Total de items del carrito activo

---

### 2. **Nuevo Componente: CarritoTabs** (`carritoTabs.tsx`)

Componente visual para gestionar los tabs de carritos:

**Características:**
- 🆕 Botón **"Nuevo"** para crear carritos adicionales
- 📊 **Tabs horizontales** con nombre y cantidad de productos
- ✏️ **Editar nombres** con doble clic en el tab
- 🗑️ **Eliminar carritos** con confirmación
- 🎯 **Cambiar entre carritos** con un click
- 📱 **Scroll horizontal** si hay muchos carritos

---

### 3. **Actualización de HomePage** (`home.tsx`)

Se actualizó el componente principal para:

- ✅ Integrar el nuevo `CarritoTabs` al inicio
- ✅ Usar `getCarritoActivo()` en lugar de acceder directo a carrito
- ✅ Inicializar automáticamente un carrito por defecto al cargar
- ✅ Actualizar todas las referencias a `carrito.length` a `carritoActual?.productos?.length ?? 0`
- ✅ Mantener toda la funcionalidad anterior: escaneo, búsqueda, edición de cantidades

---

## 🎯 Cómo Funciona

### Flujo Típico:

1. **El usuario abre HomePage**
   - Se crea automáticamente un carrito "Venta Principal"

2. **El usuario escanea productos**
   - Se agregan al carrito activo actual

3. **El usuario hace clic en "Nuevo"**
   - Se crea un nuevo carrito
   - El cliente puede cambiar entre carritos sin perder información

4. **El usuario confirma una venta**
   - Se cierra el modal de confirmación
   - El carrito se elimina después de procesar el pago
   - El sistema cambia automáticamente al siguiente carrito si existe

---

## 💾 Almacenamiento Persistente

Los carritos se guardan en localStorage bajo la clave `lista-Productos-v2`:

```json
{
  "carritos": [
    {
      "id": "carrito_1234567890_abc123",
      "nombre": "Cliente Juan Pérez",
      "productos": [...],
      "cliente": {...},
      "fechaCreacion": "2025-11-19T10:30:00"
    },
    {
      "id": "carrito_1234567891_def456",
      "nombre": "Venta Mostrador",
      "productos": [...],
      "fechaCreacion": "2025-11-19T10:35:00"
    }
  ],
  "carritoActivo": "carrito_1234567890_abc123"
}
```

---

## 🔄 Casos de Uso

### Caso 1: Cliente entra, escanea, paga
- ✅ Se crea "Venta Principal" automáticamente
- ✅ El cliente escanea productos
- ✅ Se confirma la venta
- ✅ El carrito se limpia para el siguiente cliente

### Caso 2: Múltiples clientes en espera
- ✅ Cliente A: Se escanean sus productos en Carrito 1
- ✅ Usuario hace clic "Nuevo" → Se crea Carrito 2
- ✅ Cliente B: Se escanean sus productos en Carrito 2
- ✅ El usuario cambia a Carrito 1 (sin perder los datos)
- ✅ Se confirma venta del Cliente A
- ✅ Carrito 1 se elimina, quedando solo Carrito 2 activo

### Caso 3: Cliente retiene carrito como "borrador"
- ✅ Renombra el carrito: "Cliente ABC - Pendiente"
- ✅ Crea otro carrito para el siguiente cliente
- ✅ Más tarde, cambia al carrito "Pendiente" y continúa

---

## 📱 Mejoras de UX

✅ **Claridad visual:** Tabs mostrando carritos abiertos  
✅ **Edición flexible:** Renombrar carritos con doble clic  
✅ **Gestión simple:** Eliminar carritos con un click  
✅ **Persistencia:** Los carritos se guardan en localStorage  
✅ **Inicialización:** Automáticamente se crea un carrito al abrir  
✅ **Compatibilidad:** Todo el código anterior sigue funcionando  

---

## 🚀 Próximas Mejoras (Opcionales)

- [ ] Guardar historial de ventas cerradas
- [ ] Exportar carrito como PDF o recibo
- [ ] Sincronización con backend de carritos abiertos
- [ ] Tiempos de inactividad y alertas
- [ ] Búsqueda por cliente en carritos históricos

