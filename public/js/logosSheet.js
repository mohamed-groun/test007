let selectedFiles = [];

/* =========================================================
   HELPERS: suppression centralisée + nettoyage URLs
========================================================= */
function removeFileById(fileId) {
    const card = document.querySelector(`.preview-card[data-file-id="${fileId}"]`);
    if (card) {
        const objectUrl = card.dataset.objectUrl;
        if (objectUrl) {
            try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        }
        card.remove();
    }
    selectedFiles = selectedFiles.filter(f => f.id !== fileId);
}

/* =========================================================
   DOM READY
========================================================= */
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById('fileElem');
    const hiddenChoice = document.getElementById("id_format_choice");

    if (!fileInput) {
        console.error("❌ fileElem n'existe pas dans le DOM !");
        return;
    }

    // ✅ Un seul listener
    fileInput.addEventListener('change', async function (event) {
        const files = event.target.files;
        await handleFiles(files);
        event.target.value = "";
    });

    // -------------------- Gestion du choix de format --------------------
    function toggleAllowedFormats() {
        const selectedValue = hiddenChoice?.value;

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

    toggleAllowedFormats();

    document.querySelectorAll('.div_puce_pictos_boxes[data-type="choice"]').forEach(div => {
        div.addEventListener("click", function () {
            hiddenChoice.value = this.getAttribute("data-value");
            toggleAllowedFormats();
        });
    });

    // -------------------- Drag & Drop --------------------
    const dropArea = document.getElementById("drop-area");
    if (!dropArea) {
        console.error("❌ drop-area introuvable !");
        return;
    }

    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => e.preventDefault(), false);
        document.body.addEventListener(eventName, (e) => e.preventDefault(), false);
    });

    dropArea.addEventListener("dragover", () => dropArea.classList.add("drag-over"));
    dropArea.addEventListener("dragleave", () => dropArea.classList.remove("drag-over"));

    dropArea.addEventListener("drop", async (e) => {
        dropArea.classList.remove("drag-over");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await handleFiles(files);
        }
    });

    // -------------------- Favoris --------------------
    console.log(favoriteImages)
    if (typeof favoriteImages !== "undefined" && favoriteImages.length > 0) {
        displayFavoriteImages(favoriteImages);
    }
});

