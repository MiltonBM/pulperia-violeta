import React, { useState } from 'react';
import { db, proveedoresCollection, productosCollection, getCurrentTimestamp } from '../firebase';
import { addDoc } from 'firebase/firestore';

// Datos iniciales
const proveedoresIniciales = [
  { Nombre: 'Distribuidora Central', Telefono: '2222-3333', Direccion: 'San José, Centro', Email: 'ventas@central.com', FechaRegistro: getCurrentTimestamp() },
  { Nombre: 'Bebidas del Valle', Telefono: '2255-4422', Direccion: 'Cartago, Industrial', Email: 'pedidos@bebidasvalle.com', FechaRegistro: getCurrentTimestamp() },
  { Nombre: 'Lácteos Naturales', Telefono: '2277-8899', Direccion: 'Heredia, Belén', Email: 'info@lacteosnaturales.com', FechaRegistro: getCurrentTimestamp() },
  { Nombre: 'Productos del Mar', Telefono: '2288-7766', Direccion: 'Puntarenas', Email: 'ventas@mar.cr', FechaRegistro: getCurrentTimestamp() },
  { Nombre: 'Panadería Central', Telefono: '2244-5566', Direccion: 'Alajuela', Email: 'panes@central.com', FechaRegistro: getCurrentTimestamp() }
];

const productosIniciales = [
  { CodigoBarra: '75010001001', Nombre: 'Coca Cola 355ml', Descripcion: 'Gaseosa cola 355ml', PrecioCompra: 500, PrecioVenta: 700, Stock: 100, StockMinimo: 10, Activo: true, FechaCreacion: getCurrentTimestamp() },
  { CodigoBarra: '75010001002', Nombre: 'Pepsi 355ml', Descripcion: 'Gaseosa pepsi 355ml', PrecioCompra: 480, PrecioVenta: 680, Stock: 80, StockMinimo: 10, Activo: true, FechaCreacion: getCurrentTimestamp() },
  { CodigoBarra: '75020002001', Nombre: 'Leche Entera 1L', Descripcion: 'Leche pasteurizada entera', PrecioCompra: 600, PrecioVenta: 850, Stock: 50, StockMinimo: 15, Activo: true, FechaCreacion: getCurrentTimestamp() },
  { CodigoBarra: '75020002002', Nombre: 'Yogurt Fresa 1L', Descripcion: 'Yogurt sabor fresa', PrecioCompra: 700, PrecioVenta: 950, Stock: 40, StockMinimo: 10, Activo: true, FechaCreacion: getCurrentTimestamp() },
  { CodigoBarra: '75030003001', Nombre: 'Agua Mineral 600ml', Descripcion: 'Agua mineral sin gas', PrecioCompra: 300, PrecioVenta: 500, Stock: 120, StockMinimo: 20, Activo: true, FechaCreacion: getCurrentTimestamp() },
  { CodigoBarra: '75030003002', Nombre: 'Galletas Soda', Descripcion: 'Galletas soda paquete 400g', PrecioCompra: 450, PrecioVenta: 650, Stock: 60, StockMinimo: 15, Activo: true, FechaCreacion: getCurrentTimestamp() },
  { CodigoBarra: '75040004001', Nombre: 'Arroz 1kg', Descripcion: 'Arroz blanco premium', PrecioCompra: 800, PrecioVenta: 1100, Stock: 200, StockMinimo: 30, Activo: true, FechaCreacion: getCurrentTimestamp() },
  { CodigoBarra: '75040004002', Nombre: 'Frijoles 500g', Descripcion: 'Frijoles negros', PrecioCompra: 650, PrecioVenta: 900, Stock: 150, StockMinimo: 25, Activo: true, FechaCreacion: getCurrentTimestamp() },
  { CodigoBarra: '75050005001', Nombre: 'Pan Bimbo', Descripcion: 'Pan de caja blanco', PrecioCompra: 550, PrecioVenta: 800, Stock: 45, StockMinimo: 10, Activo: true, FechaCreacion: getCurrentTimestamp() },
  { CodigoBarra: '75050005002', Nombre: 'Jugo Del Valle', Descripcion: 'Jugo de naranja 1L', PrecioCompra: 400, PrecioVenta: 600, Stock: 70, StockMinimo: 12, Activo: true, FechaCreacion: getCurrentTimestamp() }
];

