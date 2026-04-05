import React, { useState, useEffect } from 'react';
import * as firebaseService from './services/firebaseService';
import { generarFacturaPDF, generarHistorialVentasPDF } from './services/facturaService';
import './App.css';
import InitDatabase from './components/InitDatabase';

function App() {
  const [activeTab, setActiveTab] = useState('ventas');
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  
  const [nuevoProveedor, setNuevoProveedor] = useState({ Nombre: '', Telefono: '', Direccion: '', Email: '' });
  const [nuevoProducto, setNuevoProducto] = useState({ CodigoBarra: '', Nombre: '', Descripcion: '', PrecioCompra: '', PrecioVenta: '', Stock: '', StockMinimo: '', ProveedorId: '' });
  const [nuevaCompra, setNuevaCompra] = useState({ productos: [], observaciones: '' });
  const [editandoProveedor, setEditandoProveedor] = useState(null);
  const [editandoProducto, setEditandoProducto] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [codigoEscaneado, setCodigoEscaneado] = useState('');
  const [clienteVenta, setClienteVenta] = useState('');
  const [metodoPagoVenta, setMetodoPagoVenta] = useState('EFECTIVO');
  const [buscando, setBuscando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarTodosLosDatos();
  }, []);

  const cargarTodosLosDatos = async () => {
    setCargando(true);
    try {
      console.log('🚀 Iniciando carga de datos...');
      await Promise.all([
        cargarProveedores(),
        cargarProductos(),
        cargarVentas(),
        cargarCompras(),
        cargarDashboard()
      ]);
      console.log('🎉 Todos los datos cargados correctamente');
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      alert('Error al conectar con Firebase. Verifica tu configuración.\n\nRevisa la consola (F12) para más detalles.');
    } finally {
      setCargando(false);
    }
  };

  const calcularSubtotal = () => {
    return carrito.reduce((total, item) => total + (item.Cantidad * item.PrecioVenta), 0);
  };

  const calcularIVA = () => {
    return calcularSubtotal() * 0.13;
  };

  const calcularTotalConIVA = () => {
    return calcularSubtotal() + calcularIVA();
  };

  const cargarProveedores = async () => {
    const data = await firebaseService.getProveedores();
    setProveedores(data);
  };

  const crearProveedor = async (e) => {
    e.preventDefault();
    try {
      await firebaseService.crearProveedor(nuevoProveedor);
      alert('✅ Proveedor creado');
      setNuevoProveedor({ Nombre: '', Telefono: '', Direccion: '', Email: '' });
      await cargarProveedores();
    } catch (error) {
      alert('❌ Error al crear proveedor: ' + error.message);
    }
  };

  const actualizarProveedor = async (e) => {
    e.preventDefault();
    try {
      await firebaseService.actualizarProveedor(editandoProveedor.Id, editandoProveedor);
      alert('✅ Proveedor actualizado');
      setEditandoProveedor(null);
      await cargarProveedores();
    } catch (error) {
      alert('❌ Error al actualizar proveedor: ' + error.message);
    }
  };

  const eliminarProveedor = async (id) => {
    if (window.confirm('¿Eliminar este proveedor?')) {
      try {
        await firebaseService.eliminarProveedor(id);
        alert('✅ Proveedor eliminado');
        await cargarProveedores();
      } catch (error) {
        alert('❌ Error al eliminar proveedor: ' + error.message);
      }
    }
  };

  const cargarProductos = async () => {
    const data = await firebaseService.getProductos();
    setProductos(data);
  };

  const crearProducto = async (e) => {
    e.preventDefault();
    try {
      await firebaseService.crearProducto(nuevoProducto);
      alert('✅ Producto creado');
      setNuevoProducto({ CodigoBarra: '', Nombre: '', Descripcion: '', PrecioCompra: '', PrecioVenta: '', Stock: '', StockMinimo: '', ProveedorId: '' });
      await cargarProductos();
    } catch (error) {
      alert('❌ Error al crear producto: ' + error.message);
    }
  };

  const actualizarProducto = async (e) => {
    e.preventDefault();
    try {
      await firebaseService.actualizarProducto(editandoProducto.Id, editandoProducto);
      alert('✅ Producto actualizado');
      setEditandoProducto(null);
      await cargarProductos();
    } catch (error) {
      alert('❌ Error al actualizar producto: ' + error.message);
    }
  };

  const eliminarProducto = async (id) => {
    if (window.confirm('¿Desactivar este producto?')) {
      try {
        await firebaseService.eliminarProducto(id);
        alert('✅ Producto desactivado');
        await cargarProductos();
      } catch (error) {
        alert('❌ Error al desactivar producto: ' + error.message);
      }
    }
  };

  const cargarVentas = async () => {
    const data = await firebaseService.getVentas();
    setVentas(data);
  };

  const anularVenta = async (id) => {
    if (window.confirm('¿Anular esta venta?')) {
      try {
        await firebaseService.anularVenta(id);
        alert('✅ Venta anulada');
        await Promise.all([cargarVentas(), cargarProductos(), cargarDashboard()]);
      } catch (error) {
        alert('❌ Error al anular venta: ' + error.message);
      }
    }
  };

  const eliminarVenta = async (id) => {
    if (window.confirm('¿Eliminar esta venta permanentemente?')) {
      try {
        await firebaseService.eliminarVenta(id);
        alert('✅ Venta eliminada');
        await Promise.all([cargarVentas(), cargarProductos(), cargarDashboard()]);
      } catch (error) {
        alert('❌ Error al eliminar venta: ' + error.message);
      }
    }
  };

  const generarFactura = async (venta) => {
    try {
      console.log('Generando factura para venta:', venta);
      if (!venta || !venta.Id) throw new Error('Venta no válida');
      const detalles = await firebaseService.getDetallesVenta(venta.Id);
      const empresaInfo = {
        nombre: "PULPERÍA VIOLETA",
        cedula: "3-101-123456",
        telefono: "2222-3333",
        email: "pulperia@violeta.com",
        direccion: "San José, Costa Rica"
      };
      await generarFacturaPDF(venta, detalles, empresaInfo);
      alert('✅ Factura generada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar la factura: ' + error.message);
    }
  };

  const generarReporteHistorial = async () => {
    try {
      if (ventas.length === 0) {
        alert('⚠️ No hay ventas registradas para generar el reporte');
        return;
      }
      const empresaInfo = {
        nombre: "PULPERÍA VIOLETA",
        cedula: "3-101-123456",
        telefono: "2222-3333",
        direccion: "San José, Costa Rica"
      };
      await generarHistorialVentasPDF(ventas, empresaInfo);
      alert('✅ Reporte de historial generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al generar el reporte: ' + error.message);
    }
  };

  const cargarCompras = async () => {
    const data = await firebaseService.getCompras();
    setCompras(data);
  };

  const anularCompra = async (id) => {
    if (window.confirm('¿Anular esta compra?')) {
      try {
        await firebaseService.anularCompra(id);
        alert('✅ Compra anulada');
        await Promise.all([cargarCompras(), cargarProductos()]);
      } catch (error) {
        alert('❌ Error al anular compra: ' + error.message);
      }
    }
  };

  const eliminarCompra = async (id) => {
    if (window.confirm('¿Eliminar esta compra permanentemente?')) {
      try {
        await firebaseService.eliminarCompra(id);
        alert('✅ Compra eliminada');
        await Promise.all([cargarCompras(), cargarProductos()]);
      } catch (error) {
        alert('❌ Error al eliminar compra: ' + error.message);
      }
    }
  };

  const registrarCompra = async (e) => {
    e.preventDefault();
    if (nuevaCompra.productos.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }
    try {
      await firebaseService.registrarCompra(nuevaCompra);
      alert('✅ Compra registrada');
      setNuevaCompra({ productos: [], observaciones: '' });
      await Promise.all([cargarCompras(), cargarProductos()]);
    } catch (error) {
      alert('❌ Error al registrar compra: ' + error.message);
    }
  };

  const cargarDashboard = async () => {
    const data = await firebaseService.getDashboardData();
    setDashboardData(data);
  };

  const buscarProductoPorCodigo = async (codigo) => {
    if (!codigo || codigo.length < 3) return;
    setBuscando(true);
    try {
      const producto = await firebaseService.buscarProductoPorCodigo(codigo);
      if (producto) {
        const existe = carrito.find(item => item.ProductoId === producto.Id);
        if (existe) {
          const nuevoCarrito = carrito.map(item =>
            item.ProductoId === producto.Id ? { ...item, Cantidad: item.Cantidad + 1 } : item
          );
          setCarrito(nuevoCarrito);
        } else {
          setCarrito([...carrito, {
            ProductoId: producto.Id,
            Nombre: producto.Nombre,
            Cantidad: 1,
            PrecioVenta: producto.PrecioVenta,
            Stock: producto.Stock
          }]);
        }
      } else {
        alert('❌ Producto no encontrado');
      }
    } catch (error) {
      alert('❌ Error al buscar el producto');
    } finally {
      setBuscando(false);
      setCodigoEscaneado('');
    }
  };

  const eliminarDelCarrito = (index) => {
    const nuevoCarrito = carrito.filter((_, i) => i !== index);
    setCarrito(nuevoCarrito);
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      eliminarDelCarrito(index);
      return;
    }
    const nuevoCarrito = [...carrito];
    nuevoCarrito[index].Cantidad = nuevaCantidad;
    setCarrito(nuevoCarrito);
  };

  const registrarVentaConPago = async () => {
    if (carrito.length === 0) {
      alert('⚠️ Agrega productos al carrito primero');
      return;
    }
    const subtotal = calcularSubtotal();
    const iva = calcularIVA();
    const total = calcularTotalConIVA();
    if (!window.confirm(`📊 DESGLOSE DE VENTA:\n\nSubtotal: ₡${subtotal.toLocaleString()}\nIVA (13%): ₡${iva.toLocaleString()}\nTOTAL: ₡${total.toLocaleString()}\n\n¿Registrar esta venta?`)) return;
    try {
      const ventaData = {
        productos: carrito.map(item => ({
          ProductoId: item.ProductoId,
          Cantidad: item.Cantidad,
          PrecioUnitario: item.PrecioVenta
        })),
        cliente: clienteVenta || 'Consumidor Final',
        metodoPago: metodoPagoVenta
      };
      await firebaseService.registrarVenta(ventaData);
      alert('✅ Venta registrada exitosamente');
      setCarrito([]);
      setClienteVenta('');
      setMetodoPagoVenta('EFECTIVO');
      await Promise.all([cargarVentas(), cargarProductos(), cargarDashboard()]);
    } catch (error) {
      alert('❌ Error al registrar la venta: ' + error.message);
    }
  };

  const agregarProductoACompra = () => {
    setNuevaCompra({
      ...nuevaCompra,
      productos: [...nuevaCompra.productos, { ProductoId: '', Cantidad: 1, PrecioUnitario: 0 }]
    });
  };

  const actualizarProductoCompra = (index, campo, valor) => {
    const productosActualizados = [...nuevaCompra.productos];
    productosActualizados[index][campo] = valor;
    setNuevaCompra({ ...nuevaCompra, productos: productosActualizados });
  };

  const eliminarProductoCompra = (index) => {
    const productosActualizados = nuevaCompra.productos.filter((_, i) => i !== index);
    setNuevaCompra({ ...nuevaCompra, productos: productosActualizados });
  };

  const renderProveedores = () => (
    <div>
      <div className="form-section">
        <h3>{editandoProveedor ? '✏️ Editar Proveedor' : '➕ Agregar Proveedor'}</h3>
        <form onSubmit={editandoProveedor ? actualizarProveedor : crearProveedor}>
          <input type="text" placeholder="Nombre" value={editandoProveedor ? editandoProveedor.Nombre : nuevoProveedor.Nombre} 
            onChange={e => editandoProveedor ? setEditandoProveedor({...editandoProveedor, Nombre: e.target.value}) : setNuevoProveedor({...nuevoProveedor, Nombre: e.target.value})} required />
          <input type="text" placeholder="Teléfono" value={editandoProveedor ? editandoProveedor.Telefono : nuevoProveedor.Telefono} 
            onChange={e => editandoProveedor ? setEditandoProveedor({...editandoProveedor, Telefono: e.target.value}) : setNuevoProveedor({...nuevoProveedor, Telefono: e.target.value})} />
          <input type="text" placeholder="Dirección" value={editandoProveedor ? editandoProveedor.Direccion : nuevoProveedor.Direccion} 
            onChange={e => editandoProveedor ? setEditandoProveedor({...editandoProveedor, Direccion: e.target.value}) : setNuevoProveedor({...nuevoProveedor, Direccion: e.target.value})} />
          <input type="email" placeholder="Email" value={editandoProveedor ? editandoProveedor.Email : nuevoProveedor.Email} 
            onChange={e => editandoProveedor ? setEditandoProveedor({...editandoProveedor, Email: e.target.value}) : setNuevoProveedor({...nuevoProveedor, Email: e.target.value})} />
          <div className="form-buttons">
            <button type="submit">{editandoProveedor ? '💾 Actualizar' : '💾 Guardar'}</button>
            {editandoProveedor && <button type="button" onClick={() => setEditandoProveedor(null)}>❌ Cancelar</button>}
          </div>
        </form>
      </div>
      <div className="list-section">
        <h3>📋 Lista de Proveedores</h3>
        <div className="table-responsive">
          <table>
            <thead><tr><th>ID</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr></thead>
            <tbody>
              {proveedores.map(prov => (
                <tr key={prov.Id}>
                  <td>{prov.Id}</td><td>{prov.Nombre}</td><td>{prov.Telefono}</td><td>{prov.Email}</td>
                  <td className="acciones">
                    <button className="btn-editar" onClick={() => setEditandoProveedor(prov)}>✏️</button>
                    <button className="btn-eliminar" onClick={() => eliminarProveedor(prov.Id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProductos = () => (
    <div>
      <div className="form-section">
        <h3>{editandoProducto ? '✏️ Editar Producto' : '➕ Agregar Producto'}</h3>
        <form onSubmit={editandoProducto ? actualizarProducto : crearProducto}>
          <input type="text" placeholder="Código de Barra" value={editandoProducto ? editandoProducto.CodigoBarra : nuevoProducto.CodigoBarra} 
            onChange={e => editandoProducto ? setEditandoProducto({...editandoProducto, CodigoBarra: e.target.value}) : setNuevoProducto({...nuevoProducto, CodigoBarra: e.target.value})} />
          <input type="text" placeholder="Nombre" value={editandoProducto ? editandoProducto.Nombre : nuevoProducto.Nombre} 
            onChange={e => editandoProducto ? setEditandoProducto({...editandoProducto, Nombre: e.target.value}) : setNuevoProducto({...nuevoProducto, Nombre: e.target.value})} required />
          <input type="text" placeholder="Descripción" value={editandoProducto ? editandoProducto.Descripcion : nuevoProducto.Descripcion} 
            onChange={e => editandoProducto ? setEditandoProducto({...editandoProducto, Descripcion: e.target.value}) : setNuevoProducto({...nuevoProducto, Descripcion: e.target.value})} />
          <input type="number" placeholder="Precio Compra" value={editandoProducto ? editandoProducto.PrecioCompra : nuevoProducto.PrecioCompra} 
            onChange={e => editandoProducto ? setEditandoProducto({...editandoProducto, PrecioCompra: e.target.value}) : setNuevoProducto({...nuevoProducto, PrecioCompra: e.target.value})} required />
          <input type="number" placeholder="Precio Venta" value={editandoProducto ? editandoProducto.PrecioVenta : nuevoProducto.PrecioVenta} 
            onChange={e => editandoProducto ? setEditandoProducto({...editandoProducto, PrecioVenta: e.target.value}) : setNuevoProducto({...nuevoProducto, PrecioVenta: e.target.value})} required />
          <input type="number" placeholder="Stock" value={editandoProducto ? editandoProducto.Stock : nuevoProducto.Stock} 
            onChange={e => editandoProducto ? setEditandoProducto({...editandoProducto, Stock: e.target.value}) : setNuevoProducto({...nuevoProducto, Stock: e.target.value})} />
          <input type="number" placeholder="Stock Mínimo" value={editandoProducto ? editandoProducto.StockMinimo : nuevoProducto.StockMinimo} 
            onChange={e => editandoProducto ? setEditandoProducto({...editandoProducto, StockMinimo: e.target.value}) : setNuevoProducto({...nuevoProducto, StockMinimo: e.target.value})} />
          <select value={editandoProducto ? editandoProducto.ProveedorId : nuevoProducto.ProveedorId} 
            onChange={e => editandoProducto ? setEditandoProducto({...editandoProducto, ProveedorId: e.target.value}) : setNuevoProducto({...nuevoProducto, ProveedorId: e.target.value})} required>
            <option value="">Seleccione Proveedor</option>
            {proveedores.map(prov => <option key={prov.Id} value={prov.Id}>{prov.Nombre}</option>)}
          </select>
          <div className="form-buttons">
            <button type="submit">{editandoProducto ? '💾 Actualizar' : '💾 Guardar'}</button>
            {editandoProducto && <button type="button" onClick={() => setEditandoProducto(null)}>❌ Cancelar</button>}
          </div>
        </form>
      </div>
      <div className="list-section">
        <h3>📦 Lista de Productos</h3>
        <div className="table-responsive">
          <table>
            <thead><tr><th>Código</th><th>Nombre</th><th>P. Venta</th><th>Stock</th><th>Stock Mín</th><th>Proveedor</th><th>Acciones</th></tr></thead>
            <tbody>
              {productos.map(prod => (
                <tr key={prod.Id} className={prod.Stock <= prod.StockMinimo ? 'bajo-stock' : ''}>
                  <td>{prod.CodigoBarra}</td><td>{prod.Nombre}</td><td>₡{prod.PrecioVenta}</td><td>{prod.Stock}</td><td>{prod.StockMinimo}</td><td>{prod.ProveedorNombre}</td>
                  <td className="acciones">
                    <button className="btn-editar" onClick={() => setEditandoProducto(prod)}>✏️</button>
                    <button className="btn-eliminar" onClick={() => eliminarProducto(prod.Id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderVentas = () => (
    <div className="ventas-container">
      <div className="form-section">
        <h3>🖨️ Escanear Producto</h3>
        <div className="scanner-group">
          <input type="text" placeholder="📷 Escanea o escribe el código de barras" value={codigoEscaneado}
            onChange={(e) => setCodigoEscaneado(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') buscarProductoPorCodigo(codigoEscaneado); }}
            autoFocus disabled={buscando} />
          <button onClick={() => buscarProductoPorCodigo(codigoEscaneado)} disabled={buscando}>
            {buscando ? '🔍 Buscando...' : '🔍 Buscar'}
          </button>
        </div>
        <div className="cliente-group">
          <input type="text" placeholder="Nombre del cliente (opcional)" value={clienteVenta} onChange={(e) => setClienteVenta(e.target.value)} />
          <select value={metodoPagoVenta} onChange={(e) => setMetodoPagoVenta(e.target.value)}>
            <option value="EFECTIVO">💵 Efectivo</option>
            <option value="TARJETA">💳 Tarjeta</option>
            <option value="TRANSFERENCIA">🏦 Transferencia</option>
          </select>
        </div>
      </div>
      
      <div className="carrito-section">
        <h3>🛒 Carrito de Compras</h3>
        {carrito.length === 0 ? (
          <div className="carrito-vacio"><p>📭 El carrito está vacío</p><p>Escanea productos para agregarlos</p></div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="carrito-tabla">
                <thead><tr><th>Producto</th><th>Precio Unit.</th><th>Cantidad</th><th>Subtotal</th><th>Acciones</th></tr></thead>
                <tbody>
                  {carrito.map((item, index) => (
                    <tr key={index}>
                      <td>{item.Nombre}</td>
                      <td>₡{item.PrecioVenta.toLocaleString()}</td>
                      <td><div className="cantidad-control">
                        <button onClick={() => actualizarCantidad(index, item.Cantidad - 1)}>-</button>
                        <span>{item.Cantidad}</span>
                        <button onClick={() => actualizarCantidad(index, item.Cantidad + 1)}>+</button>
                      </div></td>
                      <td>₡{(item.Cantidad * item.PrecioVenta).toLocaleString()}</td>
                      <td><button className="btn-eliminar" onClick={() => eliminarDelCarrito(index)}>🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="desglose-precios">
              <div className="linea-desglose"><span>Subtotal:</span><span>₡{calcularSubtotal().toLocaleString()}</span></div>
              <div className="linea-desglose iva"><span>IVA (13%):</span><span>₡{calcularIVA().toLocaleString()}</span></div>
              <div className="linea-desglose total"><span><strong>TOTAL A PAGAR:</strong></span><span><strong>₡{calcularTotalConIVA().toLocaleString()}</strong></span></div>
            </div>
            <div className="pago-buttons">
              <button className="btn-pagar" onClick={registrarVentaConPago}>💰 PAGAR - ₡{calcularTotalConIVA().toLocaleString()}</button>
              <button className="btn-limpiar" onClick={() => { if (window.confirm('¿Limpiar todo el carrito?')) setCarrito([]); }}>🗑️ Limpiar Carrito</button>
            </div>
          </>
        )}
      </div>
      
      <div className="list-section">
        <div className="historial-header">
          <h3>📋 Historial de Ventas</h3>
          <button className="btn-imprimir-historial" onClick={generarReporteHistorial}>🖨️ Imprimir Historial</button>
        </div>
        <div className="table-responsive">
          <table>
            <thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Método</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {ventas.map(venta => (
                <tr key={venta.Id}>
                  <td>{venta.Folio}</td>
                  <td>{venta.Fecha?.toDate ? venta.Fecha.toDate().toLocaleDateString() : new Date(venta.Fecha).toLocaleDateString()}</td>
                  <td>{venta.Cliente}</td>
                  <td>₡{venta.Total?.toLocaleString() || '0'}</td>
                  <td>{venta.MetodoPago}</td>
                  <td>{venta.Estado}</td>
                  <td className="acciones">
                    <button className="btn-factura" onClick={() => generarFactura(venta)}>🧾 Factura</button>
                    {venta.Estado === 'COMPLETADA' && (<button className="btn-anular" onClick={() => anularVenta(venta.Id)}>🚫 Anular</button>)}
                    <button className="btn-eliminar" onClick={() => eliminarVenta(venta.Id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCompras = () => (
    <div className="compras-container">
      <div className="form-section compras-form">
        <h3><span className="section-icon">📥</span> Nueva Compra</h3>
        <form onSubmit={registrarCompra}>
          <div className="form-group full-width">
            <label>📝 Observaciones</label>
            <textarea placeholder="Ej: Compra mensual, productos frescos, etc." value={nuevaCompra.observaciones} 
              onChange={e => setNuevaCompra({...nuevaCompra, observaciones: e.target.value})} rows="3" />
          </div>
          <div className="productos-compra-section">
            <label className="section-label">📦 Productos de la Compra</label>
            {nuevaCompra.productos.length === 0 ? (
              <div className="empty-products"><span>🛒</span><p>No hay productos agregados</p><small>Haz clic en "Agregar Producto" para comenzar</small></div>
            ) : (
              <div className="productos-compra-list">
                <div className="productos-compra-header">
                  <div className="col-producto">Producto</div><div className="col-cantidad">Cantidad</div>
                  <div className="col-precio">Precio Unitario</div><div className="col-subtotal">Subtotal</div><div className="col-acciones">Acciones</div>
                </div>
                {nuevaCompra.productos.map((item, index) => {
                  const productoSeleccionado = productos.find(p => p.Id === item.ProductoId);
                  const subtotal = (item.Cantidad || 0) * (item.PrecioUnitario || 0);
                  return (
                    <div key={index} className="producto-compra-item">
                      <div className="col-producto">
                        <select value={item.ProductoId} onChange={e => actualizarProductoCompra(index, 'ProductoId', e.target.value)} required>
                          <option value="">Seleccione producto</option>
                          {productos.map(prod => (<option key={prod.Id} value={prod.Id}>{prod.Nombre} - ₡{prod.PrecioVenta}</option>))}
                        </select>
                        {productoSeleccionado && (<div className="producto-detalle"><small>Stock actual: {productoSeleccionado.Stock} | Precio venta: ₡{productoSeleccionado.PrecioVenta}</small></div>)}
                      </div>
                      <div className="col-cantidad"><input type="number" placeholder="Cantidad" value={item.Cantidad} onChange={e => actualizarProductoCompra(index, 'Cantidad', parseInt(e.target.value) || 0)} required min="1" /></div>
                      <div className="col-precio"><input type="number" placeholder="Precio Unitario" value={item.PrecioUnitario} onChange={e => actualizarProductoCompra(index, 'PrecioUnitario', parseFloat(e.target.value) || 0)} required min="0" step="0.01" /></div>
                      <div className="col-subtotal"><span className="subtotal-valor">₡{subtotal.toLocaleString()}</span></div>
                      <div className="col-acciones"><button type="button" className="btn-eliminar-producto" onClick={() => eliminarProductoCompra(index)}>🗑️</button></div>
                    </div>
                  );
                })}
                <div className="compra-totales">
                  <div className="totales-linea"><span>Subtotal:</span><strong>₡{nuevaCompra.productos.reduce((sum, item) => sum + ((item.Cantidad || 0) * (item.PrecioUnitario || 0)), 0).toLocaleString()}</strong></div>
                  <div className="totales-linea total"><span>TOTAL COMPRA:</span><strong>₡{nuevaCompra.productos.reduce((sum, item) => sum + ((item.Cantidad || 0) * (item.PrecioUnitario || 0)), 0).toLocaleString()}</strong></div>
                </div>
              </div>
            )}
          </div>
          <div className="form-buttons compra-buttons">
            <button type="button" className="btn-agregar-producto" onClick={agregarProductoACompra}>➕ Agregar Producto</button>
            <button type="submit" className="btn-registrar-compra" disabled={nuevaCompra.productos.length === 0}>✅ Registrar Compra</button>
          </div>
        </form>
      </div>
      <div className="list-section compras-historial">
        <h3><span className="section-icon">📋</span> Historial de Compras</h3>
        {compras.length === 0 ? (
          <div className="empty-state"><span>📭</span><p>No hay compras registradas</p><small>Registra tu primera compra usando el formulario</small></div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead><tr><th>Folio</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th><th>Observaciones</th><th>Acciones</th></tr></thead>
              <tbody>
                {compras.map(compra => (
                  <tr key={compra.Id} className={compra.Estado === 'ANULADA' ? 'compra-anulada' : ''}>
                    <td className="folio-cell">#{compra.Folio}</td>
                    <td>{compra.Fecha?.toDate ? compra.Fecha.toDate().toLocaleDateString('es-CR') : new Date(compra.Fecha).toLocaleDateString('es-CR')}</td>
                    <td className="productos-cell"><span className="badge">{compra.TotalProductos || 0} productos</span></td>
                    <td className="total-cell">₡{compra.Total?.toLocaleString() || '0'}</td>
                    <td><span className={`estado-badge ${compra.Estado === 'COMPLETADA' ? 'estado-completada' : 'estado-anulada'}`}>{compra.Estado === 'COMPLETADA' ? '✅ Completada' : '❌ Anulada'}</span></td>
                    <td className="observaciones-cell">{compra.Observaciones || '—'}</td>
                    <td className="acciones">
                      {compra.Estado === 'COMPLETADA' && (<button className="btn-anular" onClick={() => anularCompra(compra.Id)}>🚫 Anular</button>)}
                      <button className="btn-eliminar" onClick={() => eliminarCompra(compra.Id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (cargando) return <div className="loading">Cargando datos...</div>;

  return (
    <div className="app">
      <header><h1>🏪 Pulpería Violeta - Punto de Venta</h1></header>
      {dashboardData && (
        <div className="dashboard-resumen">
          <div className="resumen-card"><span className="card-icon">💰</span><div className="card-info"><small>Ventas Hoy</small><strong>₡{dashboardData.ventasHoy?.toLocaleString() || '0'}</strong><span className="card-sub">{dashboardData.numeroVentasHoy || 0} ventas</span></div></div>
          <div className="resumen-card"><span className="card-icon">📊</span><div className="card-info"><small>Ventas Totales</small><strong>₡{dashboardData.ventasTotales?.toLocaleString() || '0'}</strong></div></div>
          <div className="resumen-card"><span className="card-icon">⚠️</span><div className="card-info"><small>Productos Bajo Stock</small><strong>{dashboardData.productosBajoStock || 0}</strong></div></div>
          <div className="resumen-card"><span className="card-icon">📦</span><div className="card-info"><small>Total Productos</small><strong>{dashboardData.totalProductos || 0}</strong></div></div>
        </div>
      )}
      <div className="tabs">
        <button className={activeTab === 'ventas' ? 'active' : ''} onClick={() => setActiveTab('ventas')}>💰 Ventas</button>
        <button className={activeTab === 'productos' ? 'active' : ''} onClick={() => setActiveTab('productos')}>📦 Productos</button>
        <button className={activeTab === 'proveedores' ? 'active' : ''} onClick={() => setActiveTab('proveedores')}>🏢 Proveedores</button>
        <button className={activeTab === 'compras' ? 'active' : ''} onClick={() => setActiveTab('compras')}>📥 Compras</button>
      </div>
      <div className="content">
        {activeTab === 'ventas' && renderVentas()}
        {activeTab === 'productos' && renderProductos()}
        {activeTab === 'proveedores' && renderProveedores()}
        {activeTab === 'compras' && renderCompras()}
      </div>
      {process.env.NODE_ENV === 'development' && <InitDatabase />}
    </div>
  );
}

export default App;