/* =========================================================
   PREVIEW: Upload images/pdf -> cards
========================================================= */
async function handleFiles(files) {
    $("#preloader").show();
    const previewDiv = document.getElementById("preview");

    for (let file of files) {
        const fileId = crypto.randomUUID();
        selectedFiles.push({ id: fileId, file });

        const card = document.createElement("div");
        card.classList.add("preview-card");
        card.dataset.fileId = fileId;

        // Input hidden pour le nom du fichier
        const fileNameInput = document.createElement("input");
        fileNameInput.type = "hidden";
        fileNameInput.name = "files_name[]";
        fileNameInput.value = file.name;
        card.appendChild(fileNameInput);

        // Navbar
        const actionBar = document.createElement("div");
        actionBar.classList.add("preview-navbar");

        const title = document.createElement("span");
        title.classList.add("small", "fw-bold");
        title.textContent = file.name;

        const btnGroup = document.createElement("div");

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.classList.add("btn", "btn-sm", "btn-secondary");
        toggleBtn.innerHTML = `<i class="fa-solid fa-minus"></i>`;

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.classList.add("btn", "btn-sm", "btn-danger");
        deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        deleteBtn.addEventListener("click", () => removeFileById(fileId));

        btnGroup.appendChild(toggleBtn);
        btnGroup.appendChild(deleteBtn);
        actionBar.appendChild(title);
        actionBar.appendChild(btnGroup);
        card.appendChild(actionBar);

        // Compact mode
        const compactRow = document.createElement("div");
        compactRow.classList.add("preview-compact", "d-none");

        const compactName = document.createElement("span");
        compactName.textContent = file.name;

        const qtyInputCompact = document.createElement("input");
        qtyInputCompact.type = "number";
        qtyInputCompact.min = 1;
        qtyInputCompact.value = 1;
        qtyInputCompact.classList.add("form-control", "compact-qty");

        compactRow.appendChild(compactName);
        compactRow.appendChild(qtyInputCompact);
        card.appendChild(compactRow);

        // Media preview + inputs
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("text-center", "mt-2");

        const container = document.createElement("div");
        container.classList.add("mt-3", "p-3");

        // Width input
        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.name = `files_info[${fileId}][width]`;
        widthInput.classList.add("form-control", "preview-input", "file-width");
        widthInput.addEventListener("input", () => updateLongueur(fileId));

        // Height input
        const heightInput = document.createElement("input");
        heightInput.type = "number";
        heightInput.name = `files_info[${fileId}][height]`;
        heightInput.classList.add("form-control", "preview-input", "file-height");
        heightInput.addEventListener("input", () => updateLargeur(fileId));

        // Quantity input
        const qtyInputFull = document.createElement("input");
        qtyInputFull.type = "number";
        qtyInputFull.min = 1;
        qtyInputFull.value = 1;
        qtyInputFull.name = `files_info[${fileId}][qty]`;
        qtyInputFull.classList.add("form-control", "preview-input", "file-qty");

        // Synchronisation compact/full
        qtyInputFull.addEventListener("input", () => qtyInputCompact.value = qtyInputFull.value);
        qtyInputCompact.addEventListener("input", () => qtyInputFull.value = qtyInputCompact.value);

        // Gestion image
        if (file.type.startsWith("image/")) {
            const img = document.createElement("img");
            const objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;
            img.classList.add("preview-img");
            imgContainer.appendChild(img);

            card.dataset.objectUrl = objectUrl;

            const dim = await getImageDimensions(file);
            if (dim) {
                widthInput.value = dim.width_cm;
                heightInput.value = dim.height_cm;

                // Calculer le ratio et le stocker
                const ratio = dim.height_cm / dim.width_cm;
                widthInput.dataset.aspectRatio = ratio;       // pour updateLongueur
                heightInput.dataset.aspectRatio = 1 / ratio;  // pour updateLargeur
            }
        }
        // Gestion PDF
        else if (file.type === "application/pdf") {
            const pdfData = await getPdfDimensionsAndThumbnail(file, 0.5);
            pdfData.canvas.classList.add("preview-img");
            imgContainer.appendChild(pdfData.canvas);

            widthInput.value = pdfData.width_cm;
            heightInput.value = pdfData.height_cm;

            const ratio = pdfData.height_cm / pdfData.width_cm;
            widthInput.dataset.aspectRatio = ratio;
            heightInput.dataset.aspectRatio = 1 / ratio;
        }

        card.appendChild(imgContainer);

        // Ajouter les inputs au container
        const widthDiv = document.createElement("div");
        widthDiv.innerHTML = `<label>Width (cm)</label>`;
        widthDiv.appendChild(widthInput);

        const heightDiv = document.createElement("div");
        heightDiv.innerHTML = `<label>Height (cm)</label>`;
        heightDiv.appendChild(heightInput);

        const qtyDiv = document.createElement("div");
        qtyDiv.innerHTML = `<label>Quantity</label>`;
        qtyDiv.appendChild(qtyInputFull);

        container.appendChild(widthDiv);
        container.appendChild(heightDiv);
        container.appendChild(qtyDiv);
        card.appendChild(container);

        // Toggle collapsed
        toggleBtn.addEventListener("click", () => {
            const collapsed = card.classList.toggle("collapsed");
            imgContainer.style.display = collapsed ? "none" : "block";
            container.style.display = collapsed ? "none" : "block";
            compactRow.classList.toggle("d-none", !collapsed);

            toggleBtn.innerHTML = collapsed
                ? `<i class="fa-solid fa-plus"></i>`
                : `<i class="fa-solid fa-minus"></i>`;
        });

        previewDiv.appendChild(card);
    }

    $("#preloader").hide();
}

// Fonctions de mise à jour
function updateLongueur(fileId) {
    const inputWidth = $(`input[name="files_info[${fileId}][width]"]`);
    const inputHeight = $(`input[name="files_info[${fileId}][height]"]`);

    const width = parseFloat(inputWidth.val());
    if (!width) return;

    const aspectRatio = parseFloat(inputWidth.data('aspect-ratio'));
    if (!aspectRatio) return;

    const newHeight = width * aspectRatio;
    inputHeight.val(newHeight.toFixed(2));
}

