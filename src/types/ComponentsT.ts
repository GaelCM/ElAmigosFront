import type { TransferenciaDTO } from "./Transferencias";

export interface TransferenciasPendientesProps {
  transferencias: TransferenciaDTO[];
  onRecibir: (id: number) => void;
  onCancelar: (id: number) => void;
}


export interface TablaTransferenciasProps {
  transferencias: TransferenciaDTO[];
  onEnviar: (id: number) => void;
  onCancelar: (id: number) => void;
  onVerDetalle: (id: number) => void;
  mostrarAcciones?: boolean;
  loading: boolean;
  setLoading: (v: boolean) => void;
}