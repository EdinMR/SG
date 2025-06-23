// Código.gs (o Main.gs si lo renombraste)

// ¡IMPORTANTE! Reemplaza esto con el ID de tu Google Sheet
const SPREADSHEET_ID = '1H9RXabIT5JLbPqajV3MzRi-HqXyaSdQHLLZg7Xo9Nu8'; // <--- ¡ACTUALIZA ESTO!

/**
 * Función principal para manejar las solicitudes GET a la Web App.
 * Se usa para servir la interfaz de usuario (el index.html).
 * @param {Object} e - Objeto de evento con los parámetros de la solicitud.
 * @return {HtmlOutput} - Objeto HtmlOutput para servir la página web.
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

/**
 * Incluye un archivo HTML en otro.
 * Se usa en index.html para incrustar CSS y JS.
 * NOTA: Los archivos CSS y JS deben crearse como archivos .html en Apps Script
 * y contener sus respectivos <style> o <script> tags.
 * @param {string} filename - El nombre del archivo a incluir (sin extensión).
 * @return {string} - El contenido del archivo HTML.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Función principal para manejar las solicitudes POST a la Web App (para API).
 * Aquí se enrutan las peticiones del frontend al servicio apropiado.
 * @param {Object} e - Objeto de evento con los parámetros de la solicitud.
 * @return {ContentService.TextOutput} - Objeto TextOutput con la respuesta JSON.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  const lockAcquired = lock.tryLock(30000); // Esperar hasta 30 segundos

  if (!lockAcquired) {
    return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'El sistema está ocupado. Intente de nuevo en un momento.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  let result;
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const data = request.data;

    // Aquí se hará el enrutamiento a las funciones de servicio
    switch (action) {
      case 'login':
        // Asegúrate que el archivo Auth.gs existe y la función login está definida allí.
        result = Auth.login(data.username, data.password);
        break;
      case 'getStoreName':
        // Asegúrate que el archivo ConfigService.gs existe y la función getStoreName está definida allí.
        result = ConfigService.getStoreName();
        break;
      case 'setStoreName':
        // Asegúrate que el archivo ConfigService.gs existe y la función setStoreName está definida allí.
        result = ConfigService.setStoreName(data.name);
        break;
      default:
        result = { status: 'error', message: 'Acción no reconocida en el servidor.' };
    }
  } catch (error) {
    Logger.log(`Error en doPost: ${error.message}. Stack: ${error.stack}`);
    result = { status: 'error', message: `Error en el servidor: ${error.message}. Consulte los registros del servidor para más detalles.` };
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }

  return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
}