function updateLargeur(fileId) {
    const inputWidth = $(`input[name="files_info[${fileId}][width]"]`);
    const inputHeight = $(`input[name="files_info[${fileId}][height]"]`);

    const height = parseFloat(inputHeight.val());
    if (!height) return;

    const aspectRatio = parseFloat(inputHeight.data('aspect-ratio'));
    if (!aspectRatio) return;

    const newWidth = height * aspectRatio;
    inputWidth.val(newWidth.toFixed(2));
}

/* =========================================================
   PDF helper
========================================================= */
async function getPdfDimensionsAndThumbnail(file, scale = 1) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale });

    const widthInch = viewport.width / 72;
    const heightInch = viewport.height / 72;

    const widthCm = (widthInch * 2.54).toFixed(2);
    const heightCm = (heightInch * 2.54).toFixed(2);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    return { width_cm: widthCm, height_cm: heightCm, canvas };
}

/* =========================================================
   Favoris (inchangé)
========================================================= */
async function displayFavoriteImages(favoriteImages) {
    $("#preloader").show();
    const previewDiv = document.getElementById("preview");

    for (let i = 0; i < favoriteImages.length; i++) {
        const url = favoriteImages[i];

        // Récupérer l'image ou le PDF
        const response = await fetch(url);
        const blob = await response.blob();

        const type = blob.type || (url.endsWith('.pdf') ? 'application/pdf' : 'image/png');
        const name = `favorite-${i}${url.endsWith('.pdf') ? '.pdf' : '.png'}`;
        const file = new File([blob], name, { type });

        const fileId = crypto.randomUUID();
        selectedFiles.push({ id: fileId, file });

        // --- Création de la card ---
        const card = document.createElement("div");
        card.classList.add("preview-card");
        card.dataset.fileId = fileId;

        const fileNameInput = document.createElement("input");
        fileNameInput.type = "hidden";
        fileNameInput.name = "files_name[]";
        fileNameInput.value = file.name;
        card.appendChild(fileNameInput);

        // Navbar
        const actionBar = document.createElement("div");
        actionBar.classList.add("preview-navbar", "favorite-color");

        const title = document.createElement("span");
        title.classList.add("small", "fw-bold");
        title.textContent = file.name;

        const btnGroup = document.createElement("div");

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.classList.add("btn", "btn-sm", "btn-secondary");
        toggleBtn.innerHTML = `<i class="fa-solid fa-minus"></i>`;

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.classList.add("btn", "btn-sm", "btn-danger");
        deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        deleteBtn.addEventListener("click", () => removeFileById(fileId));

        btnGroup.appendChild(toggleBtn);
        btnGroup.appendChild(deleteBtn);
        actionBar.appendChild(title);
        actionBar.appendChild(btnGroup);
        card.appendChild(actionBar);

        // Compact mode
        const compactRow = document.createElement("div");
        compactRow.classList.add("preview-compact", "d-none");

        const compactName = document.createElement("span");
        compactName.textContent = file.name;

        const qtyInputCompact = document.createElement("input");
        qtyInputCompact.type = "number";
        qtyInputCompact.min = 1;
        qtyInputCompact.value = 1;
        qtyInputCompact.classList.add("form-control", "compact-qty");

        compactRow.appendChild(compactName);
        compactRow.appendChild(qtyInputCompact);
        card.appendChild(compactRow);

        // Media preview + inputs
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("text-center", "mt-2");

        const container = document.createElement("div");
        container.classList.add("mt-3", "p-3");

        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.name = `files_info[${fileId}][width]`;
        widthInput.classList.add("form-control", "preview-input", "file-width");
        widthInput.addEventListener("input", () => updateLongueur(fileId));

        const heightInput = document.createElement("input");
        heightInput.type = "number";
        heightInput.name = `files_info[${fileId}][height]`;
        heightInput.classList.add("form-control", "preview-input", "file-height");

        const qtyInputFull = document.createElement("input");
        qtyInputFull.type = "number";
        qtyInputFull.min = 1;
        qtyInputFull.value = 1;
        qtyInputFull.name = `files_info[${fileId}][qty]`;
        qtyInputFull.classList.add("form-control", "preview-input", "file-qty");

        qtyInputFull.addEventListener("input", () => qtyInputCompact.value = qtyInputFull.value);
        qtyInputCompact.addEventListener("input", () => qtyInputFull.value = qtyInputCompact.value);

        if (file.type.startsWith("image/")) {
            const img = document.createElement("img");
            const objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;
            img.classList.add("preview-img");
            imgContainer.appendChild(img);

            card.dataset.objectUrl = objectUrl;

            const dim = await getImageDimensions(file);
            if (dim) {
                widthInput.value = dim.width_cm;
                heightInput.value = dim.height_cm;

                // ← AJOUTER CE QUI SUIT
                const ratio = dim.height_cm / dim.width_cm;   // ratio hauteur / largeur
                widthInput.dataset.aspectRatio = ratio;       // pour updateLongueur
                heightInput.dataset.aspectRatio = 1 / ratio;  // pour updateLargeur
            }

        } else if (file.type === "application/pdf") {
            const pdfData = await getPdfDimensionsAndThumbnail(file, 0.5);
            pdfData.canvas.classList.add("preview-img");
            imgContainer.appendChild(pdfData.canvas);

            widthInput.value = pdfData.width_cm;
            heightInput.value = pdfData.height_cm;
            const ratio = pdfData.height_cm / pdfData.width_cm;
            widthInput.dataset.aspectRatio = ratio;
            heightInput.dataset.aspectRatio = 1 / ratio;

        }
        widthInput.addEventListener("input", () => updateLongueur(fileId));
        heightInput.addEventListener("input", () => updateLargeur(fileId));

        card.appendChild(imgContainer);

        const widthDiv = document.createElement("div");
        widthDiv.innerHTML = `<label>Width (cm)</label>`;
        widthDiv.appendChild(widthInput);

        const heightDiv = document.createElement("div");
        heightDiv.innerHTML = `<label>Height (cm)</label>`;
        heightDiv.appendChild(heightInput);

        const qtyDiv = document.createElement("div");
        qtyDiv.innerHTML = `<label>Quantity</label>`;
        qtyDiv.appendChild(qtyInputFull);

        container.appendChild(widthDiv);
        container.appendChild(heightDiv);
        container.appendChild(qtyDiv);
        card.appendChild(container);

        toggleBtn.addEventListener("click", () => {
            const collapsed = card.classList.toggle("collapsed");
            imgContainer.style.display = collapsed ? "none" : "block";
            container.style.display = collapsed ? "none" : "block";
            compactRow.classList.toggle("d-none", !collapsed);

            toggleBtn.innerHTML = collapsed
                ? `<i class="fa-solid fa-plus"></i>`
                : `<i class="fa-solid fa-minus"></i>`;
        });

        previewDiv.appendChild(card);
    }

    $("#preloader").hide();
}



