
interface TicketItem {
  cantidad: number;
  nombre: string;
  precio_unitario: number;
  importe: number;
}

interface TicketData {
  sucursal: string; // Nombre de la sucursal
  direccion?: string;
  usuario: string; // Vendedor
  cliente?: string;
  folio?: string | number;
  fecha: Date;
  productos: TicketItem[];
  total: number;
  pago_con: number;
  cambio: number;
}

export const generateTicketHTML = (data: TicketData): string => {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  });

  const formatDate = (date: Date) => {
    return date.toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const itemsHtml = data.productos.map(item => `
    <tr>
      <td style="padding-top: 4px; vertical-align: top;">${item.cantidad}</td>
      <td style="padding-top: 4px; text-align: left; padding-left: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
        ${item.nombre}
      </td>
      <td style="padding-top: 4px; text-align: right;">${formatter.format(item.importe)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 100%; max-width: 280px; text-transform: uppercase; padding-right: 10px;">
      
      <!-- ENCABEZADO -->
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: bold;">${data.sucursal}</h2>
        <p style="margin: 2px 0; font-size: 10px;">Refrescos y Abarrotes</p>
        <p style="margin: 5px 0;">================================</p>
      </div>

      <!-- INFO VENTA -->
      <div style="margin-bottom: 10px;">
        <table style="width: 100%; font-size: 11px;">
          <tr>
            <td>FOLIO:</td>
            <td style="text-align: right; font-weight: bold;">${data.folio || '-----'}</td>
          </tr>
          <tr>
            <td>FECHA:</td>
            <td style="text-align: right;">${formatDate(data.fecha)}</td>
          </tr>
          <tr>
            <td>LE ATENDIÓ:</td>
            <td style="text-align: right;">${data.usuario}</td>
          </tr>
           ${data.cliente && data.cliente !== 'Público General' ? `
          <tr>
            <td colspan="2" style="padding-top: 4px;">CLIENTE: ${data.cliente}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- PRODUCTOS -->
      <div style="border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 5px 0; margin-bottom: 5px;">
        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; width: 15%;">CANT</th>
              <th style="text-align: left;">DESC</th>
              <th style="text-align: right; width: 25%;">IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- TOTALES -->
      <div>
         <table style="width: 100%; font-size: 14px; font-weight: bold;">
          <tr>
            <td style="text-align: right; padding-right: 10px;">TOTAL:</td>
            <td style="text-align: right;">${formatter.format(data.total)}</td>
          </tr>
        </table>
        
        <table style="width: 100%; font-size: 12px; margin-top: 4px;">
          <tr>
            <td style="text-align: right; padding-right: 10px;">EFECTIVO/PAGO:</td>
            <td style="text-align: right;">${formatter.format(data.pago_con)}</td>
          </tr>
          <tr>
            <td style="text-align: right; padding-right: 10px;">CAMBIO:</td>
            <td style="text-align: right;">${formatter.format(data.cambio)}</td>
          </tr>
        </table>
      </div>

      <!-- PIE -->
      <div style="text-align: center; margin-top: 15px; font-size: 11px;">
        <p style="margin:0;">¡GRACIAS POR SU COMPRA!</p>
        <p style="margin:2px 0;">VUELVA PRONTO</p>
        
        <br/>
        .
      </div>
    </div>
  `;
}

interface MovementTicketData {
  sucursal: string;
  usuario: string;
  fecha: Date;
  monto: number;
  concepto: string;
  tipo: "RETIRO" | "DEPÓSITO";
  folio?: string | number;
}

export const generateMovementTicketHTML = (data: MovementTicketData): string => {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  });

  const formatDate = (date: Date) => {
    return date.toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return `
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 100%; max-width: 280px; text-transform: uppercase;">
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: bold;">${data.sucursal}</h2>
        <p style="margin: 2px 0;">COMPROBANTE DE MOVIMIENTO</p>
        <p style="margin: 5px 0;">================================</p>
      </div>

      <div style="margin-bottom: 10px;">
        <table style="width: 100%; font-size: 11px;">
          <tr>
            <td>TIPO:</td>
            <td style="text-align: right; font-weight: bold;">${data.tipo}</td>
          </tr>
          <tr>
            <td>FECHA:</td>
            <td style="text-align: right;">${formatDate(data.fecha)}</td>
          </tr>
          <tr>
            <td>USUARIO:</td>
            <td style="text-align: right;">${data.usuario}</td>
          </tr>
          <tr>
            <td>SUCURSAL:</td>
            <td style="text-align: right;">${data.sucursal}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 10px 0; margin-bottom: 10px; text-align: center;">
        <p style="margin: 0; font-size: 16px; font-weight: bold;">MONTO: ${formatter.format(data.monto)}</p>
      </div>

      <div style="margin-bottom: 15px;">
        <p style="margin: 0; font-size: 10px;">CONCEPTO:</p>
        <p style="margin: 5px 0; font-size: 11px; font-style: italic;">${data.concepto || 'SIN CONCEPTO'}</p>
      </div>

      <div style="text-align: center; margin-top: 30px; border-top: 1px solid black; padding-top: 5px;">
        <p style="margin: 0; font-size: 10px;">FIRMA</p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 10px;">
        <p style="margin: 0;">${formatDate(new Date())}</p>
        <br/>.
      </div>
    </div>
  `;
}
