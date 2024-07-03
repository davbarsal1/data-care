// Cargar pdf.js desde el archivo local
self.importScripts('../libs/pdf.js');
self.importScripts('../libs/pdf.worker.js');

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
        // Procesar el PDF
        fetch(message.href)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                // Usar pdf.js para extraer texto del PDF
                extractTextFromPDF(arrayBuffer).then(text => {
                    pdfContent = text;
                    console.log("Contenido del PDF extraído:", text);
                    sendResponse({ received: true });
                });
            })
            .catch(error => {
                lastError = error.message;
                console.error("Error al procesar el PDF:", error);
                sendResponse({ error: true, errorMessage: error.message });
            });
    } else if (message.action === "getLastError") {
        sendResponse({ error: getLastError() });
    } else if (message.action === "getPDFContent") {
        sendResponse({ pdfContent });
    } else {
        sendResponse({ error: "Acción no reconocida" });
    }
    return true;
});

// Función para extraer texto de un PDF usando pdf.js
async function extractTextFromPDF(arrayBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    let text = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ') + '\n';
    }

    // Convertir el texto extraído en un prompt adecuado
    const prompt = `Extracted PDF Content: \n${text}`;
    return prompt;
}

// Función para obtener los detalles del último error
function getLastError() {
    return lastError;
}
