import { 
  db, 
  proveedoresCollection, 
  productosCollection, 
  ventasCollection, 
  comprasCollection, 
  detalleVentasCollection, 
  detalleComprasCollection, 
  getCurrentTimestamp 
} from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  writeBatch
} from 'firebase/firestore';

// Función para generar folio
const generarFolio = (tipo) => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const aleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${tipo}-${año}${mes}${dia}-${aleatorio}`;
};

// ==================== PROVEEDORES ====================
export const getProveedores = async () => {
  try {
    const querySnapshot = await getDocs(proveedoresCollection);
    const proveedores = querySnapshot.docs.map(doc => ({ 
      Id: doc.id, 
      ...doc.data()
    }));
    // Ordenar en memoria
    proveedores.sort((a, b) => (a.Nombre || '').localeCompare(b.Nombre || ''));
    return proveedores;
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    throw error;
  }
};

export const crearProveedor = async (proveedor) => {
  try {
    const docRef = await addDoc(proveedoresCollection, {
      ...proveedor,
      FechaRegistro: getCurrentTimestamp()
    });
    return { Id: docRef.id, ...proveedor };
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    throw error;
  }
};

export const actualizarProveedor = async (id, proveedor) => {
  try {
    const proveedorRef = doc(db, 'proveedores', id);
    await updateDoc(proveedorRef, proveedor);
    return { Id: id, ...proveedor };
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    throw error;
  }
};

export const eliminarProveedor = async (id) => {
  try {
    await deleteDoc(doc(db, 'proveedores', id));
    return true;
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    throw error;
  }
};

// ==================== PRODUCTOS ====================
export const getProductos = async () => {
  try {
    const q = query(productosCollection, where('Activo', '==', true));
    const querySnapshot = await getDocs(q);
    
    // Obtener nombres de proveedores
    const proveedores = await getProveedores();
    const proveedoresMap = new Map(proveedores.map(p => [p.Id, p.Nombre]));
    
    let productos = querySnapshot.docs.map(doc => ({ 
      Id: doc.id, 
      ...doc.data(),
      ProveedorNombre: proveedoresMap.get(doc.data().ProveedorId) || 'Sin proveedor'
    }));
    
    // Ordenar en memoria
    productos.sort((a, b) => (a.Nombre || '').localeCompare(b.Nombre || ''));
    
    return productos;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

export const buscarProductoPorCodigo = async (codigo) => {
  try {
    // Buscar por código de barras
    const q = query(
      productosCollection,
      where('CodigoBarra', '==', codigo),
      where('Activo', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { Id: doc.id, ...doc.data() };
    }
    
    // Si no se encuentra por código, buscar por ID
    const productoDoc = await getDoc(doc(db, 'productos', codigo));
    if (productoDoc.exists() && productoDoc.data().Activo) {
      return { Id: productoDoc.id, ...productoDoc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error al buscar producto:', error);
    throw error;
  }
};

export const crearProducto = async (producto) => {
  try {
    const docRef = await addDoc(productosCollection, {
      ...producto,
      Stock: parseInt(producto.Stock) || 0,
      StockMinimo: parseInt(producto.StockMinimo) || 5,
      PrecioCompra: parseFloat(producto.PrecioCompra),
      PrecioVenta: parseFloat(producto.PrecioVenta),
      Activo: true,
      FechaCreacion: getCurrentTimestamp()
    });
    return { Id: docRef.id, ...producto };
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw error;
  }
};

export const actualizarProducto = async (id, producto) => {
  try {
    const productoRef = doc(db, 'productos', id);
    await updateDoc(productoRef, {
      CodigoBarra: producto.CodigoBarra,
      Nombre: producto.Nombre,
      Descripcion: producto.Descripcion || null,
      PrecioCompra: parseFloat(producto.PrecioCompra),
      PrecioVenta: parseFloat(producto.PrecioVenta),
      StockMinimo: parseInt(producto.StockMinimo),
      ProveedorId: producto.ProveedorId,
      Activo: producto.Activo !== undefined ? producto.Activo : true
    });
    return { Id: id, ...producto };
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    throw error;
  }
};

export const eliminarProducto = async (id) => {
  try {
    const productoRef = doc(db, 'productos', id);
    await updateDoc(productoRef, { Activo: false });
    return true;
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    throw error;
  }
};

// ==================== VENTAS ====================
export const getVentas = async () => {
  try {
    const querySnapshot = await getDocs(ventasCollection);
    
    const ventas = await Promise.all(querySnapshot.docs.map(async (doc) => {
      const venta = { Id: doc.id, ...doc.data() };
      
      const detallesQuery = query(
        detalleVentasCollection,
        where('VentaId', '==', doc.id)
      );
      const detallesSnapshot = await getDocs(detallesQuery);
      venta.TotalProductos = detallesSnapshot.size;
      
      return venta;
    }));
    
    // Ordenar en memoria por fecha descendente
    ventas.sort((a, b) => {
      const fechaA = a.Fecha instanceof Date ? a.Fecha : new Date(a.Fecha);
      const fechaB = b.Fecha instanceof Date ? b.Fecha : new Date(b.Fecha);
      return fechaB - fechaA;
    });
    
    return ventas;
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    throw error;
  }
};

export const registrarVenta = async (ventaData) => {
  try {
    const folio = generarFolio('VT');
    const subtotal = ventaData.productos.reduce((sum, item) => 
      sum + (item.Cantidad * item.PrecioUnitario), 0);
    const impuesto = subtotal * 0.13;
    const total = subtotal + impuesto;
    
    // Crear la venta
    const ventaRef = await addDoc(ventasCollection, {
      Folio: folio,
      Fecha: getCurrentTimestamp(),
      Cliente: ventaData.cliente || 'Consumidor Final',
      Subtotal: subtotal,
      Impuesto: impuesto,
      Total: total,
      Estado: 'COMPLETADA',
      MetodoPago: ventaData.metodoPago || 'EFECTIVO'
    });
    
    // Registrar detalles y actualizar stock
    for (const item of ventaData.productos) {
      // Agregar detalle
      await addDoc(detalleVentasCollection, {
        VentaId: ventaRef.id,
        ProductoId: item.ProductoId,
        Cantidad: item.Cantidad,
        PrecioUnitario: item.PrecioUnitario,
        Subtotal: item.Cantidad * item.PrecioUnitario
      });
      
      // Actualizar stock del producto
      const productoRef = doc(db, 'productos', item.ProductoId);
      const productoDoc = await getDoc(productoRef);
      if (productoDoc.exists()) {
        const stockActual = productoDoc.data().Stock || 0;
        await updateDoc(productoRef, {
          Stock: stockActual - item.Cantidad
        });
      }
    }
    
    return { 
      mensaje: 'Venta registrada', 
      ventaId: ventaRef.id, 
      folio, 
      subtotal, 
      impuesto, 
      total 
    };
  } catch (error) {
    console.error('Error al registrar venta:', error);
    throw error;
  }
};

export const anularVenta = async (ventaId) => {
  try {
    // Obtener detalles de la venta
    const detallesQuery = query(
      detalleVentasCollection,
      where('VentaId', '==', ventaId)
    );
    const detallesSnapshot = await getDocs(detallesQuery);
    
    // Devolver stock
    for (const detalleDoc of detallesSnapshot.docs) {
      const detalle = detalleDoc.data();
      const productoRef = doc(db, 'productos', detalle.ProductoId);
      const productoDoc = await getDoc(productoRef);
      if (productoDoc.exists()) {
        const stockActual = productoDoc.data().Stock || 0;
        await updateDoc(productoRef, {
          Stock: stockActual + detalle.Cantidad
        });
      }
    }
    
    // Anular venta
    const ventaRef = doc(db, 'ventas', ventaId);
    await updateDoc(ventaRef, { Estado: 'ANULADA' });
    
    return { mensaje: 'Venta anulada' };
  } catch (error) {
    console.error('Error al anular venta:', error);
    throw error;
  }
};

export const eliminarVenta = async (ventaId) => {
  try {
    // Eliminar detalles primero
    const detallesQuery = query(
      detalleVentasCollection,
      where('VentaId', '==', ventaId)
    );
    const detallesSnapshot = await getDocs(detallesQuery);
    
    for (const detalleDoc of detallesSnapshot.docs) {
      await deleteDoc(detalleDoc.ref);
    }
    
    // Eliminar venta
    await deleteDoc(doc(db, 'ventas', ventaId));
    
    return { mensaje: 'Venta eliminada' };
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    throw error;
  }
};

// ==================== COMPRAS ====================
export const getCompras = async () => {
  try {
    const querySnapshot = await getDocs(comprasCollection);
    
    const compras = await Promise.all(querySnapshot.docs.map(async (doc) => {
      const compra = { Id: doc.id, ...doc.data() };
      
      const detallesQuery = query(
        detalleComprasCollection,
        where('CompraId', '==', doc.id)
      );
      const detallesSnapshot = await getDocs(detallesQuery);
      compra.TotalProductos = detallesSnapshot.size;
      
      return compra;
    }));
    
    // Ordenar en memoria por fecha descendente
    compras.sort((a, b) => {
      const fechaA = a.Fecha instanceof Date ? a.Fecha : new Date(a.Fecha);
      const fechaB = b.Fecha instanceof Date ? b.Fecha : new Date(b.Fecha);
      return fechaB - fechaA;
    });
    
    return compras;
  } catch (error) {
    console.error('Error al obtener compras:', error);
    throw error;
  }
};

export const registrarCompra = async (compraData) => {
  try {
    const folio = generarFolio('CMP');
    const total = compraData.productos.reduce((sum, item) => 
      sum + (item.Cantidad * item.PrecioUnitario), 0);
    
    const compraRef = await addDoc(comprasCollection, {
      Folio: folio,
      Fecha: getCurrentTimestamp(),
      Total: total,
      Estado: 'COMPLETADA',
      Observaciones: compraData.observaciones || null
    });
    
    for (const item of compraData.productos) {
      await addDoc(detalleComprasCollection, {
        CompraId: compraRef.id,
        ProductoId: item.ProductoId,
        Cantidad: item.Cantidad,
        PrecioUnitario: item.PrecioUnitario,
        Subtotal: item.Cantidad * item.PrecioUnitario
      });
      
      // Actualizar producto
      const productoRef = doc(db, 'productos', item.ProductoId);
      const productoDoc = await getDoc(productoRef);
      if (productoDoc.exists()) {
        const stockActual = productoDoc.data().Stock || 0;
        await updateDoc(productoRef, {
          Stock: stockActual + item.Cantidad,
          PrecioCompra: item.PrecioUnitario
        });
      }
    }
    
    return { mensaje: 'Compra registrada', compraId: compraRef.id, folio, total };
  } catch (error) {
    console.error('Error al registrar compra:', error);
    throw error;
  }
};

export const anularCompra = async (compraId) => {
  try {
    const detallesQuery = query(
      detalleComprasCollection,
      where('CompraId', '==', compraId)
    );
    const detallesSnapshot = await getDocs(detallesQuery);
    
    for (const detalleDoc of detallesSnapshot.docs) {
      const detalle = detalleDoc.data();
      const productoRef = doc(db, 'productos', detalle.ProductoId);
      const productoDoc = await getDoc(productoRef);
      if (productoDoc.exists()) {
        const stockActual = productoDoc.data().Stock || 0;
        await updateDoc(productoRef, {
          Stock: stockActual - detalle.Cantidad
        });
      }
    }
    
    const compraRef = doc(db, 'compras', compraId);
    await updateDoc(compraRef, { Estado: 'ANULADA' });
    
    return { mensaje: 'Compra anulada' };
  } catch (error) {
    console.error('Error al anular compra:', error);
    throw error;
  }
};

export const eliminarCompra = async (compraId) => {
  try {
    const detallesQuery = query(
      detalleComprasCollection,
      where('CompraId', '==', compraId)
    );
    const detallesSnapshot = await getDocs(detallesQuery);
    
    for (const detalleDoc of detallesSnapshot.docs) {
      await deleteDoc(detalleDoc.ref);
    }
    
    await deleteDoc(doc(db, 'compras', compraId));
    
    return { mensaje: 'Compra eliminada' };
  } catch (error) {
    console.error('Error al eliminar compra:', error);
    throw error;
  }
};

// ==================== REPORTES ====================
export const getDashboardData = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ventasSnapshot = await getDocs(ventasCollection);
    
    let ventasHoy = 0;
    let numeroVentasHoy = 0;
    let ventasTotales = 0;
    
    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      const fechaVenta = venta.Fecha instanceof Date ? venta.Fecha : new Date(venta.Fecha);
      const total = venta.Total || 0;
      
      if (venta.Estado === 'COMPLETADA') {
        ventasTotales += total;
        
        if (fechaVenta && fechaVenta >= hoy) {
          ventasHoy += total;
          numeroVentasHoy++;
        }
      }
    });
    
    const productosSnapshot = await getDocs(productosCollection);
    
    let bajoStock = 0;
    productosSnapshot.forEach(doc => {
      const producto = doc.data();
      if (producto.Activo === true && (producto.Stock || 0) <= (producto.StockMinimo || 5)) {
        bajoStock++;
      }
    });
    
    const proveedoresSnapshot = await getDocs(proveedoresCollection);
    
    return {
      ventasHoy,
      numeroVentasHoy,
      productosBajoStock: bajoStock,
      totalProductos: productosSnapshot.docs.filter(doc => doc.data().Activo === true).length,
      totalProveedores: proveedoresSnapshot.size,
      ventasTotales
    };
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    throw error;
  }
};
// Obtener detalles de una venta específica
export const getDetallesVenta = async (ventaId) => {
  try {
    const detallesQuery = query(
      detalleVentasCollection,
      where('VentaId', '==', ventaId)
    );
    const detallesSnapshot = await getDocs(detallesQuery);
    
    const detalles = await Promise.all(detallesSnapshot.docs.map(async (detalleDoc) => {
      const detalle = detalleDoc.data();
      const productoRef = doc(db, 'productos', detalle.ProductoId);
      const productoDoc = await getDoc(productoRef);
      const producto = productoDoc.data();
      
      return {
        ...detalle,
        Id: detalleDoc.id,
        NombreProducto: producto?.Nombre || 'Producto no encontrado',
        CodigoBarra: producto?.CodigoBarra || 'N/A'
      };
    }));
    
    return detalles;
  } catch (error) {
    console.error('Error al obtener detalles de venta:', error);
    throw error;
  }
};