/* =========================================================
   Image dimensions via backend
========================================================= */
async function getImageDimensions(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/image-info', { method: 'POST', body: formData });
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

/* =========================================================
   CACHES GLOBAUX
========================================================= */
const imageCache = {};
const pdfCache = {};

/* =========================================================
   SUBMIT FORM
========================================================= */
async function submitForm(action) {
    if (selectedFiles.length === 0) {
        toastr.error("Veuillez ajouter au moins une image ou PDF !");
        return;
    }
    showPreloader();

    const formData = new FormData();

    selectedFiles.forEach(item => {
        if (!item || !item.file) return;

        const card = document.querySelector(`.preview-card[data-file-id="${item.id}"]`);
        if (!card) return;

        const width  = card.querySelector('.file-width')?.value || 0;
        const height = card.querySelector('.file-height')?.value || 0;
        const qty    = card.querySelector('.file-qty')?.value || 1;

        formData.append('files[]', item.file);
        formData.append('file_ids[]', item.id);

        formData.append(`files_info[${item.id}][width]`, width);
        formData.append(`files_info[${item.id}][height]`, height);
        formData.append(`files_info[${item.id}][qty]`, qty);
    });

    const with_banner = document.getElementById('with_banner')?.checked ? 1 : 0;

    formData.append('with_banner', with_banner);
    formData.append('support', $('#support').val());
    formData.append('format-choice', document.getElementById('id_format_choice').value);
    formData.append('margin', document.getElementById('margin').value);
    formData.append('space_between_logos', document.getElementById('space_between_logos').value);

    if (action === 'preview') {
        const response = await fetch(window.routes.generatorCalculate, { method: 'POST', body: formData });
        const data = await response.json();

        if (data.status !== 'success') {
            const { message, error_vars, error_id } = data;

            let text =
                message
                ?? error_vars?.note
                ?? "Erreur inconnue";

            if (error_vars?.image_width && error_vars?.image_height) {
                text += ` (${error_vars.image_width}×${error_vars.image_height}px)`;
            }

            // 👉 Premium = warning, autres = error
            if (error_id === 'PREMIUM_REQUIRED') {
                toastr.warning(text, 'Abonnement Premium');
            } else {
                toastr.error(text, error_id ?? 'Erreur');
            }

            hidePreloader();
            return;
        }

        await renderPreview(data);

        $('#download_button').attr('data-id-file', data.id_file);
        $('#download_button').removeClass('d-none');
        $('#preview_button').addClass('d-none');
    }

    if (action === 'download') {
        const fileId = $('#download_button').attr('data-id-file');
        if (!fileId) {
            alert('Aucun fichier à télécharger');
            return;
        }

        const downloadData = new FormData();
        downloadData.append('id_file', fileId);
        downloadData.append('with_banner', with_banner);

        try {
            const response = await fetch(window.routes.generatorDownload, { method: 'POST', body: downloadData });
            if (!response.ok) throw new Error('Erreur serveur');

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'order_' + fileId + '.zip';
            document.body.appendChild(a);
            a.click();

            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert("Erreur lors du téléchargement : " + error.message);
        }
    }
    hidePreloader();
}

function showPreloader() {
    $('#preloader').css('display', 'flex'); // afficher l'élément
    setTimeout(() => {
        $('#preloader').css('opacity', '0.7'); // puis augmenter l'opacité
    }, 10); // petit délai pour que le transition fonctionne
}

function hidePreloader() {
    $('#preloader').css('opacity', '0'); // diminuer l'opacité
    setTimeout(() => {
        $('#preloader').css('display', 'none'); // puis masquer complètement
    }, 500); // délai = temps de transition CSS
}
/* =========================================================
   RENDER PREVIEW: inversed (comme PHP)
========================================================= */
function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
}
function eq2(a, b) {
    return round2(a) === round2(b);
}
function normalizeKey(u) {
    try { return new URL(String(u), window.location.origin).pathname; }
    catch { return String(u || ""); }
}


