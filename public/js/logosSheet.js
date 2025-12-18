let selectedFiles = [];

document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById('fileElem');
    const allowedFormatsSection = document.getElementById("allowed-formats-section");
    const hiddenChoice = document.getElementById("id_format_choice");
 //   const coupeContainer = allowedFormatsSection.querySelector(".preview-coupe-container");

    // -------------------- Upload files & preview --------------------
    if (!fileInput) {
        console.error("❌ fileElem n'existe pas dans le DOM !");
        return;
    }

    fileInput.addEventListener('change', function (event) {
        const files = event.target.files;
        handleFiles(files);
    });

    // -------------------- Gestion du choix de format --------------------
    function toggleAllowedFormats() {
        const selectedValue = hiddenChoice?.value;

        if (selectedValue === "1") {
        //    allowedFormatsSection.style.display = "none";
        } else {
            //showAllowedFormatsSection();
        }

        document.querySelectorAll('.div_puce_pictos_boxes[data-type="choice"]').forEach(div => {
            const img = div.querySelector("img");
            if (div.getAttribute("data-value") === selectedValue) {
                div.classList.add("selected");
                if (img && !img.src.includes("-selected")) {
                    img.src = img.src.replace(".svg", "-selected.svg");
                }
            } else {
                div.classList.remove("selected");
                if (img) {
                    img.src = img.src.replace("-selected.svg", ".svg");
                }
            }
        });
    }

    // Initial check
    toggleAllowedFormats();

    // Changement de choix
    document.querySelectorAll('.div_puce_pictos_boxes[data-type="choice"]').forEach(div => {
        div.addEventListener("click", function () {
            hiddenChoice.value = this.getAttribute("data-value");
            toggleAllowedFormats();
        });
    });
});

