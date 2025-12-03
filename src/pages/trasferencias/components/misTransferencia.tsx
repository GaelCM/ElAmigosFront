

import { obtenerTransferenciasApi, obtenerTransferenciasPendientesApi } from "@/api/transferenciasApi/transferenciasApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { TablaTransferenciasProps, TransferenciasPendientesProps } from "@/types/ComponentsT";
import type { TransferenciaDTO } from "@/types/Transferencias";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ArrowRightLeft, Ban, CheckCircle, Clock, Eye, Package, PackageCheck, Send, XCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";





// ====================================
// COMPONENTES UI
// ====================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'pending' | 'transit' | 'received' | 'cancelled';
}
const Badge = ({ children, variant = 'default' }:BadgeProps) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    transit: 'bg-blue-100 text-blue-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
}
const Card = ({ children, className = '' }:CardProps) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}
const Button = ({ children, variant = 'default', size = 'md', onClick, className = '', disabled = false }:ButtonProps) => {
  const variants = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};


interface TabItem {
  id: string | number;
  icon?: ReactNode;
  label: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string | number;
  onChange: (id: string | number) => void;
}

const Tabs = ({ tabs, activeTab, onChange }: TabsProps) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.count && tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
};

// ====================================
// FUNCIONES AUXILIARES
// ====================================

const getEstadoBadge = (estado: string | number) => {
  const estados = {
    pendiente: { variant: 'pending', icon: <Clock className="w-3 h-3" />, text: 'Pendiente' },
    en_transito: { variant: 'transit', icon: <Send className="w-3 h-3" />, text: 'En Tránsito' },
    recibida: { variant: 'received', icon: <CheckCircle className="w-3 h-3" />, text: 'Recibida' },
    cancelada: { variant: 'cancelled', icon: <XCircle className="w-3 h-3" />, text: 'Cancelada' }
  };

  const config = estados[estado] || estados.pendiente;

  return (
    <Badge variant={config.variant}>
      <span className="flex items-center gap-1">
        {config.icon}
        {config.text}
      </span>
    </Badge>
  );
};

