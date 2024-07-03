// Variable global para almacenar detalles del último error
let lastError = null;
let storedLink = null;
let pdfContent = null;

// Escucha los mensajes enviados desde el contenido del script y el popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Mensaje recibido:", message);

    if (message.error) {
        lastError = message.errorMessage;
        console.error("Error recibido:", lastError);
    } else if (message.action === "storeLink") {
        storedLink = { site: message.site, href: message.href, textoEnlace: message.textoEnlace };
        console.log("Enlace almacenado temporalmente:", storedLink);
        sendResponse({ received: true });
    } else if (message.action === "getStoredLink") {
        sendResponse({ link: storedLink });
        storedLink = null; // Limpiar el enlace almacenado después de enviarlo
    } else if (message.action === "processPDFLink") {
          
        extractTextFromPDF("blob").then(text => {
            pdfContent = text;
            console.log("Contenido del PDF extraído:", text);
            sendResponse({ text: text });
        });
        /*
        // Procesar el PDF
        fetch(message.href)
            .then(response => response.blob())
            .then(blob => {
                // Aquí se podría usar una biblioteca como pdf-lib para leer el contenido del PDF
                // Por simplicidad, suponemos que tenemos una función extractTextFromPDF para esto
                
            })
            .catch(error => {
                lastError = error.message;
                console.error("Error al procesar el PDF:", error);
                sendResponse({ error: true, errorMessage: error.message });
            });*/
    } else if (message.action === "getLastError") {
        sendResponse({ error: getLastError() });
    } else {
        sendResponse({ error: "Acción no reconocida" });
    }
    return true;
});

// Función ficticia para extraer texto de un PDF (deberías implementar esta función con una biblioteca adecuada)
async function extractTextFromPDF(blob) {
    return "Texto extraído del PDF (implementa esta función)";
}

// Función para obtener los detalles del último error
function getLastError() {
    return lastError;
}