// -------------------- Fonction pour gérer preview images --------------------
async function handleFiles(files) {
    $("#preloader").show();
    const previewDiv = document.getElementById("preview");

    for (let file of files) {
        selectedFiles.push(file);
        let fileIndex = selectedFiles.length - 1;

        /* ==========================
           CARD
        =========================== */
        let card = document.createElement("div");
        card.classList.add("preview-card");

        // Hidden filename
        let fileNameInput = document.createElement("input");
        fileNameInput.type = "hidden";
        fileNameInput.name = "files_name[]";
        fileNameInput.value = file.name;
        card.appendChild(fileNameInput);

        /* ==========================
           NAVBAR
        =========================== */
        let actionBar = document.createElement("div");
        actionBar.classList.add("preview-navbar");

        let title = document.createElement("span");
        title.classList.add("small", "fw-bold");
        title.textContent = file.name;

        let btnGroup = document.createElement("div");

        let toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.classList.add("btn", "btn-sm", "btn-secondary");
        toggleBtn.innerHTML = `<i class="fa-solid fa-minus"></i>`;

        let deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.classList.add("btn", "btn-sm", "btn-danger");
        deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        deleteBtn.addEventListener("click", () => {
            card.remove();
            selectedFiles[fileIndex] = null;
        });

        btnGroup.appendChild(toggleBtn);
        btnGroup.appendChild(deleteBtn);
        actionBar.appendChild(title);
        actionBar.appendChild(btnGroup);
        card.appendChild(actionBar);

        /* ==========================
           MODE REDUIT
        =========================== */
        let compactRow = document.createElement("div");
        compactRow.classList.add("preview-compact", "d-none");

        let compactName = document.createElement("span");
        compactName.classList.add("compact-filename");
        compactName.textContent = file.name;

        let qtyInputCompact = document.createElement("input");
        qtyInputCompact.type = "number";
        qtyInputCompact.min = 1;
        qtyInputCompact.value = 1;
        qtyInputCompact.classList.add("form-control", "compact-qty");

        compactRow.appendChild(compactName);
        compactRow.appendChild(qtyInputCompact);
        card.appendChild(compactRow);

        /* ==========================
           IMAGE / PDF
        =========================== */
        let imgContainer = document.createElement("div");
        imgContainer.classList.add("text-center", "mt-2");

        let widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.name = `files_info[${fileIndex}][width]`;
        widthInput.classList.add('form-control', 'preview-input', 'file-width');

        let heightInput = document.createElement("input");
        heightInput.type = "number";
        heightInput.name = `files_info[${fileIndex}][height]`;
        heightInput.classList.add('form-control', 'preview-input', 'file-height');

        let container = document.createElement("div");
        container.classList.add("mt-3");

        if (file.type.startsWith("image/")) {
            let img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.classList.add("preview-img");
            imgContainer.appendChild(img);

            const dim = await getImageDimensions(file);
            if (dim) {
                widthInput.value = dim.width_cm;
                heightInput.value = dim.height_cm;

                if (dim.dpi) {
                    let dpiText = document.createElement("div");
                    dpiText.classList.add("text-muted", "mt-2");
                    dpiText.innerHTML = `DPI image : <strong>${dim.dpi}</strong>`;
                    container.appendChild(dpiText);
                }
            }
        } else if (file.type === "application/pdf") {
            const pdfData = await getPdfDimensionsAndThumbnail(file, 0.5);

            // Miniature PDF
            pdfData.canvas.classList.add("preview-img");
            imgContainer.appendChild(pdfData.canvas);

            // Dimensions auto
            widthInput.value = pdfData.width_cm;
            heightInput.value = pdfData.height_cm;

            // Info PDF
            let pdfInfo = document.createElement("div");
            pdfInfo.classList.add("text-muted", "mt-2");
            pdfInfo.innerHTML = `PDF – Page 1`;
            container.appendChild(pdfInfo);
        }


        card.appendChild(imgContainer);

        /* ==========================
           INPUTS NORMAUX
        =========================== */
        let widthDiv = document.createElement("div");
        widthDiv.innerHTML = `<label class="preview-label">Width (cm)</label>`;
        widthDiv.appendChild(widthInput);

        let heightDiv = document.createElement("div");
        heightDiv.innerHTML = `<label class="preview-label">Height (cm)</label>`;
        heightDiv.appendChild(heightInput);

        // Quantity normal
        let qtyInputFull = document.createElement("input");
        qtyInputFull.type = "number";
        qtyInputFull.min = 1;
        qtyInputFull.value = 1;
        qtyInputFull.name = `files_info[${fileIndex}][qty]`;
        qtyInputFull.classList.add('form-control', 'preview-input', 'file-qty');

        // Synchronisation
        qtyInputFull.addEventListener("input", () => {
            qtyInputCompact.value = qtyInputFull.value;
        });

        qtyInputCompact.addEventListener("input", () => {
            qtyInputFull.value = qtyInputCompact.value;
        });

        let qtyDiv = document.createElement("div");
        qtyDiv.innerHTML = `<label class="preview-label">Quantity</label>`;
        qtyDiv.appendChild(qtyInputFull);

        container.appendChild(widthDiv);
        container.appendChild(heightDiv);
        container.appendChild(qtyDiv);

        card.appendChild(container);

        /* ==========================
           TOGGLE
        =========================== */
        toggleBtn.addEventListener("click", () => {
            let collapsed = card.classList.toggle("collapsed");

            if (collapsed) {
                imgContainer.style.display = "none";
                container.style.display = "none";
                compactRow.classList.remove("d-none");
                toggleBtn.innerHTML = `<i class="fa-solid fa-plus"></i>`;
            } else {
                imgContainer.style.display = "block";
                container.style.display = "block";
                compactRow.classList.add("d-none");
                toggleBtn.innerHTML = `<i class="fa-solid fa-minus"></i>`;
            }
        });

        previewDiv.appendChild(card);
    }

    $("#preloader").hide();
}