function applyInversedFromFiles(data) {
    const packingResult = data?.packingResult;
    if (!packingResult || typeof packingResult !== "object") return;

    const filesArr = Array.isArray(data?.files) ? data.files : [];

    const dimensions = new Map();
    for (const f of filesArr) {
        const key = normalizeKey(f.file || f.name || "");
        if (!key) continue;
        dimensions.set(key, { width: round2(f.width), height: round2(f.height) });
    }

    for (const supportKey in packingResult) {
        const support = packingResult[supportKey];
        const sheets = Array.isArray(support?.sheets) ? support.sheets : [];

        for (const sheet of sheets) {
            if (!Array.isArray(sheet)) continue;

            for (const item of sheet) {
                if (!item || typeof item !== "object") continue;

                const key = normalizeKey(item.name || "");
                const original = dimensions.get(key);

                if (!original) {
                    item.inversed = 0;
                    continue;
                }

                const widthJson  = round2(item.width);
                const heightJson = round2(item.height);
                const rotated = Number(item.rotated) === 1;

                if (rotated) {
                    item.inversed =
                        (eq2(widthJson, original.height) && eq2(heightJson, original.width)) ? 1 : 0;
                } else {
                    item.inversed =
                        (eq2(widthJson, original.width) && eq2(heightJson, original.height)) ? 0 : 1;
                }
            }
        }
    }
}

// ✅ rotation qui reste dans le slot w×h (pas de recouvrement)
function drawInversedFitSlot(ctx, imgOrCanvas, x, y, w, h, scale) {
    ctx.save();
    ctx.translate(x * scale, y * scale);
    ctx.rotate(Math.PI / 2);

    ctx.drawImage(
        imgOrCanvas,
        0,
        -w * scale,
        h * scale,
        w * scale
    );

    ctx.restore();
}

async function loadPdfAsCanvas(url, scale = 2) {
    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1); // première page

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: ctx,
        viewport
    }).promise;

    return canvas;
}


