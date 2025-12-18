const o=t=>{const e=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2}),r=i=>i.toLocaleString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=t.productos.map(i=>`
    <tr>
      <td style="padding-top: 4px; vertical-align: top;">${i.cantidad}</td>
      <td style="padding-top: 4px; text-align: left; padding-left: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
        ${i.nombre}
      </td>
      <td style="padding-top: 4px; text-align: right;">${e.format(i.importe)}</td>
    </tr>
  `).join("");return`
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 100%; max-width: 280px; text-transform: uppercase; padding-right: 10px;">
      
      <!-- ENCABEZADO -->
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: bold;">EL AMIGO</h2>
        <p style="margin: 2px 0; font-size: 10px;">Refrescos y Abarrotes</p>
        <p style="margin: 2px 0;">${t.sucursal}</p>
        <p style="margin: 5px 0;">================================</p>
      </div>

      <!-- INFO VENTA -->
      <div style="margin-bottom: 10px;">
        <table style="width: 100%; font-size: 11px;">
          <tr>
            <td>FOLIO:</td>
            <td style="text-align: right; font-weight: bold;">${t.folio||"-----"}</td>
          </tr>
          <tr>
            <td>FECHA:</td>
            <td style="text-align: right;">${r(t.fecha)}</td>
          </tr>
          <tr>
            <td>LE ATENDIÓ:</td>
            <td style="text-align: right;">${t.usuario}</td>
          </tr>
           ${t.cliente&&t.cliente!=="Público General"?`
          <tr>
            <td colspan="2" style="padding-top: 4px;">CLIENTE: ${t.cliente}</td>
          </tr>`:""}
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
            ${n}
          </tbody>
        </table>
      </div>

      <!-- TOTALES -->
      <div>
         <table style="width: 100%; font-size: 14px; font-weight: bold;">
          <tr>
            <td style="text-align: right; padding-right: 10px;">TOTAL:</td>
            <td style="text-align: right;">${e.format(t.total)}</td>
          </tr>
        </table>
        
        <table style="width: 100%; font-size: 12px; margin-top: 4px;">
          <tr>
            <td style="text-align: right; padding-right: 10px;">EFECTIVO/PAGO:</td>
            <td style="text-align: right;">${e.format(t.pago_con)}</td>
          </tr>
          <tr>
            <td style="text-align: right; padding-right: 10px;">CAMBIO:</td>
            <td style="text-align: right;">${e.format(t.cambio)}</td>
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
  `},d=t=>{const e=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2}),r=n=>n.toLocaleString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});return`
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 100%; max-width: 280px; text-transform: uppercase;">
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: bold;">EL AMIGO</h2>
        <p style="margin: 2px 0;">COMPROBANTE DE MOVIMIENTO</p>
        <p style="margin: 5px 0;">================================</p>
      </div>

      <div style="margin-bottom: 10px;">
        <table style="width: 100%; font-size: 11px;">
          <tr>
            <td>TIPO:</td>
            <td style="text-align: right; font-weight: bold;">${t.tipo}</td>
          </tr>
          <tr>
            <td>FECHA:</td>
            <td style="text-align: right;">${r(t.fecha)}</td>
          </tr>
          <tr>
            <td>USUARIO:</td>
            <td style="text-align: right;">${t.usuario}</td>
          </tr>
          <tr>
            <td>SUCURSAL:</td>
            <td style="text-align: right;">${t.sucursal}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 10px 0; margin-bottom: 10px; text-align: center;">
        <p style="margin: 0; font-size: 16px; font-weight: bold;">MONTO: ${e.format(t.monto)}</p>
      </div>

      <div style="margin-bottom: 15px;">
        <p style="margin: 0; font-size: 10px;">CONCEPTO:</p>
        <p style="margin: 5px 0; font-size: 11px; font-style: italic;">${t.concepto||"SIN CONCEPTO"}</p>
      </div>

      <div style="text-align: center; margin-top: 30px; border-top: 1px solid black; padding-top: 5px;">
        <p style="margin: 0; font-size: 10px;">FIRMA</p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 10px;">
        <p style="margin: 0;">${r(new Date)}</p>
        <br/>.
      </div>
    </div>
  `};export{d as generateMovementTicketHTML,o as generateTicketHTML};