async function getPdfDimensionsAndThumbnail(file, scale = 1) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale });

    // PDF units → points (1 pt = 1/72 inch)
    const widthInch = viewport.width / 72;
    const heightInch = viewport.height / 72;

    const widthCm = (widthInch * 2.54).toFixed(2);
    const heightCm = (heightInch * 2.54).toFixed(2);

    // Canvas thumbnail
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    return {
        width_cm: widthCm,
        height_cm: heightCm,
        canvas: canvas
    };
}


function addCoupeCard(defaultWidth = "", defaultHeight = "") {
    const container = document.querySelector("#allowed-formats-section .preview-coupe-container");
    if (!container) return;

    const card = document.createElement("div");
    card.classList.add("coupe-card");

    // Delete icon
    const deleteBtn = document.createElement("div");
    deleteBtn.classList.add("coupe-delete");
    deleteBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    deleteBtn.addEventListener("click", () => card.remove());
    card.appendChild(deleteBtn);

    // Image statique
    const img = document.createElement("img");
    img.src = "https://transfertdtf.com/pub/media/catalog/product/cache/4da80600c5f589dbe3543b080ae17522/d/t/dtf_uv_-_a3_27x42.png"; // <-- remplace par le chemin de ton image
    img.alt = "Image coupe";
    img.classList.add("coupe-image"); // tu peux ajouter des styles via CSS
    card.appendChild(img);

    // Width input
    const widthDiv = document.createElement("div");
    widthDiv.innerHTML = `
        <label class="coupe-label">Width (cm)</label>
        <input type="number" class="form-control coupe-input coupe-width" value="${defaultWidth}">
    `;
    card.appendChild(widthDiv);

    // Height input
    const heightDiv = document.createElement("div");
    heightDiv.innerHTML = `
        <label class="coupe-label">Height (cm)</label>
        <input type="number" class="form-control coupe-input coupe-height" value="${defaultHeight}">
    `;
    card.appendChild(heightDiv);

    // Add coupe button
/*
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-sm btn-outline-primary add-coupe-btn mt-2";
    addBtn.textContent = "Ajouter une coupe";
    addBtn.addEventListener("click", () => addCoupeCard()); // ajout dynamique
    card.appendChild(addBtn); */

    container.appendChild(card);
    return card;
}

// -------------------- Afficher la section Allowed Formats et créer une card si vide --------------------
function showAllowedFormatsSection() {
    const allowedFormatsSection = document.getElementById("allowed-formats-section");
    const coupeContainer = allowedFormatsSection.querySelector(".preview-coupe-container");

    allowedFormatsSection.style.display = "block";

    if (!coupeContainer.querySelector(".coupe-card")) {
        addCoupeCard(); // ajoute une card par défaut
    }
}

async function getImageDimensions(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/image-info', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            console.error('Erreur lors de la récupération des dimensions');
            return null;
        }

        return await response.json(); // { width_cm, height_cm }
    } catch (error) {
        console.error('Erreur fetch:', error);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const fixedBtn = document.getElementById("add-coupe-fixed-btn");
  //  fixedBtn.addEventListener("click", () => addCoupeCard());
});
document.addEventListener("DOMContentLoaded", function () {

    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("fileElem");

    if (!dropArea) {
        console.error("❌ drop-area introuvable !");
        return;
    }

    // Empêche le comportement par défaut
    ;["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => e.preventDefault(), false);
        document.body.addEventListener(eventName, (e) => e.preventDefault(), false);
    });

    // Visual feedback : survol
    dropArea.addEventListener("dragover", () => {
        dropArea.classList.add("drag-over");
    });

    // Retrait du visuel
    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("drag-over");
    });

    // Récupération des fichiers
    dropArea.addEventListener("drop", (e) => {
        dropArea.classList.remove("drag-over");
        const files = e.dataTransfer.files;

        if (files.length > 0) {
            handleFiles(files);
        }
    });
});

// -------------------- CACHES GLOBAUX --------------------
const imageCache = {};
const pdfCache = {};

