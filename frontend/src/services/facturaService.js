import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Formatear moneda a Colones
const formatearColones = (monto) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(monto || 0);
};

// Formatear fecha
const formatearFecha = (fecha) => {
  if (!fecha) return new Date().toLocaleDateString('es-CR');
  
  let fechaObj;
  if (fecha && typeof fecha.toDate === 'function') {
    fechaObj = fecha.toDate();
  } else {
    fechaObj = new Date(fecha);
  }
  
  if (isNaN(fechaObj.getTime())) {
    return new Date().toLocaleDateString('es-CR');
  }
  
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(fechaObj);
};

// Número de factura consecutivo
let numeroFactura = 1;

// Generar PDF de factura electrónica
export const generarFacturaPDF = async (venta, detalles, empresaInfo) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const empresa = {
    nombre: empresaInfo?.nombre || 'PULPERÍA VIOLETA',
    cedula: empresaInfo?.cedula || '3-101-123456',
    telefono: empresaInfo?.telefono || '2222-3333',
    email: empresaInfo?.email || 'pulperia@violeta.com',
    direccion: empresaInfo?.direccion || 'San José, Costa Rica'
  };

  const cliente = {
    nombre: venta.Cliente || 'Consumidor Final',
    cedula: venta.CedulaCliente || 'N/A',
    email: venta.EmailCliente || 'N/A'
  };

  const factura = {
    numero: `${numeroFactura.toString().padStart(8, '0')}`,
    fecha: formatearFecha(venta.Fecha),
    condicion: 'CONTADO',
    plazo: '0 días'
  };

  numeroFactura++;

  // Encabezado
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(102, 126, 234);
  doc.text('FACTURA ELECTRÓNICA', 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Autorizada por Hacienda - Costa Rica', 105, 32, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(empresa.nombre, 20, 50);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cédula Jurídica: ${empresa.cedula}`, 20, 57);
  doc.text(`Teléfono: ${empresa.telefono}`, 20, 64);
  doc.text(`Email: ${empresa.email}`, 20, 71);
  doc.text(`Dirección: ${empresa.direccion}`, 20, 78);
  
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.5);
  doc.line(20, 85, 190, 85);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE:', 20, 95);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${cliente.nombre}`, 20, 102);
  doc.text(`Identificación: ${cliente.cedula}`, 20, 109);
  doc.text(`Email: ${cliente.email}`, 20, 116);
  
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA FACTURA:', 140, 95);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${factura.numero}`, 140, 102);
  doc.text(`Fecha: ${factura.fecha}`, 140, 109);
  doc.text(`Condición: ${factura.condicion}`, 140, 116);
  doc.text(`Plazo: ${factura.plazo}`, 140, 123);
  
  doc.line(20, 130, 190, 130);
  
  // Tabla de productos
  const tableHeaders = [['Cant.', 'Código', 'Descripción', 'Precio Unit.', 'Subtotal']];
  const tableData = detalles.map(detalle => [
    detalle.Cantidad || 0,
    detalle.CodigoBarra || 'N/A',
    detalle.NombreProducto || 'Producto',
    formatearColones(detalle.PrecioUnitario),
    formatearColones(detalle.Subtotal)
  ]);
  
  doc.autoTable({
    startY: 138,
    head: tableHeaders,
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'left', cellWidth: 70 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 35 }
    },
    margin: { left: 20, right: 20 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  
  const subtotal = venta.Subtotal || 0;
  const ivaMonto = venta.Impuesto || 0;
  const total = venta.Total || 0;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Resumen de la transacción:', 140, finalY);
  
  const resumenY = finalY + 5;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 249, 250);
  doc.rect(140, resumenY, 50, 45, 'F');
  
  doc.text('Subtotal:', 145, resumenY + 10);
  doc.text(formatearColones(subtotal), 180, resumenY + 10, { align: 'right' });
  doc.text('IVA (13%):', 145, resumenY + 20);
  doc.text(formatearColones(ivaMonto), 180, resumenY + 20, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 167, 69);
  doc.text('TOTAL:', 145, resumenY + 35);
  doc.text(formatearColones(total), 180, resumenY + 35, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Gracias por su compra. Esta factura es un comprobante fiscal.', 105, 270, { align: 'center' });
  doc.text(`Código de seguridad: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 105, 277, { align: 'center' });
  
  doc.setFillColor(0, 0, 0);
  doc.rect(20, 260, 30, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text('QR', 32, 278);
  
  const nombreArchivo = `Factura_${factura.numero}_${new Date().getTime()}.pdf`;
  doc.save(nombreArchivo);
  
  return { success: true, nombreArchivo };
};

// Generar reporte de historial de ventas completo
export const generarHistorialVentasPDF = async (ventas, empresaInfo) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter'
  });

  const empresa = {
    nombre: empresaInfo?.nombre || 'PULPERÍA VIOLETA',
    cedula: empresaInfo?.cedula || '3-101-123456',
    telefono: empresaInfo?.telefono || '2222-3333',
    direccion: empresaInfo?.direccion || 'San José, Costa Rica'
  };

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(102, 126, 234);
  doc.text('HISTORIAL DE VENTAS', 148, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(empresa.nombre, 148, 30, { align: 'center' });
  doc.text(`Cédula: ${empresa.cedula} | Tel: ${empresa.telefono}`, 148, 37, { align: 'center' });
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CR')}`, 148, 44, { align: 'center' });
  
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.5);
  doc.line(15, 50, 280, 50);
  
  const tableHeaders = [['Folio', 'Fecha', 'Cliente', 'Cédula', 'Subtotal', 'IVA 13%', 'Total', 'Estado', 'Método Pago']];
  const tableData = ventas.map(venta => {
    let fechaStr = '';
    if (venta.Fecha) {
      if (typeof venta.Fecha.toDate === 'function') {
        fechaStr = venta.Fecha.toDate().toLocaleDateString('es-CR');
      } else {
        fechaStr = new Date(venta.Fecha).toLocaleDateString('es-CR');
      }
    } else {
      fechaStr = 'N/A';
    }
    
    return [
      venta.Folio || 'N/A',
      fechaStr,
      venta.Cliente || 'Consumidor Final',
      venta.CedulaCliente || 'N/A',
      formatearColones(venta.Subtotal || 0),
      formatearColones(venta.Impuesto || 0),
      formatearColones(venta.Total || 0),
      venta.Estado || 'COMPLETADA',
      venta.MetodoPago || 'EFECTIVO'
    ];
  });
  
  doc.autoTable({
    startY: 55,
    head: tableHeaders,
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'left', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 28 },
      7: { halign: 'center', cellWidth: 22 },
      8: { halign: 'center', cellWidth: 25 }
    },
    margin: { left: 15, right: 15 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  
  const totalVentas = ventas.reduce((sum, v) => sum + (v.Total || 0), 0);
  const totalSubtotal = ventas.reduce((sum, v) => sum + (v.Subtotal || 0), 0);
  const totalImpuestos = ventas.reduce((sum, v) => sum + (v.Impuesto || 0), 0);
  const ventasCompletadas = ventas.filter(v => v.Estado === 'COMPLETADA').length;
  const ventasAnuladas = ventas.filter(v => v.Estado === 'ANULADA').length;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('RESUMEN GENERAL:', 15, finalY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de ventas: ${formatearColones(totalVentas)}`, 15, finalY + 8);
  doc.text(`Total subtotal: ${formatearColones(totalSubtotal)}`, 15, finalY + 14);
  doc.text(`Total IVA (13%): ${formatearColones(totalImpuestos)}`, 15, finalY + 20);
  doc.text(`Ventas completadas: ${ventasCompletadas}`, 15, finalY + 26);
  doc.text(`Ventas anuladas: ${ventasAnuladas}`, 15, finalY + 32);
  doc.text(`Total transacciones: ${ventas.length}`, 15, finalY + 38);
  doc.text(`Promedio por venta: ${formatearColones(totalVentas / (ventas.length || 1))}`, 15, finalY + 44);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Este documento es un reporte generado automáticamente por el sistema Pulpería Violeta', 148, 195, { align: 'center' });
  
  const nombreArchivo = `Historial_Ventas_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
  
  return { success: true, nombreArchivo };
};