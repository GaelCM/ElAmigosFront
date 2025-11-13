import { useEffect, useState } from "react";

export function Reloj() {
  const [fechaActual, setFechaActual] = useState(new Date());

  useEffect(() => {
    // Establece un intervalo para actualizar la fecha cada segundo (1000 ms)
    const timerId = setInterval(() => {
      setFechaActual(new Date());
    }, 1);

    // Función de limpieza: se ejecuta cuando el componente se desmonta
    // Es crucial para evitar fugas de memoria (memory leaks)
    return () => {
      clearInterval(timerId);
    };
  }, []); // El array vacío [] asegura que el efecto se ejecute solo una vez (al montar)

  // Opciones para formatear la fecha y hora en español (México)
  // Puedes ajustar 'es-MX' a tu localidad específica si es necesario
  const opcionesFecha: Intl.DateTimeFormatOptions = {
    weekday: 'long', // 'lunes'
    year: 'numeric', // '2025'
    month: 'long', // 'abril'
    day: 'numeric', // '7'
  };
  // const opcionesHora: Intl.DateTimeFormatOptions = {
  //   hour: '2-digit', // '14'
  //   minute: '2-digit', // '29'
  //   second: '2-digit', // '16'
  //   hour12: false // Formato de 24 horas (puedes poner true para AM/PM)
  // };

  const fechaFormateada = fechaActual.toLocaleDateString('es-MX', opcionesFecha);
  // const horaFormateada = fechaActual.toLocaleTimeString('es-MX', opcionesHora);

  return (
    <div className='text-center'>
      <p className='text-4xl font-bold text-primary p-2'>
        {/* Capitaliza la primera letra del día */}
        {fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)}
      </p>
      {/*
      <p className='text-2xl font-bold text-red-500 p-2'>{horaFormateada}</p>
      */}
    </div>
  );
}