// -------------------- FONCTION PRINCIPALE --------------------
async function submitForm() {

    if (selectedFiles.length === 0) {
        alert("Veuillez ajouter au moins une image ou PDF !");
        return;
    }

    const formData = new FormData();

    // -------------------- Ajouter les fichiers avec infos --------------------
    selectedFiles.forEach((file, index) => {
        if (!file) return;

        formData.append('files[]', file);

        const card = document.querySelectorAll('.preview-card')[index];
        const width = card.querySelector('.file-width')?.value || 0;
        const height = card.querySelector('.file-height')?.value || 0;
        const qty = card.querySelector('.file-qty')?.value || 1;

        formData.append(`files_info[${index}][width]`, width);
        formData.append(`files_info[${index}][height]`, height);
        formData.append(`files_info[${index}][qty]`, qty);
    });

    // -------------------- Autres champs --------------------
    formData.append('support', $('#support').val());
    formData.append('format-choice', document.getElementById('id_format_choice').value);
    formData.append('margin', document.getElementById('margin').value);
    formData.append('gouttieres', document.getElementById('gouttieres').value);

    // -------------------- Envoi Symfony --------------------
    try {
        const response = await fetch('/generator/calculate', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status !== 'success') {
            document.getElementById('response').innerHTML =
                `<p style="color: red;">Erreur serveur</p>`;
            return;
        }

        console.log(data);

        // -------------------- CANVAS --------------------
        const canvas = document.getElementById('pdfCanvas');
        const ctx = canvas.getContext('2d');

        const support = data.supports[0];

        const maxWidth = window.innerWidth * 0.8;
        const maxHeight = window.innerHeight * 0.7;

        const scale = Math.min(
            maxWidth / support.width,
            maxHeight / support.height
        );

        canvas.width = support.width * scale;
        canvas.height = support.height * scale;

        // -------------------- Fond + bordure --------------------
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // -------------------- DESSIN DES ELEMENTS --------------------
        const firstKey = Object.keys(data.packingResult)[0];
        const sheet = data.packingResult[firstKey].sheets[0];

        for (const item of sheet) {

            // -------------------- PDF --------------------
            if (item.name.endsWith('.pdf')) {

                if (!pdfCache[item.name]) {
                    const tempCanvas = document.createElement('canvas');
                    pdfCache[item.name] = drawPdfOnCanvas(item.name, tempCanvas, scale)
                        .then(() => tempCanvas);
                }

                const pdfCanvas = await pdfCache[item.name];

                ctx.drawImage(
                    pdfCanvas,
                    item.x * scale,
                    item.y * scale,
                    item.width * scale,
                    item.height * scale
                );

            }
            // -------------------- IMAGE --------------------
            else {

                if (!imageCache[item.name]) {
                    const img = new Image();
                    img.src = item.name;

                    imageCache[item.name] = new Promise((resolve) => {
                        img.onload = () => resolve(img);
                    });
                }

                const img = await imageCache[item.name];

                if (item.rotated) {
                    ctx.save();
                    ctx.translate(
                        (item.x + item.width / 2) * scale,
                        (item.y + item.height / 2) * scale
                    );
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(
                        img,
                        -item.height / 2 * scale,
                        -item.width / 2 * scale,
                        item.height * scale,
                        item.width * scale
                    );
                    ctx.restore();
                } else {
                    ctx.drawImage(
                        img,
                        item.x * scale,
                        item.y * scale,
                        item.width * scale,
                        item.height * scale
                    );
                }
            }
        }

    } catch (error) {
        console.error(error);
        document.getElementById('response').innerHTML =
            `<p style="color: red;">Erreur lors de l'envoi</p>`;
    }
}

async function drawPdfOnCanvas(pdfUrl, canvas, scale = 1) {
    const ctx = canvas.getContext('2d');

    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdf.getPage(1); // première page

    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;
}