const formatFecha = (fecha: string | number | Date) => {
  if (!fecha) return '-';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ====================================
// COMPONENTE: TABLA DE TRANSFERENCIAS
// ====================================

const TablaTransferencias = ({ transferencias, onEnviar, onCancelar, onVerDetalle, mostrarAcciones = true,loading}:TablaTransferenciasProps) => {
  return (
    <div className="overflow-x-auto">

      
      {loading?(
        <div className="text-center p-35">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando sucursales...</p>
        </div>
      )
      :(
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Origen → Destino
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha Envío
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Productos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Motivo
            </th>
            {mostrarAcciones && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transferencias.map((transferencia:TransferenciaDTO) => (
            <tr key={"dd"} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{transferencia.id_transferencia}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getEstadoBadge(transferencia.estado)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{transferencia.sucursal_origen}</span>
                  <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{transferencia.sucursal_destino}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Por: {transferencia.usuario_origen}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFecha(transferencia.fecha_creacion)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex flex-col">
                  <span className="font-medium">{transferencia.total_productos} productos</span>
                  <span className="text-xs text-gray-500">{transferencia.total_piezas} piezas</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {transferencia.motivo}
              </td>
              {mostrarAcciones && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onVerDetalle(transferencia.id_transferencia)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {transferencia.estado === 'pendiente' && (
                      <>
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => onEnviar(transferencia.id_transferencia)}
                        >
                          <Send className="w-4 h-4" />
                          Enviar
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => onCancelar(transferencia.id_transferencia)}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    {transferencia.estado === 'en_transito' && (
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => onCancelar(transferencia.id_transferencia)}
                      >
                        <Ban className="w-4 h-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      )}

      
      
      {transferencias.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay transferencias para mostrar</p>
        </div>
      )}
    </div>
  );
};

// ====================================
// COMPONENTE: TRANSFERENCIAS PENDIENTES DE RECIBIR
// ====================================

const TransferenciasPendientesRecibir = ({ transferencias, onRecibir, onCancelar}:TransferenciasPendientesProps) => {
  return (
    <div className="space-y-4">
      {transferencias.map((transferencia:TransferenciaDTO) => (
        <Card key={transferencia.id_transferencia} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <PackageCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Transferencia #{transferencia.id_transferencia}
                  </h3>
                  <p className="text-sm text-gray-500">
                    De: <span className="font-medium text-gray-700">{transferencia.sucursal_origen}</span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Enviado por</p>
                  <p className="text-sm font-medium text-gray-900">{transferencia.usuario_origen}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fecha de envío</p>
                  <p className="text-sm font-medium text-gray-900">{formatFecha(transferencia.fecha_envio)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Productos</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transferencia.total_productos} productos ({transferencia.total_piezas} piezas)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  {getEstadoBadge(transferencia.estado)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500 mb-1">Motivo</p>
                <p className="text-sm text-gray-700">{transferencia.motivo}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 ml-6">
              <Button 
                variant="success"
                onClick={() => onRecibir(transferencia.id_transferencia)}
              >
                <PackageCheck className="w-4 h-4" />
                Recibir y Autorizar
              </Button>
              <Button 
                variant="danger"
                onClick={() => onCancelar(transferencia.id_transferencia)}
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      {transferencias.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <PackageCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay transferencias pendientes
            </h3>
            <p className="text-gray-500">
              Cuando otras sucursales envíen productos, aparecerán aquí para que los recibas
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

export default function MisTransferencias(){
  const timeZone = 'America/Mexico_City';
  const now = new Date();
  const zonedDate = toZonedTime(now, timeZone);
  const fechaFormateada = format(zonedDate, 'yyyy-MM-dd');

  const [tabActiva, setTabActiva] = useState('todas');
  const [loading,setLoading]=useState(false);
  const [fechaDesde,setFechaDesde]=useState<string>(fechaFormateada);
  const [fechaHasta,setFechaHasta]=useState<string>(fechaFormateada);
  const [transferencias,setTransferencias]=useState<TransferenciaDTO[]>([]);
  const [transferenciasPendientes,setTransferenciasPendientes]=useState<TransferenciaDTO[]>([]);

  const {user}=useCurrentUser();
  // Simular datos del usuario


  useEffect(()=>{ 
      obtenerTransferenciasApi(user.id_usuario,user.id_rol,fechaDesde,fechaHasta).then(res=>{
        if(res.success){
          setTransferencias(res.data);
        }else{
          setTransferencias([]);
        }
      });

      obtenerTransferenciasPendientesApi(user.id_sucursal).then(res=>{
        if(res.success){
          setTransferenciasPendientes(res.data);
        }else{
          setTransferenciasPendientes([]);
        }
      });

  },[fechaDesde,fechaHasta]);


  // Filtrar transferencias según el rol
  const transferenciasVisibles = user.id_rol === 1 
    ? transferencias 
    : transferencias.filter(t => 
        t.id_sucursal_origen === user.id_sucursal
      );

  // Handlers
  const handleEnviar = (id:number) => {
    console.log('Enviar transferencia:', id);
    alert(`Enviando transferencia #${id}`);
  };

  const handleCancelar = (id:number) => {
    console.log('Cancelar transferencia:', id);
    alert(`Cancelando transferencia #${id}`);
  };

  const handleVerDetalle = (id:number) => {
    console.log('Ver detalle:', id);
    alert(`Ver detalle de transferencia #${id}`);
  };

  const handleRecibir = (id:number) => {
    console.log('Recibir transferencia:', id);
    alert(`Recibiendo y autorizando transferencia #${id}`);
  };

  const tabs = [
    {
      id: 'todas',
      label: 'Todas las Transferencias',
      icon: <Package className="w-4 h-4" />,
      count: transferenciasVisibles.length
    },
    {
      id: 'pendientes-recibir',
      label: 'Por Recibir',
      icon: <PackageCheck className="w-4 h-4" />,
      count: transferenciasPendientes.length
    }
  ];

  return (
    <div className="bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Transferencias de Productos
            </h1>
          </div>
          <p className="text-gray-600">
            {user.id_rol === 1 
              ? 'Vista de administrador - Todas las sucursales'
              : `Transferencias de ${user.sucursal}`
            }
          </p>
        </div>

        {/* Tabs */}
        <Card className="mb-6">
          <Tabs 
            tabs={tabs}
            activeTab={tabActiva}
            onChange={()=>{setTabActiva(tabActiva==='todas'?'pendientes-recibir':'todas')}}
          />
        </Card>

        {/* Contenido según tab activa */}
        {tabActiva === 'todas' && (
          <Card>
          
            <div>
              <section className="flex flex-col items-center justify-center gap-4">
                 <div className="flex gap-2 items-center p-5">
                    <p className="text-xl font-bold text-primary p-5">Fecha desde</p>
                    <input type="date" defaultValue={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)} />
                    <p>-</p>
                    <p className="text-xl font-bold text-primary p-5">Fecha hasta</p>
                    <input type="date" defaultValue={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)} />
                 </div>
            </section>

            </div>

            <TablaTransferencias
              transferencias={transferenciasVisibles}
              onEnviar={handleEnviar}
              onCancelar={handleCancelar}
              onVerDetalle={handleVerDetalle}
              loading={loading}
              setLoading={setLoading}
            />
          </Card>
        )}

        {tabActiva === 'pendientes-recibir' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Transferencias Pendientes de Recibir
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Productos enviados desde otras sucursales esperando tu confirmación
              </p>
            </div>
            <TransferenciasPendientesRecibir
              transferencias={transferenciasPendientes}
              onRecibir={handleRecibir}
              onCancelar={handleCancelar}
            />
          </div>
        )}
      </div>
    </div>
  );
};




