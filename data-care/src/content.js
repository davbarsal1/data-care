// Función para obtener la URL del sitio web
function getSiteUrl() {
    return window.location.hostname;
}

let esPDF = null;
let encontrado = false;
// Función para buscar enlaces a páginas de políticas de privacidad y corregirlos si es necesario
async function buscarEnlaces() {
    // Selecciona todos los enlaces en el documento
    // Selecciona todos los elementos 'a'
    const enlaces = document.querySelectorAll('a');

    // Filtra los enlaces que contienen 'privacy' en su href o en su texto
    const enlacesFiltrados = Array.from(enlaces).filter(enlace => {
    return enlace.href.includes('privacy') || enlace.textContent.includes('Privacidad');
    });

    // Mostrar los enlaces filtrados en la consola
    enlacesFiltrados.forEach(enlace => {
    console.log(enlace.href);
    });
    console.log("Enlaces:", enlaces);
    // Obtiene el contenido HTML de la página actual
    const pageContent = document.documentElement.outerHTML;
    // Itera sobre los enlaces encontrados
    for (const enlace of enlaces) {
        try {
            // Obtiene el valor del atributo href
            const href = enlace.getAttribute("href");

            // Verifica si el href es nulo
            if (!href) {
                continue; // Salta al siguiente enlace si href es nulo
            }

            // Verifica si el enlace ya ha sido analizado
            if (enlacesAnalizados.has(href)) {
                continue; // Salta al siguiente enlace
            }

            // Agrega el enlace al conjunto de enlaces analizados
            enlacesAnalizados.add(href);

            // Obtiene el texto del enlace
            const textoEnlace = enlace.textContent.trim();
            
            // Verifica si el texto del enlace contiene las palabras clave
            const contienePrivacidad = textoEnlace.toLowerCase().includes("privacidad") || textoEnlace.toLowerCase().includes("privacy");
            // Verifica si el enlace lleva a un PDF y contiene la palabra privacidad
            if (href.toLowerCase().endsWith(".pdf") && contienePrivacidad) {
                console.log(`Enlace encontrado: ${href}`);
                console.log(`Texto del enlace: ${textoEnlace}`);
                console.log("Este enlace lleva a un PDF y contiene la palabra 'privacidad' o 'privacy'.");
                const site = getSiteUrl();
                esPDF = true;
                encontrado = true;
                // Envía el enlace al background.js para que sea procesado
                console.log("El mensaje es:", { action: "processPDFLink", site, href, textoEnlace, esPDF });
                chrome.runtime.sendMessage({ action: "processPDFLink", site, href, textoEnlace, esPDF });
            } else if (contienePrivacidad) {
                // Si el enlace no es un PDF pero contiene la palabra clave, enviar el contenido de la página al background.js para análisis
                const site = getSiteUrl();
                esPDF = false;
                encontrado = true;
                console.log(`El enlace "${textoEnlace}" no lleva a un PDF pero contiene la palabra 'privacidad' o 'privacy'. Enviando el contenido de la página para análisis...`);
                
                // Enviar el contenido de la página junto con la información del enlace
                chrome.runtime.sendMessage({ action: "analyzePageContent", site, href, textoEnlace, esPDF, pageContent });
            }
            console.log("-".repeat(50));
        } catch (error) {
            console.error(`Ha ocurrido un problema con el enlace ${enlace}: ${error}`);
            // En caso de error, envía un mensaje al script de fondo con los detalles del error
            chrome.runtime.sendMessage({ error: true, errorMessage: `Error con el enlace ${enlace}: ${error.message}` });
        }
    }
}

// Función principal para iniciar la detección de políticas de privacidad y corregir los enlaces si es necesario
async function detectarPoliticasPrivacidad() {
    console.log("Comienza función para detectar políticas de privacidad");
    buscarEnlaces();
}

// Conjunto para almacenar enlaces ya analizados
const enlacesAnalizados = new Set();

// Llamar a la función principal para iniciar la detección de políticas de privacidad y corregir los enlaces si es necesario
detectarPoliticasPrivacidad();
chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        switch(message.type) {
            case "esPDF":
                console.log("Es preguntado por el popup", esPDF);
                sendResponse({esPDF});
            case "encontrado":
                console.log("Es preguntado por si es encontrado", encontrado);
                sendResponse({encontrado});
            break;
        }
    }
);