const InitDatabase = () => {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [contrasena, setContrasena] = useState('');
  const [intentos, setIntentos] = useState(0);

  const CONTRASENA_ADMIN = "PulperiaVioleta2024";

  const initFirestore = async () => {
    try {
      console.log('🚀 Inicializando Firestore...');
      
      const proveedoresIds = {};
      for (const proveedor of proveedoresIniciales) {
        const docRef = await addDoc(proveedoresCollection, proveedor);
        proveedoresIds[proveedor.Nombre] = docRef.id;
      }
      
      const productosConProveedor = productosIniciales.map(producto => {
        let proveedorId = '';
        if (producto.Nombre.includes('Coca') || producto.Nombre.includes('Pepsi')) {
          proveedorId = proveedoresIds['Bebidas del Valle'];
        } else if (producto.Nombre.includes('Leche') || producto.Nombre.includes('Yogurt')) {
          proveedorId = proveedoresIds['Lácteos Naturales'];
        } else if (producto.Nombre.includes('Agua') || producto.Nombre.includes('Galletas')) {
          proveedorId = proveedoresIds['Distribuidora Central'];
        } else if (producto.Nombre.includes('Arroz') || producto.Nombre.includes('Frijoles')) {
          proveedorId = proveedoresIds['Distribuidora Central'];
        } else if (producto.Nombre.includes('Pan') || producto.Nombre.includes('Jugo')) {
          proveedorId = proveedoresIds['Panadería Central'];
        }
        return { ...producto, ProveedorId: proveedorId };
      });
      
      for (const producto of productosConProveedor) {
        await addDoc(productosCollection, producto);
      }
      
      return { success: true, message: 'Base de datos creada con éxito' };
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, message: error.message };
    }
  };

  const handleInit = async () => {
    setCargando(true);
    const resultado = await initFirestore();
    if (resultado.success) {
      setMensaje(resultado.message);
      setTimeout(() => setMensaje(null), 3000);
      setMostrarModal(false);
      setContrasena('');
    } else {
      setError(resultado.message);
      setTimeout(() => setError(null), 3000);
    }
    setCargando(false);
  };

  const verificarContrasena = () => {
    if (contrasena === CONTRASENA_ADMIN) {
      setIntentos(0);
      handleInit();
    } else {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);
      setError(`❌ Contraseña incorrecta. Intento ${nuevosIntentos}/3`);
      if (nuevosIntentos >= 3) {
        setTimeout(() => {
          setMostrarModal(false);
          setContrasena('');
          setIntentos(0);
          setError('Demasiados intentos fallidos. Acceso denegado.');
          setTimeout(() => setError(null), 3000);
        }, 1000);
      }
    }
  };

  const ModalContrasena = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 10000
    }} onClick={() => setMostrarModal(false)}>
      <div style={{
        background: 'white', padding: '30px', borderRadius: '20px', width: '90%',
        maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
        <h3 style={{ color: '#667eea', marginBottom: '10px' }}>Acceso Restringido</h3>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
          Esta acción inicializará la base de datos con datos de ejemplo.
          <br /><strong>Solo personal autorizado</strong>
        </p>
        <input type="password" placeholder="Contraseña de administrador"
          value={contrasena} onChange={(e) => setContrasena(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && verificarContrasena()}
          style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0',
            borderRadius: '10px', marginBottom: '15px', fontSize: '14px' }} autoFocus />
        {error && <div style={{ backgroundColor: '#ffebee', color: '#c62828',
          padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '12px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setMostrarModal(false)} style={{ flex: 1, padding: '12px',
            background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '10px',
            cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
          <button onClick={verificarContrasena} style={{ flex: 1, padding: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white',
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Verificar</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        {mensaje && <div style={{ backgroundColor: '#4CAF50', color: 'white',
          padding: '10px', borderRadius: '5px', marginBottom: '10px', fontSize: '12px' }}>✅ {mensaje}</div>}
        {error && !error.includes('incorrecta') && <div style={{ backgroundColor: '#f44336',
          color: 'white', padding: '10px', borderRadius: '5px', marginBottom: '10px', fontSize: '12px' }}>❌ {error}</div>}
        <button onClick={() => setMostrarModal(true)} disabled={cargando}
          style={{ backgroundColor: '#FF9800', color: 'white', border: 'none',
            padding: '10px 15px', borderRadius: '5px', cursor: cargando ? 'not-allowed' : 'pointer',
            fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
          {cargando ? '🔄 Inicializando...' : '🗄️ Inicializar Base de Datos'}
        </button>
      </div>
      {mostrarModal && <ModalContrasena />}
    </>
  );
};

export default InitDatabase;