async function renderPreview(data) {
    console.log(data);
    applyInversedFromFiles(data);

    const container = document.getElementById('canvasContainer');
    if (!container) return;
    container.innerHTML = '';

    const packingResult = data?.packingResult;
    if (!packingResult || typeof packingResult !== 'object') {
        container.textContent = "Erreur : packingResult invalide.";
        return;
    }

    for (const supportKey in packingResult) {
        const support = packingResult[supportKey];
        const sheets = Array.isArray(support?.sheets) ? support.sheets : [];
        if (!sheets.length) continue;

        const supportGroup = document.createElement('div');
        supportGroup.className = 'support-group';
        const sheetsRow = document.createElement('div');
        sheetsRow.className = 'sheets-row';
        supportGroup.appendChild(sheetsRow);
        container.appendChild(supportGroup);

        // Cache pour détecter les sheets identiques
        const sheetCache = {};

        for (let i = 0; i < sheets.length; i++) {
            const sheet = sheets[i];
            const sheetKey = JSON.stringify(sheet);

            // Si déjà présent, incrémenter compteur et mettre à jour le texte
            if (sheetCache[sheetKey]) {
                sheetCache[sheetKey].count++;
                const subtitle = sheetCache[sheetKey].card.querySelector('.support-subtitle');
                subtitle.textContent = `Répliqué : ${sheetCache[sheetKey].count} fois`;
                continue;
            }

            // Créer la carte canvas
            const card = document.createElement('div');
            card.className = 'sheet-card';
            card.innerHTML = `
                <div class="canvas-wrapper">
                    <div class="support-presentation">
                        <div class="support-title">Format : ${supportKey}</div>
                        <div class="support-subtitle">Répliqué : 1 fois</div>
                        <div class="sheet-header">
                            <span>Nombre d'images dedans : ${sheet.length}</span>
                        </div>
                    </div>
                    <canvas></canvas>
                </div>
            `;
            sheetsRow.appendChild(card);

            // Stocker dans le cache
            sheetCache[sheetKey] = { card, count: 1 };

            const canvas = card.querySelector('canvas');
            const ctx = canvas.getContext('2d');

            // Dimensions réelles
            const supportWidth = Number(support.width);
            const supportHeight = Number(support.height);

            // Facteur d'agrandissement
            let scale = 1;
            if (supportWidth < 300) scale = 2;
            if (supportWidth < 220) scale = 3;
            if (supportWidth < 150) scale = 4;
            if (supportWidth < 110) scale = 5;

            canvas.width = supportWidth * scale;
            canvas.height = supportHeight * scale;
            canvas.style.width = `${supportWidth * scale}px`;
            canvas.style.height = `${supportHeight * scale}px`;

            const supportPresentation = card.querySelector('.support-presentation');
            supportPresentation.style.width = `${canvas.width}px`;

            // Bordure
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);

            // Dessiner les items
            for (const item of sheet) {
                const x = item.x, y = item.y, w = item.width, h = item.height;
                const url = encodeURI(item.name);

                if (!imageCache[url]) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = url;
                    imageCache[url] = new Promise(res => {
                        img.onload = () => res(img);
                        img.onerror = () => res(null);
                    });
                }

                let drawable;
                if (url.toLowerCase().endsWith('.pdf')) {
                    drawable = await loadPdfAsCanvas(url);
                } else {
                    drawable = await imageCache[url];
                }

                if (!drawable) continue;

                if (item.inversed) {
                    drawInversedFitSlot(ctx, drawable, x, y, w, h, scale);
                } else {
                    ctx.drawImage(drawable, x * scale, y * scale, w * scale, h * scale);
                }
            }

            // Ajouter la bande si demandé
            if (data.with_banner) {
                const bannerHeightPx = 38 * scale; // 1 cm ≈ 38px
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(0, canvas.height - bannerHeightPx, canvas.width, bannerHeightPx);

                ctx.fillStyle = '#ffffff';
                ctx.font = `${12 * scale}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Made with love DTF optimizer', canvas.width / 2, canvas.height - bannerHeightPx / 2);
            }

        }
    }
}

/* =========================================================
   PDF render helper (IMPORTANT: return promise)
========================================================= */
async function drawPdfOnCanvas(pdfUrl, canvas, scale = 1) {
    const ctx = canvas.getContext('2d');

    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    return page.render({
        canvasContext: ctx,
        viewport
    }).promise;
}
