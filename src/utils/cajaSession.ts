export interface TurnoSessionData {
  id_turno: number;
  id_usuario?: number;
  id_sucursal?: number;
  fecha_apertura?: string;
  estado?: string;
  [key: string]: any;
}

/**
 * Obtiene la sesión de caja/turno activa de forma segura y unificada.
 * Si se ejecuta en Electron:
 *  - La fuente única de verdad es electron-store ('open_caja').
 *  - Si electron-store no tiene turno, se purga cualquier turno viejo o fantasma en localStorage
 *    para evitar que revivan turnos antiguos cerrados en fechas previas.
 * Si se ejecuta en Navegador Web puro:
 *  - Lee localStorage('open_caja') y valida que tenga un id_turno numérico válido (> 0).
 */
export async function getOpenCajaSession(): Promise<TurnoSessionData | null> {
  try {
    // @ts-ignore
    const api = window["electron-api"];
    if (api && typeof api.getConfig === "function") {
      const storeCaja = await api.getConfig("open_caja");
      const idTurno = storeCaja?.id_turno || storeCaja?.id;

      if (storeCaja && idTurno && Number(idTurno) > 0) {
        const normalized: TurnoSessionData = {
          ...storeCaja,
          id_turno: Number(idTurno),
        };
        // Mantener sincronizado localStorage con el turno real de Electron
        localStorage.setItem("open_caja", JSON.stringify(normalized));
        return normalized;
      }

      // En Electron: si no hay caja abierta en el store, la caja está CERRADA.
      // Purgamos inmediatamente cualquier residuo en localStorage para evitar turnos zombies.
      localStorage.removeItem("open_caja");
      localStorage.removeItem("openCaja");
      return null;
    }

    // Modo Web puro (sin Electron)
    const localRaw = localStorage.getItem("open_caja") || localStorage.getItem("openCaja");
    if (!localRaw) return null;

    const parsed = JSON.parse(localRaw);
    const idTurno = parsed?.id_turno || parsed?.id;
    if (parsed && idTurno && Number(idTurno) > 0) {
      return {
        ...parsed,
        id_turno: Number(idTurno),
      };
    }

    // Si había datos corruptos o sin id_turno, limpiar
    localStorage.removeItem("open_caja");
    localStorage.removeItem("openCaja");
    return null;
  } catch (error) {
    console.error("Error al obtener la sesión de caja:", error);
    return null;
  }
}

/**
 * Guarda el turno de caja abierto en ambos almacenamientos de manera consistente.
 */
export async function setOpenCajaSession(data: TurnoSessionData): Promise<void> {
  try {
    const idTurno = data?.id_turno || data?.id;
    if (!idTurno || Number(idTurno) <= 0) {
      console.error("Intento de guardar sesión de caja sin id_turno válido:", data);
      return;
    }

    const normalized: TurnoSessionData = {
      ...data,
      id_turno: Number(idTurno),
    };

    // @ts-ignore
    const api = window["electron-api"];
    if (api && typeof api.setConfig === "function") {
      await api.setConfig("open_caja", normalized);
    }
    localStorage.setItem("open_caja", JSON.stringify(normalized));
    localStorage.removeItem("openCaja"); // eliminar clave obsoleta
  } catch (error) {
    console.error("Error al guardar la sesión de caja:", error);
  }
}

/**
 * Cierra y purga totalmente la sesión de caja de TODOS los almacenamientos
 * (Electron store y LocalStorage).
 */
export async function clearOpenCajaSession(): Promise<void> {
  try {
    // @ts-ignore
    const api = window["electron-api"];
    if (api && typeof api.setConfig === "function") {
      await api.setConfig("open_caja", null);
    }
    localStorage.removeItem("open_caja");
    localStorage.removeItem("openCaja");
  } catch (error) {
    console.error("Error al limpiar la sesión de caja:", error);
  }
}

