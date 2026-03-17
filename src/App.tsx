import { useEffect, useState } from 'react';
import './App.css'
import NavBar from './components/navbar'
import Sidebar from './components/sidebar';
import { Cron } from 'croner';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
// Importamos el archivo de sonido desde assets usando Vite
import notificacionAudio from './assets/notification.mp3';
import { getClientesResagados } from './api/creditosApi/creditosApi';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Definimos la función que ejecuta las alertas primero
    const revisarCreditos = async () => {
      try {
        // Llamada real a tu API usando el archivo api
        const respuesta = await getClientesResagados();

        if (respuesta.success && respuesta.data.length > 0) {
          const hoy = new Date();

          // Filtramos: Rezagados mayores a 2 días
          const clientesAtrasados = respuesta.data.filter((cliente) => {
            if (!cliente.deuda_mas_antigua) return false;

            const fechaDeuda = new Date(cliente.deuda_mas_antigua);
            // Calculamos la diferencia en milisegundos y la pasamos a días
            const difTiempo = Math.abs(hoy.getTime() - fechaDeuda.getTime());
            const difDias = Math.ceil(difTiempo / (1000 * 60 * 60 * 24));

            // Si la deuda tiene MÁS de 2 días, entra a la lista
            return difDias > 2;
          });

          // Solo notificamos si la lista de atrasados no está vacía
          if (clientesAtrasados.length > 0) {
            // Reproducir el sonido
            const audio = new Audio(notificacionAudio);
            audio.play().catch(e => console.error("Error al reproducir sonido:", e));

            // Muestra la notificación visual
            toast.warning('¡Créditos Vencidos (Rezagados)!', {
              description: `Hay ${clientesAtrasados.length} cliente(s) con deudas mayores a 2 días.`,
              duration: 10000,
              action: {
                label: 'Ver Lista',
                onClick: () => {
                  navigate('/creditos');
                }
              }
            });
          }
        }
      } catch (error) {
        console.error("Error revisando los créditos del día", error);
      }
    };

    // LÍNEA DE PRUEBA: La ejecutamos manualmente apenas inicie la App (Quítala en producción)
    revisarCreditos();

    // Cron temporal para Pruebas ('* * * * *' = cada minuto).
    // NOTA: Cuando termines de probar, cámbialo a '0 18 * * *' para que sea a las 6:00 PM.
    const job = new Cron('0 18 * * *', revisarCreditos);

    // Limpiamos el cron si por alguna razón el componente App se desmonta
    return () => {
      job.stop();
    };
  }, [navigate]);

  return (
    <>
      <div className="flex h-screen bg-background">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} ></Sidebar>
        <NavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}></NavBar>
      </div>
    </>
  )
}
