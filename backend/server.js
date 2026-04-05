const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middlewares
app.use(cors());
app.use(express.json());

// Servir frontend en producción
if (isProduction) {
    const buildPaths = [
        path.join(__dirname, 'build'),
        path.join(__dirname, '../build'),
        path.join(process.cwd(), 'build')
    ];
    
    let buildPath = null;
    for (const bp of buildPaths) {
        if (fs.existsSync(bp)) {
            buildPath = bp;
            break;
        }
    }
    
    if (buildPath) {
        console.log(`📁 Sirviendo frontend desde: ${buildPath}`);
        app.use(express.static(buildPath));
        app.get('*', (req, res) => {
            if (!req.path.startsWith('/api')) {
                res.sendFile(path.join(buildPath, 'index.html'));
            }
        });
    }
}

// Funciones auxiliares
function generarFolio(tipo) {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const aleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${tipo}-${año}${mes}${dia}-${aleatorio}`;
}

// Health check (simplificado sin base de datos)
app.get('/api/health', async (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// ==================== PROVEEDORES ====================
// NOTA: Estos endpoints requieren una base de datos PostgreSQL
// Por ahora están comentados hasta que configures tu base de datos

/*
app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, COUNT(pr.Id) as "TotalProductos" 
            FROM "Proveedores" p
            LEFT JOIN "Productos" pr ON p.Id = pr."ProveedorId" AND pr.Activo = true
            GROUP BY p.Id, p.Nombre, p.Telefono, p.Direccion, p.Email, p."FechaRegistro"
            ORDER BY p.Nombre
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/proveedores', async (req, res) => {
    const { Nombre, Telefono, Direccion, Email } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO "Proveedores" (Nombre, Telefono, Direccion, Email) 
             VALUES ($1, $2, $3, $4) RETURNING Id`,
            [Nombre, Telefono || null, Direccion || null, Email || null]
        );
        res.status(201).json({ mensaje: 'Proveedor creado', id: result.rows[0].Id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/proveedores/:id', async (req, res) => {
    const { Nombre, Telefono, Direccion, Email } = req.body;
    try {
        await pool.query(
            `UPDATE "Proveedores" SET Nombre=$1, Telefono=$2, Direccion=$3, Email=$4 WHERE Id=$5`,
            [Nombre, Telefono, Direccion, Email, req.params.id]
        );
        res.json({ mensaje: 'Proveedor actualizado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/proveedores/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM "Proveedores" WHERE Id=$1`, [req.params.id]);
        res.json({ mensaje: 'Proveedor eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== PRODUCTOS ====================
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, pr.Nombre as "ProveedorNombre"
            FROM "Productos" p
            LEFT JOIN "Proveedores" pr ON p."ProveedorId" = pr.Id
            WHERE p.Activo = true
            ORDER BY p.Nombre
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/productos/buscar/:codigo', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM "Productos" 
             WHERE ("CodigoBarra" = $1 OR CAST(Id AS VARCHAR) = $1) AND Activo = true`,
            [req.params.codigo]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/productos', async (req, res) => {
    const { CodigoBarra, Nombre, Descripcion, PrecioCompra, PrecioVenta, Stock, StockMinimo, ProveedorId } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO "Productos" ("CodigoBarra", Nombre, Descripcion, "PrecioCompra", "PrecioVenta", Stock, "StockMinimo", "ProveedorId") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING Id`,
            [CodigoBarra, Nombre, Descripcion || null, PrecioCompra, PrecioVenta, Stock || 0, StockMinimo || 5, ProveedorId || null]
        );
        res.status(201).json({ mensaje: 'Producto creado', id: result.rows[0].Id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/productos/:id', async (req, res) => {
    const { CodigoBarra, Nombre, Descripcion, PrecioCompra, PrecioVenta, StockMinimo, ProveedorId, Activo } = req.body;
    try {
        await pool.query(
            `UPDATE "Productos" SET 
                "CodigoBarra"=$1, Nombre=$2, Descripcion=$3, "PrecioCompra"=$4, "PrecioVenta"=$5,
                "StockMinimo"=$6, "ProveedorId"=$7, Activo=$8
             WHERE Id=$9`,
            [CodigoBarra, Nombre, Descripcion || null, PrecioCompra, PrecioVenta, StockMinimo, ProveedorId || null, Activo !== undefined ? Activo : true, req.params.id]
        );
        res.json({ mensaje: 'Producto actualizado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    try {
        await pool.query(`UPDATE "Productos" SET Activo = false WHERE Id=$1`, [req.params.id]);
        res.json({ mensaje: 'Producto desactivado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== VENTAS ====================
app.get('/api/ventas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.*, COUNT(dv.Id) as "TotalProductos"
            FROM "Ventas" v
            LEFT JOIN "Detalle_Ventas" dv ON v.Id = dv."VentaId"
            GROUP BY v.Id, v.Folio, v.Fecha, v.Cliente, v.Subtotal, v.Impuesto, v.Total, v.Estado, v."MetodoPago"
            ORDER BY v.Fecha DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ventas', async (req, res) => {
    const { productos, cliente, metodoPago } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        let subtotal = 0;
        for (const item of productos) {
            subtotal += item.Cantidad * item.PrecioUnitario;
        }
        const impuesto = subtotal * 0.13;
        const total = subtotal + impuesto;
        
        // Verificar stock
        for (const item of productos) {
            const stockCheck = await client.query(
                'SELECT Stock, Nombre FROM "Productos" WHERE Id = $1 AND Activo = true',
                [item.ProductoId]
            );
            if (stockCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: `Producto no encontrado` });
            }
            if (stockCheck.rows[0].stock < item.Cantidad) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Stock insuficiente para ${stockCheck.rows[0].nombre}` });
            }
        }
        
        const folio = generarFolio('VT');
        const ventaResult = await client.query(
            `INSERT INTO "Ventas" (Folio, Cliente, Subtotal, Impuesto, Total, "MetodoPago") 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING Id`,
            [folio, cliente || 'Consumidor Final', subtotal, impuesto, total, metodoPago || 'EFECTIVO']
        );
        
        const ventaId = ventaResult.rows[0].Id;
        
        for (const item of productos) {
            const subtotalItem = item.Cantidad * item.PrecioUnitario;
            await client.query(
                `INSERT INTO "Detalle_Ventas" ("VentaId", "ProductoId", Cantidad, "PrecioUnitario", Subtotal) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [ventaId, item.ProductoId, item.Cantidad, item.PrecioUnitario, subtotalItem]
            );
            await client.query(
                `UPDATE "Productos" SET Stock = Stock - $1 WHERE Id = $2`,
                [item.Cantidad, item.ProductoId]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json({ mensaje: 'Venta registrada', ventaId, folio, subtotal, impuesto, total });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/ventas/:id/anular', async (req, res) => {
    try {
        const detalles = await pool.query(
            `SELECT "ProductoId", Cantidad FROM "Detalle_Ventas" WHERE "VentaId" = $1`,
            [req.params.id]
        );
        for (const item of detalles.rows) {
            await pool.query(`UPDATE "Productos" SET Stock = Stock + $1 WHERE Id = $2`, [item.Cantidad, item.ProductoId]);
        }
        await pool.query(`UPDATE "Ventas" SET Estado = 'ANULADA' WHERE Id = $1`, [req.params.id]);
        res.json({ mensaje: 'Venta anulada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== COMPRAS ====================
app.get('/api/compras', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, COUNT(dc.Id) as "TotalProductos"
            FROM "Compras" c
            LEFT JOIN "Detalle_Compras" dc ON c.Id = dc."CompraId"
            GROUP BY c.Id, c.Folio, c.Fecha, c.Total, c.Estado, c.Observaciones
            ORDER BY c.Fecha DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/compras', async (req, res) => {
    const { productos, observaciones } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        let total = 0;
        for (const item of productos) {
            total += item.Cantidad * item.PrecioUnitario;
        }
        
        const folio = generarFolio('CMP');
        const compraResult = await client.query(
            `INSERT INTO "Compras" (Folio, Total, Observaciones) VALUES ($1, $2, $3) RETURNING Id`,
            [folio, total, observaciones || null]
        );
        
        const compraId = compraResult.rows[0].Id;
        
        for (const item of productos) {
            const subtotal = item.Cantidad * item.PrecioUnitario;
            await client.query(
                `INSERT INTO "Detalle_Compras" ("CompraId", "ProductoId", Cantidad, "PrecioUnitario", Subtotal) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [compraId, item.ProductoId, item.Cantidad, item.PrecioUnitario, subtotal]
            );
            await client.query(
                `UPDATE "Productos" SET Stock = Stock + $1, "PrecioCompra" = $2 WHERE Id = $3`,
                [item.Cantidad, item.PrecioUnitario, item.ProductoId]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json({ mensaje: 'Compra registrada', compraId, folio, total });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ==================== REPORTES ====================
app.get('/api/reportes/dashboard', async (req, res) => {
    try {
        const ventasHoy = await pool.query(`
            SELECT COALESCE(SUM(Total), 0) as "TotalVentas", COUNT(*) as "NumeroVentas"
            FROM "Ventas"
            WHERE DATE(Fecha) = CURRENT_DATE AND Estado = 'COMPLETADA'
        `);
        const bajoStock = await pool.query(`SELECT COUNT(*) as Total FROM "Productos" WHERE Stock <= "StockMinimo" AND Activo = true`);
        const totalProductos = await pool.query(`SELECT COUNT(*) as Total FROM "Productos" WHERE Activo = true`);
        const totalProveedores = await pool.query(`SELECT COUNT(*) as Total FROM "Proveedores"`);
        
        res.json({
            ventasHoy: parseFloat(ventasHoy.rows[0].TotalVentas),
            numeroVentasHoy: parseInt(ventasHoy.rows[0].NumeroVentas),
            productosBajoStock: parseInt(bajoStock.rows[0].total),
            totalProductos: parseInt(totalProductos.rows[0].total),
            totalProveedores: parseInt(totalProveedores.rows[0].total)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reportes/ventas-diarias', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DATE(Fecha) as Fecha, COUNT(*) as "NumeroVentas", COALESCE(SUM(Total), 0) as "TotalVentas"
            FROM "Ventas" WHERE Estado = 'COMPLETADA' AND Fecha >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(Fecha) ORDER BY Fecha DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
*/

// Ruta de prueba simple
app.get('/api/test', (req, res) => {
    res.json({ mensaje: 'API funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📦 Modo: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
    
});