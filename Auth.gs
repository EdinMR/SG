// Auth.gs

/**
 * Autentica a un usuario.
 * @param {string} username - Nombre de usuario.
 * @param {string} password - Contraseña.
 * @return {Object} - Objeto con status y mensaje/data.
 */
function login(username, password) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Usuarios');
  if (!sheet) {
    Logger.log('ERROR: Hoja "Usuarios" no encontrada en SPREADSHEET_ID: ' + SPREADSHEET_ID);
    return { status: 'error', message: 'Error interno del servidor: Hoja de usuarios no disponible.' };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) { // Menos de 2 filas significa solo cabeceras o vacío
    return { status: 'error', message: 'No hay usuarios registrados.' };
  }

  const headers = data[0];
  const users = data.slice(1);

  const usernameColIndex = headers.indexOf('Nombre_Usuario');
  const passwordColIndex = headers.indexOf('Contraseña_Hash');
  const roleColIndex = headers.indexOf('Rol');
  const activeColIndex = headers.indexOf('Activo');

  // Validar que todas las columnas existan
  if (usernameColIndex === -1 || passwordColIndex === -1 || roleColIndex === -1 || activeColIndex === -1) {
      Logger.log('ERROR: Columnas necesarias no encontradas en la hoja Usuarios. Headers: ' + headers.join(', '));
      return { status: 'error', message: 'Error de configuración en la base de datos de usuarios: Faltan columnas.' };
  }

  for (let i = 0; i < users.length; i++) {
    const userRow = users[i];
    const storedUsername = userRow[usernameColIndex];
    const storedPasswordHash = userRow[passwordColIndex];
    const storedRole = userRow[roleColIndex];
    const isActive = userRow[activeColIndex];

    if (storedUsername === username) {
      if (isActive !== true) {
        return { status: 'error', message: 'Usuario inactivo. Contacte al administrador.' };
      }

      if (password === storedPasswordHash) {
          return { status: 'success', message: 'Login exitoso.', data: { userName: storedUsername, userRole: storedRole } };
      } else {
        return { status: 'error', message: 'Contraseña incorrecta.' };
      }
    }
  }
  return { status: 'error', message: 'Usuario no encontrado.' };
}

/**
 * Función para crear un usuario inicial por única vez (ejecutar desde el editor de Apps Script).
 * Esto te permitirá iniciar sesión con 'admin' / 'password'.
 * SOLO EJECUTA ESTO UNA VEZ Y VERIFICA QUE LAS CABECERAS DE LA HOJA 'Usuarios' SON CORRECTAS.
 */
function createInitialAdminUser() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Usuarios');
  if (!sheet) {
    Logger.log('Error: Hoja "Usuarios" no encontrada. Asegúrate de que el SPREADSHEET_ID es correcto y la hoja existe.');
    SpreadsheetApp.getUi().alert('Error', 'Hoja "Usuarios" no encontrada. Asegúrate de que el SPREADSHEET_ID es correcto y la hoja existe.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const usernameColIndex = headers.indexOf('Nombre_Usuario');
  const idColIndex = headers.indexOf('ID_Usuario');
  const emailColIndex = headers.indexOf('Email');
  const passwordColIndex = headers.indexOf('Contraseña_Hash');
  const roleColIndex = headers.indexOf('Rol');
  const fechaCreacionColIndex = headers.indexOf('Fecha_Creacion');
  const ultimoAccesoColIndex = headers.indexOf('Ultimo_Acceso');
  const activoColIndex = headers.indexOf('Activo');

  // Verificar que todas las cabeceras necesarias existan
  if ([usernameColIndex, idColIndex, emailColIndex, passwordColIndex, roleColIndex, fechaCreacionColIndex, ultimoAccesoColIndex, activoColIndex].some(idx => idx === -1)) {
    Logger.log('Error: Faltan una o más columnas necesarias en la hoja "Usuarios". Verifica las cabeceras.');
    SpreadsheetApp.getUi().alert('Error', 'Faltan una o más columnas necesarias en la hoja "Usuarios". Verifica las cabeceras.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Verificar si el usuario 'admin' ya existe
  const existingUsers = sheet.getDataRange().getValues().slice(1);
  const adminExists = existingUsers.some(row => row[usernameColIndex] === 'admin');

  if (adminExists) {
    Logger.log('El usuario "admin" ya existe. No se creará de nuevo.');
    SpreadsheetApp.getUi().alert('Información', 'El usuario "admin" ya existe. No se creará de nuevo.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const rowToAdd = Array(headers.length).fill('');
  rowToAdd[idColIndex] = 'USR001';
  rowToAdd[usernameColIndex] = 'admin';
  rowToAdd[emailColIndex] = 'admin@tutienda.com';
  rowToAdd[passwordColIndex] = 'password';
  rowToAdd[roleColIndex] = 'Administrador';
  rowToAdd[fechaCreacionColIndex] = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  rowToAdd[ultimoAccesoColIndex] = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  rowToAdd[activoColIndex] = true;

  sheet.appendRow(rowToAdd);
  Logger.log('Usuario "admin" creado con éxito (usuario: admin, contraseña: password)');
  SpreadsheetApp.getUi().alert('Éxito', 'Usuario "admin" creado con éxito (usuario: admin, contraseña: password).', SpreadsheetApp.getUi().ButtonSet.OK);
}
