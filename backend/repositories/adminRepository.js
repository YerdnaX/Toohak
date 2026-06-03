/**
 * Repositorio de Administradores para SQL Server.
 * Descomentar las secciones de SQL y remover el código en memoria
 * cuando se migre a la base de datos real.
 */

// const { sql, getConnection } = require('../config/db');

async function getAdminById(id) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const result = await pool.request()
  //   .input('id', sql.Int, id)
  //   .query('SELECT * FROM Administradores WHERE IdAdministrador = @id');
  // return result.recordset[0] || null;

  return null; // Versión memoria: no se usa autenticación en esta demo
}

async function getAdminByUsuario(usuario) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const result = await pool.request()
  //   .input('usuario', sql.NVarChar(50), usuario)
  //   .query('SELECT * FROM Administradores WHERE Usuario = @usuario');
  // return result.recordset[0] || null;

  return null;
}

async function createAdmin(admin) {
  // TODO: SQL Server
  // const pool = await getConnection();
  // const result = await pool.request()
  //   .input('nombre', sql.NVarChar(100), admin.nombre)
  //   .input('email', sql.NVarChar(150), admin.email)
  //   .input('usuario', sql.NVarChar(50), admin.usuario)
  //   .input('contrasena', sql.NVarChar(255), admin.contrasena)
  //   .query(`
  //     INSERT INTO Administradores (Nombre, Email, Usuario, Contrasena)
  //     OUTPUT INSERTED.*
  //     VALUES (@nombre, @email, @usuario, @contrasena)
  //   `);
  // return result.recordset[0];

  return admin;
}

module.exports = { getAdminById, getAdminByUsuario, createAdmin };
