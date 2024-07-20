'use strict';

let esPDF = null;
let encontrado = null;
// Function to request the last error from the background script
function requestLastError() {
    console.log("Requesting the last error");
    chrome.runtime.sendMessage({ action: "getLastError" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error requesting the last error:", chrome.runtime.lastError);
            return;
        }
        console.log("Last error response:", response);
        if (response.error) {
            document.getElementById('error-details').innerText = response.error;
            document.getElementById('error-message').style.display = 'block';
        } else {
            document.getElementById('error-message').style.display = 'none';
        }
    });
}

// Function to show the processed PDF content
function showPDFContent(contactInfo) {
    const contactInfoContainer = document.getElementById('contact-info');
    const contactInfoSection = document.getElementById('contact-info-section');
    //const reportForm = document.getElementById('report-form');
    const preguntaCorreo = document.getElementById('pregunta-correo');
    const siCorreo = document.getElementById('si-correo');
    const noCorreo = document.getElementById('no-correo');

    // Hide initially
    contactInfoSection.style.display = 'none';
    //reportForm.style.display = 'none';
    preguntaCorreo.style.display = 'none';
    siCorreo.style.display = 'none';
    noCorreo.style.display = 'none';

    setTimeout(() => {
        contactInfoContainer.innerHTML = ''; // Clear previous contact info
        document.getElementById('loading').style.display = 'none';
        if (contactInfo && contactInfo.length > 0) {
            let hasEmail = false;
            contactInfo.forEach(info => {
                const infoElement = document.createElement('p');
                infoElement.textContent = info;
                contactInfoContainer.appendChild(infoElement);
                
                const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+/g;
                const urlRegex = /https?:\/\/[^\s]+/g;
                if (info.match(urlRegex)) {
                    document.getElementById('mensaje-no-contacto').style.display = 'block';
                } else {
                    document.getElementById('titulo-contacto').style.display = 'block';
                    if (info.match(emailRegex)) {
                        hasEmail = true;
                    }
                }
            });

            if (hasEmail) {
                preguntaCorreo.style.display = 'block';
                siCorreo.style.display = 'block';
                noCorreo.style.display = 'block';
            }

            contactInfoSection.style.display = 'block';
        }/* else {
            reportForm.style.display = 'block';
        }*/
        
    }, 2000); // Wait 2 seconds before hiding the loading indicator
}

function showReportForm(){
    const reportForm = document.getElementById('report-form');
    const noEnlacesMessage = document.getElementById('no-enlaces-message');

    // Hide initially
    reportForm.style.display = 'none';
    noEnlacesMessage.style.display = 'none';

    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        noEnlacesMessage.style.display = 'block';
        reportForm.style.display = 'block';
        
    }, 2000); // Wait 2 seconds before hiding the loading indicator
}
// Function to show contact information or links
function showLink(contactInfo) {
   // const reportForm = document.getElementById('report-form');
    //const noEnlacesMessage = document.getElementById('no-enlaces-message');
    const contactInfoContainer = document.getElementById('contact-info');
    const contactInfoSection = document.getElementById('contact-info-section');
    const preguntaCorreo = document.getElementById('pregunta-correo');
    const siCorreo = document.getElementById('si-correo');
    const noCorreo = document.getElementById('no-correo');

    // Hide initially
    contactInfoSection.style.display = 'none';
    //reportForm.style.display = 'none';
    //noEnlacesMessage.style.display = 'none';
    preguntaCorreo.style.display = 'none';
    siCorreo.style.display = 'none';
    noCorreo.style.display = 'none';

    setTimeout(() => {
        contactInfoContainer.innerHTML = ''; // Clear previous contact info
        document.getElementById('loading').style.display = 'none';

        if (contactInfo && contactInfo.length > 0) {
            let hasEmail = false;
            contactInfoSection.style.display = 'block';
            contactInfo.forEach(info => {
                const infoElement = document.createElement('p');
                infoElement.textContent = info;
                contactInfoContainer.appendChild(infoElement);

                const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+/g;
                const urlRegex = /https?:\/\/[^\s]+/g;
                if (info.match(urlRegex)) {
                    document.getElementById('mensaje-no-contacto').style.display = 'block';
                } else {
                    document.getElementById('titulo-contacto').style.display = 'block';
                    if (info.match(emailRegex)) {
                        hasEmail = true;
                    }
                }
            });

            if (hasEmail) {
                preguntaCorreo.style.display = 'block';
                siCorreo.style.display = 'block';
                noCorreo.style.display = 'block';
            }
        } /*else {
            noEnlacesMessage.style.display = 'block';
            reportForm.style.display = 'block';
        }*/
    }, 2000); // Wait 2 seconds before hiding the loading indicator
}

// Function to handle report form submission
function handleReportFormSubmit(event) {
    event.preventDefault();

    const imageInput = document.getElementById('image-input');
    const reportText = document.getElementById('report-text').value;
    const formData = new FormData();

    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    formData.append('text', reportText);

    // Add the code to send form data to the server or desired destination
    // Example:
    // fetch('https://your-server.com/report', {
    //     method: 'POST',
    //     body: formData
    // }).then(response => response.json())
    // .then(data => console.log('Success:', data))
    // .catch(error => console.error('Error:', error));

    console.log('Report sent:', formData);
}

// Function to return a promise for esPDF
function getEsPDF() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "esPDF" }, function (response) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    esPDF = response.esPDF;
                    console.log("Current state of esPDF:", esPDF);
                    resolve(response.esPDF);
                }
            });
        });
    });
}
function getEncontrado() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "encontrado" }, function (response) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    encontrado = response.encontrado;
                    console.log("Current state of encontrado:", encontrado);
                    resolve(response.encontrado);
                }
            });
        });
    });
}

// Function to request the temporarily stored PDF content
function requestPDFContent() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getPDFContent" }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

// Function to request the analyzed page content
function requestPageContent() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getPageContent" }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup loaded and ready");
    document.getElementById('loading').style.display = 'block';
    console.log("Loading screen visible");
    let contactoCorreo = '';
    requestLastError();
    getEncontrado().then(encontrado => {
        if(encontrado === false){
            showReportForm();
        }else if(encontrado === true){
            getEsPDF()
            .then(esPDF => {
                if (esPDF === false) {
                    return requestPageContent();
                } else if (esPDF === true) {
                    return requestPDFContent();
                }
                throw new Error("esPDF is neither true nor false");
            })
            .then(response => {
                if (esPDF === false) {
                    showLink(response.formasDeContacto);
                } else if (esPDF === true) {
                    showPDFContent(response.formasDeContacto);
                } else {
                    showLink(null);
                }
            })
            .catch(error => {
                console.error("Content processing error:", error);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error-message').style.display = 'block';
                document.getElementById('error-details').innerText = error.message;
            });
        }else{
            throw new Error("Encontrado no es ni verdadero ni falso");
        }
    })
    
    document.getElementById('si-correo').addEventListener('click', () => {
        console.log("Ha pulsado si");
        const contactEmail = '';// Extrae el correo electrónico del DOM
        const emailContent = 'Aquí puedes personalizar el contenido del correo electrónico';
        /*
        chrome.runtime.sendMessage({
            action: 'sendEmail',
            email: contactEmail,
            content: emailContent
        });*/
    });
    document.getElementById('report-form').addEventListener('submit', handleReportFormSubmit);
});
