const n=t=>{const i=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2}),e=r=>r.toLocaleString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});return`
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 100%; max-width: 280px; text-transform: uppercase;">
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: bold;">${t.sucursal}</h2>
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
            <td style="text-align: right;">${e(t.fecha)}</td>
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
        <p style="margin: 0; font-size: 16px; font-weight: bold;">MONTO: ${i.format(t.monto)}</p>
      </div>

      <div style="margin-bottom: 15px;">
        <p style="margin: 0; font-size: 10px;">CONCEPTO:</p>
        <p style="margin: 5px 0; font-size: 11px; font-style: italic;">${t.concepto||"SIN CONCEPTO"}</p>
      </div>

      <div style="text-align: center; margin-top: 30px; border-top: 1px solid black; padding-top: 5px;">
        <p style="margin: 0; font-size: 10px;">FIRMA</p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 10px;">
        <p style="margin: 0;">${e(new Date)}</p>
        <br/>.
      </div>
    </div>
  `};export{n as generateMovementTicketHTML};
