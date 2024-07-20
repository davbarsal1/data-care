// Cargar pdf.js desde el archivo local
self.importScripts('../libs/pdf.js');
self.importScripts('../libs/pdf.worker.js');

// Variable global para almacenar detalles del último error
let lastError = null;
let storedLink = null;
let pdfContent = null;
let responseAPI = null;

// Clave API de OpenAI
const OPENAI_API_KEY = '';

// Función para limpiar y optimizar el contenido HTML
function optimizarContenidoHTML(html) {
    // Eliminar etiquetas HTML innecesarias y mantener solo el texto relevante
    let contenidoLimpio = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ''); // Eliminar scripts
    contenidoLimpio = contenidoLimpio.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ''); // Eliminar estilos
    contenidoLimpio = contenidoLimpio.replace(/<!--[\s\S]*?-->/g, ''); // Eliminar comentarios
    contenidoLimpio = contenidoLimpio.replace(/<\/?(?!p\b|a\b|div\b)[^>]*>/gi, ''); // Mantener solo etiquetas p, a y div

    // Extraer el texto dentro de las etiquetas p, a y div
    const textoExtraido = contenidoLimpio.replace(/<[^>]+>/g, ' ').replace(/\s\s+/g, ' ').trim();

    return textoExtraido;
}

async function modeloLenguaje(text, esPDF, sendResponse) {
    // Optimizar el contenido antes de enviarlo
    

    let jsonPrompt = '';
    if (esPDF) {
        jsonPrompt = JSON.stringify({
            "model": "gpt-4o",
            "messages": [{ "role": "user", "content": text + "\nFormato de respuesta: Forma de contacto y los derechos." }],
            "temperature": 0.7
        });
    } else {
        const textoOptimizado = optimizarContenidoHTML(text);
        jsonPrompt = JSON.stringify({
            "model": "gpt-4o",
            "messages": [{ "role": "user", "content": textoOptimizado + "\nAnaliza este script buscando las formas de contacto y derechos de la privacidad del usuario. Si no estan esos datos ofrece el ENLACE donde se pueden obtener." }],
            "temperature": 0.7
        });
    }
    responseAPI = 'example@correo.com';

    const formasDeContactoURL = analizarRespuesta(responseAPI);
    const formasDeContactoCorreo = analizarRespuesta('example@correo.com')
    sendResponse({responseAPI, formasDeContactoCorreo})
    /*
    console.log("El jsonprompt es:", jsonPrompt);
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: jsonPrompt
    })
    .then(response => response.json())
    .then(data => {
        console.log("Se obtiene datos:", data);
        if (data.choices && data.choices.length > 0) {
            console.log("Respuesta general:", data);
            console.log("Respuesta del modelo de lenguaje:", data.choices[0].message.content);
            responseAPI = data.choices[0].message.content;
            const formasDeContacto = analizarRespuesta(responseAPI);
            console.log("Obteniendo formas de contacto:", formasDeContacto);
            sendResponse({ responseAPI, formasDeContacto });
        } else {
            throw new Error("Respuesta del modelo de lenguaje vacía o malformada");
        }
    })
    .catch(error => {
        lastError = error.message;
        console.error("Error al procesar el modelo de lenguaje:", error);
        sendResponse({ error: true, errorMessage: error.message });
    });
    */
}

// Función para analizar la respuesta y extraer formas de contacto
function analizarRespuesta(respuesta) {
    if(respuesta){
        const formasDeContacto = [];
        const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+/g;
        const phoneRegex = /\+?[0-9]{1,4}?[-.\s]?(\(?\d{1,3}?\)|\d{1,4})[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
        const urlRegex = /https?:\/\/[^\s]+/g;
    
        const emails = respuesta.match(emailRegex);
        const phones = respuesta.match(phoneRegex);
        const urls = respuesta.match(urlRegex);
    
        if (emails) formasDeContacto.push(...emails);
        if (phones) formasDeContacto.push(...phones);
        if (urls) formasDeContacto.push(...urls);
    
        return formasDeContacto;
    }
    
}

// Escucha los mensajes enviados desde el contenido del script y el popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Mensaje recibido:", message);
    if (message.error) {
        lastError = message.errorMessage;
        console.error("Error recibido:", lastError);
    }else if (message.action === "processPDFLink") {
        // Procesar el PDF
        fetch(message.href)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                // Usar pdf.js para extraer texto del PDF
                extractTextFromPDF(arrayBuffer).then(text => {
                    pdfContent = text;
                    console.log("Contenido del PDF extraído:", text);
                    modeloLenguaje(text, true, sendResponse); // Llamar a la función modeloLenguaje con esPDF = true
                });
            })
            .catch(error => {
                lastError = error.message;
                console.error("Error al procesar el PDF:", error);
                sendResponse({ error: true, errorMessage: error.message });
            });
    } else if (message.action === "analyzePageContent") {
        console.log("Se analiza el pageContent");
        modeloLenguaje(message.pageContent, false, sendResponse); // Analizar el contenido de la página
    } else if (message.action === "getLastError") {
        sendResponse({ error: getLastError() });
    } else if (message.action === "getPDFContent") {
        sendResponse({ responseAPI, formasDeContacto: analizarRespuesta(responseAPI) });
    } else if (message.action === "getPageContent") {
        console.log("Se obtiene la respuesta de la API:", responseAPI);
        console.log("Se obtiene las formas de contacto de la API:", analizarRespuesta(responseAPI));
        sendResponse({ responseAPI, formasDeContacto: analizarRespuesta(responseAPI) });
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
