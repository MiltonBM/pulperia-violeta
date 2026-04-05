import { db, proveedoresCollection, productosCollection, getCurrentTimestamp } from '../firebase';
import { addDoc, Timestamp } from 'firebase/firestore';

// Datos iniciales
const proveedoresIniciales = [
  {
    Nombre: 'Distribuidora Central',
    Telefono: '2222-3333',
    Direccion: 'San José, Centro',
    Email: 'ventas@central.com',
    FechaRegistro: getCurrentTimestamp()
  },
  {
    Nombre: 'Bebidas del Valle',
    Telefono: '2255-4422',
    Direccion: 'Cartago, Industrial',
    Email: 'pedidos@bebidasvalle.com',
    FechaRegistro: getCurrentTimestamp()
  },
  {
    Nombre: 'Lácteos Naturales',
    Telefono: '2277-8899',
    Direccion: 'Heredia, Belén',
    Email: 'info@lacteosnaturales.com',
    FechaRegistro: getCurrentTimestamp()
  },
  {
    Nombre: 'Productos del Mar',
    Telefono: '2288-7766',
    Direccion: 'Puntarenas',
    Email: 'ventas@mar.cr',
    FechaRegistro: getCurrentTimestamp()
  },
  {
    Nombre: 'Panadería Central',
    Telefono: '2244-5566',
    Direccion: 'Alajuela',
    Email: 'panes@central.com',
    FechaRegistro: getCurrentTimestamp()
  }
];

const productosIniciales = [
  {
    CodigoBarra: '75010001001',
    Nombre: 'Coca Cola 355ml',
    Descripcion: 'Gaseosa cola 355ml',
    PrecioCompra: 500,
    PrecioVenta: 700,
    Stock: 100,
    StockMinimo: 10,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  },
  {
    CodigoBarra: '75010001002',
    Nombre: 'Pepsi 355ml',
    Descripcion: 'Gaseosa pepsi 355ml',
    PrecioCompra: 480,
    PrecioVenta: 680,
    Stock: 80,
    StockMinimo: 10,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  },
  {
    CodigoBarra: '75020002001',
    Nombre: 'Leche Entera 1L',
    Descripcion: 'Leche pasteurizada entera',
    PrecioCompra: 600,
    PrecioVenta: 850,
    Stock: 50,
    StockMinimo: 15,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  },
  {
    CodigoBarra: '75020002002',
    Nombre: 'Yogurt Fresa 1L',
    Descripcion: 'Yogurt sabor fresa',
    PrecioCompra: 700,
    PrecioVenta: 950,
    Stock: 40,
    StockMinimo: 10,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  },
  {
    CodigoBarra: '75030003001',
    Nombre: 'Agua Mineral 600ml',
    Descripcion: 'Agua mineral sin gas',
    PrecioCompra: 300,
    PrecioVenta: 500,
    Stock: 120,
    StockMinimo: 20,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  },
  {
    CodigoBarra: '75030003002',
    Nombre: 'Galletas Soda',
    Descripcion: 'Galletas soda paquete 400g',
    PrecioCompra: 450,
    PrecioVenta: 650,
    Stock: 60,
    StockMinimo: 15,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  },
  {
    CodigoBarra: '75040004001',
    Nombre: 'Arroz 1kg',
    Descripcion: 'Arroz blanco premium',
    PrecioCompra: 800,
    PrecioVenta: 1100,
    Stock: 200,
    StockMinimo: 30,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  },
  {
    CodigoBarra: '75040004002',
    Nombre: 'Frijoles 500g',
    Descripcion: 'Frijoles negros',
    PrecioCompra: 650,
    PrecioVenta: 900,
    Stock: 150,
    StockMinimo: 25,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  },
  {
    CodigoBarra: '75050005001',
    Nombre: 'Pan Bimbo',
    Descripcion: 'Pan de caja blanco',
    PrecioCompra: 550,
    PrecioVenta: 800,
    Stock: 45,
    StockMinimo: 10,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  },
  {
    CodigoBarra: '75050005002',
    Nombre: 'Jugo Del Valle',
    Descripcion: 'Jugo de naranja 1L',
    PrecioCompra: 400,
    PrecioVenta: 600,
    Stock: 70,
    StockMinimo: 12,
    Activo: true,
    FechaCreacion: getCurrentTimestamp()
  }
];

// Función para inicializar la base de datos
export const initFirestore = async () => {
  try {
    console.log('🚀 Inicializando Firestore...');
    
    // 1. Insertar proveedores
    console.log('📦 Insertando proveedores...');
    const proveedoresIds = {};
    
    for (const proveedor of proveedoresIniciales) {
      const docRef = await addDoc(proveedoresCollection, proveedor);
      proveedoresIds[proveedor.Nombre] = docRef.id;
      console.log(`✅ Proveedor ${proveedor.Nombre} creado con ID: ${docRef.id}`);
    }
    
    // 2. Insertar productos con sus ProveedorId
    console.log('📦 Insertando productos...');
    
    // Asignar ProveedorId según el producto
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
      const docRef = await addDoc(productosCollection, producto);
      console.log(`✅ Producto ${producto.Nombre} creado con ID: ${docRef.id}`);
    }
    
    console.log('🎉 Base de datos inicializada exitosamente!');
    return { success: true, message: 'Base de datos creada con éxito' };
    
  } catch (error) {
    console.error('❌ Error inicializando Firestore:', error);
    return { success: false, message: error.message };
  }
};

// Para ejecutar desde la consola del navegador
if (typeof window !== 'undefined') {
  window.initFirestore = initFirestore;
  console.log('💡 Para inicializar la BD, escribe: initFirestore()');
}