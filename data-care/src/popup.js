'use strict';

// Función para solicitar el último error del background script
function requestLastError() {
    console.log("Solicitando el último error");
    chrome.runtime.sendMessage({ action: "getLastError" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error al solicitar el último error:", chrome.runtime.lastError);
            return;
        }
        console.log("Respuesta del último error:", response);
        if (response.error) {
            document.getElementById('error-details').innerText = response.error;
            document.getElementById('error-message').style.display = 'block';
        } else {
            document.getElementById('error-message').style.display = 'none';
        }
    });
}

// Función para mostrar el contenido del PDF
function showPDFContent(text) {
    const pdfContentContainer = document.getElementById('pdf-content');
    const chatSection = document.getElementById('chat-section');
    const noPDFMessage = document.getElementById('no-pdf-message');
    const reportForm = document.getElementById('report-form');

    // Ocultar de antemano
    chatSection.style.display = 'none';
    reportForm.style.display = 'none';
    noPDFMessage.style.display = 'none';

    setTimeout(() => {
        pdfContentContainer.innerHTML = ''; // Limpiar el contenido anterior

        if (text) {
            pdfContentContainer.textContent = text;
            document.getElementById('pdf-section').style.display = 'block';
            noPDFMessage.style.display = 'none';
            chatSection.style.display = 'block';
            reportForm.style.display = 'none';
        } else {
            document.getElementById('pdf-section').style.display = 'none';
            noPDFMessage.style.display = 'block';
            chatSection.style.display = 'none';
            reportForm.style.display = 'block';
        }
        document.getElementById('loading').style.display = 'none';
    }, 2000); // Espera 2 segundos antes de ocultar el indicador de carga
}

// Función para mostrar el enlace de privacidad
function showLink(href, textoEnlace) {
    const enlacesContainer = document.getElementById('enlaces-no-pdf');
    const reportForm = document.getElementById('report-form');
    const noEnlacesMessage = document.getElementById('no-enlaces-message');

    // Ocultar de antemano
    reportForm.style.display = 'none';
    noEnlacesMessage.style.display = 'none';

    setTimeout(() => {
        enlacesContainer.innerHTML = ''; // Limpiar los enlaces anteriores
        document.getElementById('loading').style.display = 'none';

        if (href && textoEnlace) {
            const enlaceElement = document.createElement('a');
            enlaceElement.href = href;
            enlaceElement.textContent = textoEnlace;
            enlaceElement.target = "_blank";
            enlacesContainer.appendChild(enlaceElement);
            enlacesContainer.appendChild(document.createElement('br'));

            document.getElementById('enlaces-section').style.display = 'block';
            noEnlacesMessage.style.display = 'none';
            reportForm.style.display = 'none';
        } else {
            document.getElementById('enlaces-section').style.display = 'none';
            noEnlacesMessage.style.display = 'block';
            reportForm.style.display = 'block';
        }
    }, 2000); // Espera 2 segundos antes de ocultar el indicador de carga
}

// Función para manejar el envío del formulario de reporte
function handleReportFormSubmit(event) {
    event.preventDefault();

    const imageInput = document.getElementById('image-input');
    const reportText = document.getElementById('report-text').value;
    const formData = new FormData();

    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    formData.append('text', reportText);

    // Aquí debes agregar el código para enviar los datos del formulario al servidor o al destino deseado
    // Ejemplo:
    // fetch('https://tu-servidor.com/report', {
    //     method: 'POST',
    //     body: formData
    // }).then(response => response.json())
    // .then(data => console.log('Success:', data))
    // .catch(error => console.error('Error:', error));

    console.log('Reporte enviado:', formData);
}

// Llama a las funciones para solicitar el último error y manejar mensajes cuando el popup se carga
document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup cargado y listo");
    document.getElementById('loading').style.display = 'block';
    console.log("Pantalla de carga visible");

    requestLastError();

    // Solicitar el enlace almacenado temporalmente
    chrome.runtime.sendMessage({ action: "getStoredLink" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error al solicitar el enlace almacenado:", chrome.runtime.lastError);
            return;
        }
        if (response.link) {
            console.log("Mostrando enlace de privacidad recibido:", response.link);
            showLink(response.link.href, response.link.textoEnlace);
        } else {
            console.log("No se encontraron enlaces de privacidad almacenados.");
            showLink(null, null);
        }
    });
    chrome.runtime.sendMessage({ action: "processPDFLink" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error al solicitar el texto de pdf:", chrome.runtime.lastError);
            return;
        }
        if (response.text) {
            console.log("Mostrando texto:", response.text);
            //showLink(response.link.href, response.link.textoEnlace);
        } else {
            console.log("No se encontró texto");
            //showLink(null, null);
        }
    });

    document.getElementById('report-form').addEventListener('submit', handleReportFormSubmit);
});
