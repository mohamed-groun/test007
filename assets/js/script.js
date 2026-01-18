let fileCounter = 0;
let order_lines = {};

document.addEventListener("DOMContentLoaded", function () {
    const formatChoiceRadios = document.querySelectorAll('input[name="format-choice"]');
    const allowedFormatsSection = document.getElementById("allowed-formats-section");

 /*   function toggleAllowedFormats() {
        const selectedValue = document.querySelector('input[name="format-choice"]:checked')?.value;
        if (selectedValue === "1") {
            allowedFormatsSection.style.display = "none";
            document.querySelectorAll('input[name="format-support[]"]').forEach(el => el.checked = false);
        } else {
            allowedFormatsSection.style.display = "block";
        }
    }

    // Initial toggle in case there's a pre-selected value
    toggleAllowedFormats();

    // Attach change event to both radio buttons
    formatChoiceRadios.forEach(radio => {
        radio.addEventListener("change", toggleAllowedFormats);
    });*/
});
document.addEventListener('DOMContentLoaded', function () {
    const bandeau = document.querySelector('.highlighted');
    const mobileContainer = document.querySelector('.mobile-container');

    if (bandeau && mobileContainer) {
        mobileContainer.classList.add('has-bandeau');
    } else if (mobileContainer) {
        mobileContainer.classList.add('no-bandeau');
    }
});
/*
document.getElementById('drop-area').addEventListener('dragover', e => e.preventDefault());
document.getElementById('drop-area').addEventListener('drop', async function handleDrop(e) {
    e.preventDefault();
    await handleFiles(e.dataTransfer.files); // attendre avant de continuer
});
document.getElementById('fileElem').addEventListener('change', async (e) => {
    await handleFiles(e.target.files);
});
*/


async function handleFiles(files) {

    $("#preloader").show();
    const errorDiv = document.getElementById('error-image');
    errorDiv.innerHTML = ``;
    const preview = document.getElementById('preview');
    var boolError = false;
    let fileCounter = document.querySelectorAll('.image-box').length;

    // Liste des fichiers déjà ajoutés (par nom)
    const existingFileNames = Array.from(
        document.querySelectorAll('input[type="hidden"][name^="images"]')
    ).map(input => input.value);

    // Filtrage uniquement PNG et exclusion des doublons AVANT l’envoi
    const filteredPNGs = Array.from(files).filter(file =>
        file.type === "image/png" &&
        !existingFileNames.includes(file.name)
    );

    // S'il y a des PNG, on fait la partie upload + DPI
    if (filteredPNGs.length > 0) {
        var results = await uploadAndGetDPI(filteredPNGs);
        let errorString = '';


        if (boolError) {
            //     showErrorsModal(errorString);
            $("#preloader").hide();
            //     return; // Arrête seulement si des PNG ont échoué
        }
    }

    // Tableau pour stocker les promesses de traitement
    const fileProcessingPromises = [];

    for (const file of files) {
        // Ne garder que les images PNG ou PDF
        if (file.type !== "image/png" && file.type !== "application/pdf") continue;

        // Vérifie si le fichier a échoué dans results
        if (file.type === "image/png") {
            //     const failedResult = results.find(r => r.filename === file.name && r.success === false);
            //      if (failedResult) continue;
        }

        // Empêcher les doublons par nom
        if (existingFileNames.includes(file.name)) {
            showErrorsModal(`${leFichier} "${file.name}" ${dejaAjouter}`);
            continue;
        }

        // Promesse pour chaque fichier
        const filePromise = new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                (async () => {
                    try {
                        let DPI = 300;
                        if (file.type === "image/png") {
                            const img = new Image();
                            img.onload = function () {
                                results.forEach(result => {
                                    if (result.success == false && file.name == result.filename) {
                                        DPI = result.DPI
                                    }
                                });
                                const widthCm = (img.width * 2.54 / DPI).toFixed(2);
                                const heightCm = (img.height * 2.54 / DPI).toFixed(2);
                                // 📌 Création miniature
                                const MAX_WIDTH = 150;  // px
                                const MAX_HEIGHT = 150; // px
                                let thumbWidth = img.width;
                                let thumbHeight = img.height;
                                if (thumbWidth > thumbHeight) {
                                    if (thumbWidth > MAX_WIDTH) {
                                        thumbHeight *= MAX_WIDTH / thumbWidth;
                                        thumbWidth = MAX_WIDTH;
                                    }
                                } else {
                                    if (thumbHeight > MAX_HEIGHT) {
                                        thumbWidth *= MAX_HEIGHT / thumbHeight;
                                        thumbHeight = MAX_HEIGHT;
                                    }
                                }

                                const canvas = document.createElement("canvas");
                                canvas.width = thumbWidth;
                                canvas.height = thumbHeight;
                                const ctx = canvas.getContext("2d");
                                // Dessine d'abord l'image sur le canvas
                                ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);

                               // Vérifie s'il y a de la transparence
                                const imageData = ctx.getImageData(0, 0, thumbWidth, thumbHeight);
                                const data = imageData.data;
                                let hasTransparency = false;

                                for (let i = 3; i < data.length; i += 4) {
                                    if (data[i] < 255) {
                                        hasTransparency = true;
                                        break;
                                    }
                                }

                                if (hasTransparency) {
                                    // Efface le canvas
                                    ctx.clearRect(0, 0, thumbWidth, thumbHeight);

                                    // Taille d’un carré du damier
                                    const tileSize = 8; // on peux ajuster (plus grand = carreaux plus visibles)

                                    // Dessine le damier gris/blanc
                                    for (let y = 0; y < thumbHeight; y += tileSize) {
                                        for (let x = 0; x < thumbWidth; x += tileSize) {
                                            if ((x / tileSize + y / tileSize) % 2 === 0) {
                                                ctx.fillStyle = "#ddd"; // gris clair
                                            } else {
                                                ctx.fillStyle = "#fff"; // blanc
                                            }
                                            ctx.fillRect(x, y, tileSize, tileSize);
                                        }
                                    }

                                    // Redessine l'image au-dessus du damier
                                    ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
                                } else {
                                    //    console.log("⚪ Image opaque : pas de fond ajouté.");
                                }

                                const thumbnailDataUrl = canvas.toDataURL("image/png");

                                const box = document.createElement('div');
                                box.className = 'image-box';

                                var display = 'none';
                                var dpi_current_image;
                                results.forEach(result => {
                                    if (result.success == false && file.name == result.filename) {
                                        display = 'flex';
                                        dpi_current_image = result.DPI;
                                    }
                                });
                                box.innerHTML = `<div class="png-warning" style="display:${display}"><div id=""
     class="infobulle_css bulletip bulletip-effect-3 infobulle_css_support">
    <a href=""class="icon-eco bulletip-item propriete_a_la_suite cacher_si_div_vide man">
        ⚠️
    </a>
    <div class="infobulle_css_contenu bulletip-content clearfix">
    <p style="font-size: 16px;"><strong>${Resolution_insuffisante}</strong></p>
    <p style="font-size: 14px;font-weight: 300;"  > ${Resolution_insuffisante1}</p> 
    <p style="font-size: 14px;font-weight: 300;"> ${Resolution_insuffisante2}</p> 
    <ul>
      <li style="line-height: 1.1;font-size: 14px;font-weight: 300;"> ${Resolution_insuffisante3}</li>
      <li style="line-height: 1.1;font-size: 14px;font-weight: 300;"> ${Resolution_insuffisante4}</li>
      <li style="line-height: 1.1;font-size: 14px;font-weight: 300;"> ${Resolution_insuffisante5} <b> ${dpi_current_image} </b> </li>
    </ul>
    </div>
</div>
</div><div class="delete-btn delete-svg-container" onclick="deleteImage(this)">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="21.856" height="26.64" viewBox="0 0 14.856 19.64"  fill="#a7a7a7">
    <defs>
        <clipPath id="clip-path">
            <rect  width="21.856" height="26.64" transform="translate(0 0)"/>
        </clipPath>
    </defs>
    <g id="Groupe_84" data-name="Groupe 84" clip-path="url(#clip-path)">
        <path id="Tracé_14" data-name="Tracé 14" d="M5.824,27.388q-.179-3.1-.357-6.2c-.008-.141,0-.283-.023-.422-.039-.286.081-.383.364-.382q6.012.008,12.024,0c.281,0,.384.09.367.379q-.258,4.363-.5,8.726c-.08,1.406-.149,2.812-.242,4.217a3.516,3.516,0,0,1-.2,1.076A1.955,1.955,0,0,1,15.348,36.1q-3.526.021-7.052,0a2.067,2.067,0,0,1-2.077-1.967C6.094,32.33,6,30.524,5.9,28.718q-.039-.665-.077-1.33h0m11.23-5.881H6.609c0,.157-.007.3,0,.434q.131,2.352.265,4.7.2,3.617.411,7.235A1.064,1.064,0,0,0,8.5,35.007h6.7a1.055,1.055,0,0,0,1.16-1.079c.034-.5.053-.995.082-1.493q.215-3.747.431-7.494c.065-1.134.124-2.269.188-3.435" transform="translate(-4.392 -16.471)"/>
        <path id="Tracé_15" data-name="Tracé 15" d="M3.782,1.929c0-.233,0-.417,0-.6A1.283,1.283,0,0,1,5.039.015q2.389-.031,4.779,0a1.275,1.275,0,0,1,1.256,1.312c0,.183,0,.367,0,.585.134.006.25.016.365.016.932,0,1.864,0,2.8,0,.378,0,.59.173.619.48A.526.526,0,0,1,14.418,3a1.983,1.983,0,0,1-.356.018H.766c-.076,0-.152,0-.227,0A.539.539,0,0,1,0,2.446a.52.52,0,0,1,.556-.513c.845-.008,1.69,0,2.536,0h.689m6.17-.018c.009-.09.02-.163.022-.236.012-.569.012-.569-.57-.569H5.574c-.738,0-.738,0-.681.74,0,.018.02.036.038.066Z" transform="translate(0 0.001)"/>
        <path id="Tracé_16" data-name="Tracé 16" d="M23.982,42.065q.065,1.949.13,3.9a.558.558,0,0,1-.4.63c-.367.114-.683-.148-.7-.585-.048-1.4-.09-2.794-.135-4.191q-.06-1.852-.122-3.7a.557.557,0,0,1,.4-.631c.373-.113.683.148.7.585.046,1.332.087,2.664.129,4h0" transform="translate(-18.388 -30.261)"/>
        <path id="Tracé_17" data-name="Tracé 17" d="M48.764,42.057q-.065,1.966-.13,3.932c-.014.416-.226.666-.555.66-.344-.007-.552-.275-.538-.708q.125-3.9.253-7.8c.014-.428.217-.659.558-.653s.546.248.534.668c-.037,1.3-.082,2.6-.124,3.9h0" transform="translate(-38.407 -30.287)"/>
        <path id="Tracé_18" data-name="Tracé 18" d="M36.931,42.08q0,1.9,0,3.8a1.412,1.412,0,0,1-.025.354.538.538,0,0,1-1.05-.031,1.261,1.261,0,0,1-.014-.259q0-3.88,0-7.76a1.945,1.945,0,0,1,.007-.227.539.539,0,0,1,1.072,0,2.9,2.9,0,0,1,.012.357q0,1.883,0,3.767" transform="translate(-28.954 -30.277)"/>
    </g>
</svg>
</div>
 <div>
    <div style="min-height: 14rem; display: flex; align-items: center; justify-content: center;">
        <img src="${thumbnailDataUrl}" alt="${file.name}" class="img-responsive">
    </div>
    <input type="hidden" name="images[${fileCounter}][name]" value="${file.name}">

    <label class="fs-4 fw-600">${LARGEUR_CM}</label>
    <input type="number" class="form-control input-sm" name="images[${fileCounter}][width]" value="${widthCm}" data-aspect-ratio="${heightCm / widthCm}" oninput="updateLongueur(${fileCounter})">

    <label class="fs-4 fw-600">${LONGEUR_CM}</label>
    <input type="number" class="form-control input-sm" name="images[${fileCounter}][height]" value="${heightCm}" data-aspect-ratio="${widthCm / heightCm}" oninput="updateLargeur(${fileCounter})">

    <label class="fs-4 fw-600">${QUANTITY}</label>
    <input type="number" class="form-control input-sm" name="images[${fileCounter}][quantity]" value="1" min="1">
</div>`;
                                const dt = new DataTransfer();
                                dt.items.add(file);
                                const inputFile = document.createElement('input');
                                inputFile.type = 'file';
                                inputFile.name = `files[]`;
                                inputFile.files = dt.files;
                                inputFile.style.display = 'none';
                                box.appendChild(inputFile);
                                preview.appendChild(box);
                                reindexImages();
                                resolve();
                            };
                            img.src = e.target.result;

                        } else if (file.type === "application/pdf") {
                            const CM_PER_PT = 0.0352778;
                            const readerPdf = new FileReader();

                            readerPdf.onload = async function (e) {
                                try {
                                    const arrayBuffer = e.target.result;

                                    // 1) Charger PDF avec pdf-lib pour infos (pages, taille)
                                    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                                    const pageCount = pdfDoc.getPageCount();

                                    if (pageCount > 1) {
                                        showErrorsModal(sprintf(ERROR1, file.name));
                                        resolve();
                                        return;
                                    }

                                    const firstPage = pdfDoc.getPage(0);
                                    const {width, height} = firstPage.getSize();
                                    const widthCm = (width * CM_PER_PT).toFixed(2);
                                    const heightCm = (height * CM_PER_PT).toFixed(2);

                                    // 2) Charger pdf.js pour rendre la première page
                                    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
                                    const pdf = await loadingTask.promise;
                                    const page = await pdf.getPage(1);

                                    const viewport = page.getViewport({scale: 1.5});
                                    const canvas = document.createElement('canvas');
                                    const context = canvas.getContext('2d');
                                    canvas.width = viewport.width;
                                    canvas.height = viewport.height;

                                    const renderContext = {
                                        canvasContext: context,
                                        viewport: viewport
                                    };

                                    await page.render(renderContext).promise;

                                    // 3) Générer la miniature
                                    const thumbnailCanvas = document.createElement('canvas');
                                    const thumbnailContext = thumbnailCanvas.getContext('2d');

                                    const maxThumbWidth = 150; // largeur max en pixels
                                    const scale = maxThumbWidth / canvas.width;
                                    thumbnailCanvas.width = maxThumbWidth;
                                    thumbnailCanvas.height = canvas.height * scale;

                                    thumbnailContext.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
                                    const thumbDataUrl = thumbnailCanvas.toDataURL('image/png');

                                    // 4) Créer la box de prévisualisation avec la miniature
                                    const box = document.createElement('div');
                                    box.className = 'image-box';

                                    box.innerHTML = `
<div class="delete-btn delete-svg-container" onclick="deleteImage(this)">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="21.856" height="26.64" viewBox="0 0 14.856 19.64"  fill="#a7a7a7">
    <defs>
        <clipPath id="clip-path">
            <rect  width="21.856" height="26.64" transform="translate(0 0)"/>
        </clipPath>
    </defs>
    <g id="Groupe_84" data-name="Groupe 84" clip-path="url(#clip-path)">
        <path id="Tracé_14" data-name="Tracé 14" d="M5.824,27.388q-.179-3.1-.357-6.2c-.008-.141,0-.283-.023-.422-.039-.286.081-.383.364-.382q6.012.008,12.024,0c.281,0,.384.09.367.379q-.258,4.363-.5,8.726c-.08,1.406-.149,2.812-.242,4.217a3.516,3.516,0,0,1-.2,1.076A1.955,1.955,0,0,1,15.348,36.1q-3.526.021-7.052,0a2.067,2.067,0,0,1-2.077-1.967C6.094,32.33,6,30.524,5.9,28.718q-.039-.665-.077-1.33h0m11.23-5.881H6.609c0,.157-.007.3,0,.434q.131,2.352.265,4.7.2,3.617.411,7.235A1.064,1.064,0,0,0,8.5,35.007h6.7a1.055,1.055,0,0,0,1.16-1.079c.034-.5.053-.995.082-1.493q.215-3.747.431-7.494c.065-1.134.124-2.269.188-3.435" transform="translate(-4.392 -16.471)"/>
        <path id="Tracé_15" data-name="Tracé 15" d="M3.782,1.929c0-.233,0-.417,0-.6A1.283,1.283,0,0,1,5.039.015q2.389-.031,4.779,0a1.275,1.275,0,0,1,1.256,1.312c0,.183,0,.367,0,.585.134.006.25.016.365.016.932,0,1.864,0,2.8,0,.378,0,.59.173.619.48A.526.526,0,0,1,14.418,3a1.983,1.983,0,0,1-.356.018H.766c-.076,0-.152,0-.227,0A.539.539,0,0,1,0,2.446a.52.52,0,0,1,.556-.513c.845-.008,1.69,0,2.536,0h.689m6.17-.018c.009-.09.02-.163.022-.236.012-.569.012-.569-.57-.569H5.574c-.738,0-.738,0-.681.74,0,.018.02.036.038.066Z" transform="translate(0 0.001)"/>
        <path id="Tracé_16" data-name="Tracé 16" d="M23.982,42.065q.065,1.949.13,3.9a.558.558,0,0,1-.4.63c-.367.114-.683-.148-.7-.585-.048-1.4-.09-2.794-.135-4.191q-.06-1.852-.122-3.7a.557.557,0,0,1,.4-.631c.373-.113.683.148.7.585.046,1.332.087,2.664.129,4h0" transform="translate(-18.388 -30.261)"/>
        <path id="Tracé_17" data-name="Tracé 17" d="M48.764,42.057q-.065,1.966-.13,3.932c-.014.416-.226.666-.555.66-.344-.007-.552-.275-.538-.708q.125-3.9.253-7.8c.014-.428.217-.659.558-.653s.546.248.534.668c-.037,1.3-.082,2.6-.124,3.9h0" transform="translate(-38.407 -30.287)"/>
        <path id="Tracé_18" data-name="Tracé 18" d="M36.931,42.08q0,1.9,0,3.8a1.412,1.412,0,0,1-.025.354.538.538,0,0,1-1.05-.031,1.261,1.261,0,0,1-.014-.259q0-3.88,0-7.76a1.945,1.945,0,0,1,.007-.227.539.539,0,0,1,1.072,0,2.9,2.9,0,0,1,.012.357q0,1.883,0,3.767" transform="translate(-28.954 -30.277)"/>
    </g>
</svg>
</div>
<div>
    <div style="min-height: 14rem; display: flex; align-items: center; justify-content: center;">
        <img src="${thumbDataUrl}" alt="${file.name}" class="img-responsive" />
    </div>
    <input type="hidden" name="images[${fileCounter}][name]" value="${file.name}">

    <label class="fs-4 fw-600">${LARGEUR_CM}</label>
    <input type="number" class="form-control input-sm" name="images[${fileCounter}][width]" value="${widthCm}" data-aspect-ratio="${heightCm / widthCm}" oninput="updateLongueur(${fileCounter})" >

    <label class="fs-4 fw-600">${LONGEUR_CM}</label>
    <input type="number" class="form-control input-sm" name="images[${fileCounter}][height]" value="${heightCm}" data-aspect-ratio="${widthCm / heightCm}" oninput="updateLargeur(${fileCounter})">

    <label class="fs-4 fw-600">${QUANTITY}</label>
    <input type="number" class="form-control input-sm" name="images[${fileCounter}][quantity]" value="1" min="1">
</div>
                                    `;

                                    const dt = new DataTransfer();
                                    dt.items.add(file);
                                    const inputFile = document.createElement('input');
                                    inputFile.type = 'file';
                                    inputFile.name = `files[]`;
                                    inputFile.files = dt.files;
                                    inputFile.style.display = 'none';

                                    box.appendChild(inputFile);
                                    preview.appendChild(box);
                                    reindexImages();

                                    resolve();

                                } catch (error) {
                                    showErrorsModal(showErrorsModal(sprintf(ERROR2, file.name)));
                                    console.error(error);
                                    resolve();
                                }
                            };

                            readerPdf.readAsArrayBuffer(file);
                        } else {
                            resolve();
                        }

                    } catch (error) {
                        reject(error);
                    }
                })();
            };

            reader.readAsDataURL(file);
        });

        fileProcessingPromises.push(filePromise);
    }

    // Attendre que tous les fichiers soient traités
    await Promise.all(fileProcessingPromises);

    // Tout est affiché, on cache le préloader
    $("#preloader").hide();

    // Réinitialiser l'input pour pouvoir recharger le même fichier ensuite
    const fileInput = document.getElementById('fileElem');
    if (fileInput) {
        fileInput.value = '';
    }
}

function sprintf(format, ...args) {
    let i = 0;
    return format.replace(/%s/g, () => args[i++]);
}

function updateLongueur(fileCounter) {
    const inputWidth = $('input[name="images[' + fileCounter + '][width]"]');
    const inputHeight = $('input[name="images[' + fileCounter + '][height]"]');

    const width = parseFloat(inputWidth.val());
    if (!width) return;

    // Récupérer le ratio d’aspect d’origine stocké
    const aspectRatio = parseFloat(inputWidth.data('aspect-ratio'));

    if (!aspectRatio) return;

    // Calculer la nouvelle hauteur selon ce ratio
    const newHeight = width * aspectRatio;

    inputHeight.val(newHeight.toFixed(2));
}

function updateLargeur(fileCounter) {
    const inputWidth = $('input[name="images[' + fileCounter + '][width]"]');
    const inputHeight = $('input[name="images[' + fileCounter + '][height]"]');

    const height = parseFloat(inputHeight.val());
    if (!height) return;

    // Récupérer le ratio d’aspect d’origine stocké
    const aspectRatio = parseFloat(inputHeight.data('aspect-ratio'));

    if (!aspectRatio) return;

    // Calculer la nouvelle hauteur selon ce ratio
    const newWidth = height * aspectRatio;

    inputWidth.val(newWidth.toFixed(2));
}

async function uploadAndGetDPI(files) {
    const formData = new FormData();
    for (const file of files) {
        formData.append('images[]', file); // tableau de fichiers
    }

    const response = await fetch('../autoimpose-editeur-dtf/includes/get_dpi.php', {
        method: 'POST',
        body: formData
    });

    return await response.json(); // retournera un tableau de résultats
}

function addStandardImageToPreview() {
    const preview = document.getElementById('preview');
    const imageUrl = '../autoimpose-editeur-dtf/uploads/autoimpose_demo.png';
    const fileName = 'autoimpose_demo.png';

    fetch(imageUrl)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], fileName, {type: 'image/png'});
            const img = new Image();
            img.onload = function () {
                const box = document.createElement('div');
                box.className = 'image-box';
                box.innerHTML = `
                    <div class="box-without-img">
                     <div class="delete-btn delete-svg-container" onclick="deleteImage(this)">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="21.856" height="26.64" viewBox="0 0 14.856 19.64"  fill="#a7a7a7">
    <defs>
        <clipPath id="clip-path">
            <rect  width="21.856" height="26.64" transform="translate(0 0)"/>
        </clipPath>
    </defs>
    <g id="Groupe_84" data-name="Groupe 84" clip-path="url(#clip-path)">
        <path id="Tracé_14" data-name="Tracé 14" d="M5.824,27.388q-.179-3.1-.357-6.2c-.008-.141,0-.283-.023-.422-.039-.286.081-.383.364-.382q6.012.008,12.024,0c.281,0,.384.09.367.379q-.258,4.363-.5,8.726c-.08,1.406-.149,2.812-.242,4.217a3.516,3.516,0,0,1-.2,1.076A1.955,1.955,0,0,1,15.348,36.1q-3.526.021-7.052,0a2.067,2.067,0,0,1-2.077-1.967C6.094,32.33,6,30.524,5.9,28.718q-.039-.665-.077-1.33h0m11.23-5.881H6.609c0,.157-.007.3,0,.434q.131,2.352.265,4.7.2,3.617.411,7.235A1.064,1.064,0,0,0,8.5,35.007h6.7a1.055,1.055,0,0,0,1.16-1.079c.034-.5.053-.995.082-1.493q.215-3.747.431-7.494c.065-1.134.124-2.269.188-3.435" transform="translate(-4.392 -16.471)"/>
        <path id="Tracé_15" data-name="Tracé 15" d="M3.782,1.929c0-.233,0-.417,0-.6A1.283,1.283,0,0,1,5.039.015q2.389-.031,4.779,0a1.275,1.275,0,0,1,1.256,1.312c0,.183,0,.367,0,.585.134.006.25.016.365.016.932,0,1.864,0,2.8,0,.378,0,.59.173.619.48A.526.526,0,0,1,14.418,3a1.983,1.983,0,0,1-.356.018H.766c-.076,0-.152,0-.227,0A.539.539,0,0,1,0,2.446a.52.52,0,0,1,.556-.513c.845-.008,1.69,0,2.536,0h.689m6.17-.018c.009-.09.02-.163.022-.236.012-.569.012-.569-.57-.569H5.574c-.738,0-.738,0-.681.74,0,.018.02.036.038.066Z" transform="translate(0 0.001)"/>
        <path id="Tracé_16" data-name="Tracé 16" d="M23.982,42.065q.065,1.949.13,3.9a.558.558,0,0,1-.4.63c-.367.114-.683-.148-.7-.585-.048-1.4-.09-2.794-.135-4.191q-.06-1.852-.122-3.7a.557.557,0,0,1,.4-.631c.373-.113.683.148.7.585.046,1.332.087,2.664.129,4h0" transform="translate(-18.388 -30.261)"/>
        <path id="Tracé_17" data-name="Tracé 17" d="M48.764,42.057q-.065,1.966-.13,3.932c-.014.416-.226.666-.555.66-.344-.007-.552-.275-.538-.708q.125-3.9.253-7.8c.014-.428.217-.659.558-.653s.546.248.534.668c-.037,1.3-.082,2.6-.124,3.9h0" transform="translate(-38.407 -30.287)"/>
        <path id="Tracé_18" data-name="Tracé 18" d="M36.931,42.08q0,1.9,0,3.8a1.412,1.412,0,0,1-.025.354.538.538,0,0,1-1.05-.031,1.261,1.261,0,0,1-.014-.259q0-3.88,0-7.76a1.945,1.945,0,0,1,.007-.227.539.539,0,0,1,1.072,0,2.9,2.9,0,0,1,.012.357q0,1.883,0,3.767" transform="translate(-28.954 -30.277)"/>
    </g>
</svg>
</div>
                     <div style="min-height: 14rem; display: flex; align-items: center; justify-content: center;">
        <img src="${imageUrl}" alt="${file.name}" class="img-responsive" />
    </div>
                        <input type="hidden" name="images[${fileCounter}][name]" value="${fileName}">
                        <label class="fs-4 fw-600">${LARGEUR_CM}</label>
                        <input type="number" class="form-control form-control-sm" name="images[${fileCounter}][width]" value="5">
                        <label class="fs-4 fw-600">${LONGEUR_CM}</label>
                        <input type="number" class="form-control form-control-sm" name="images[${fileCounter}][height]" value="5">
                        <label class="fs-4 fw-600">${QUANTITY}</label>
                        <input type="number" class="form-control form-control-sm" name="images[${fileCounter}][quantity]" value="1" min="1">
                    </div>
                `;

                // Création input file caché avec le fichier créé
                const dt = new DataTransfer();
                dt.items.add(file);
                const inputFile = document.createElement('input');
                inputFile.type = 'file';
                inputFile.name = `files[]`;
                inputFile.files = dt.files;
                inputFile.style.display = 'none';

                box.appendChild(inputFile);
                preview.appendChild(box);
                reindexImages();
            };

            slowScrollBy(200, 200);
            ShowCalculerButton();
            img.src = imageUrl;
        })
        .catch(() => console.error('Impossible de charger l’image standard.'));
}

function reindexImages() {
    document.querySelectorAll('.image-box').forEach((box, index) => {
        box.querySelectorAll('input').forEach(input => {
            // Mise à jour des "name"
            if (input.name) {
                input.name = input.name.replace(/images\[\d+\]/, `images[${index}]`);
            }

            // Mise à jour des "oninput"
            if (input.getAttribute('oninput')) {
                input.setAttribute(
                    'oninput',
                    input.getAttribute('oninput')
                        .replace(/\(\d+\)/, `(${index})`)
                );
            }
        });
    });
}

function ShowCalculerButton() {
    const button = document.getElementById("submit-btn");
    button.style.display = "block";
    const orderButton = document.getElementById("order-btn");
    if (orderButton) {
        orderButton.style.display = "none";
    }
}

function deleteImage(button) {
    const box = button.closest('.image-box');
    if (box) {
        box.remove();
        ShowCalculerButton();
    }
}

/*
function submitForm() {
    if (utilisateurId == 0) {
        $(document).ready(function () {
            $('.my-account').addClass('hover');
        });
        return;
    }
    const button = document.getElementById("submit-btn");
    const form = document.getElementById("upload-form");
    const formData = new FormData(form);

    const formatChoiceSelected = document.querySelector('#format-choice-2 + .div_puce_pictos_boxes.selected') !== null;
    const allowedFormatsSelected = document.querySelector('#allowed-formats-section .div_puce_pictos_boxes.selected') !== null;

    if (formatChoiceSelected && !allowedFormatsSelected) {
        showErrorsModal(ERROR3)
        return
    }

    const preloadModal = new bootstrap.Modal(document.getElementById('preloadIAModal'), {
        backdrop: 'static',
        keyboard: false
    });

    preloadModal.show();
    button.style.display = "block";
    let generate_link;
    if (is_dtf_uv_page) {
        generate_link = '../autoimpose-editeur-dtf-uv/generate.php';
    } else if (is_film_sublimation_page) {
        generate_link = '../autoimpose-editeur-film-sublimation/generate.php';
    } else if (is_test_page) {
        generate_link = '../autoimpose-editeur-dtf-test/generate.php';
    } else {
        generate_link = '../autoimpose-editeur-dtf/generate.php';
    }

    fetch(generate_link, {
        method: 'POST',
        body: formData
    })
        .then(async res => {
            const contentType = res.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                return res.json();
            } else {
                // Pas du JSON → récupérer le texte brut pour debug
                const text = await res.text();
                throw new Error("Réponse invalide du serveur (pas du JSON) :\n" + text);
            }
        })
        .then(async data => {
            if (data.error_raison === "session_expired") {
                setTimeout(() => location.reload(), 3000);
            }

            const responseSection = document.getElementById("response");
            await handleResponse(data, responseSection, preloadModal);
            const y = responseSection.getBoundingClientRect().top + window.pageYOffset - 230;
            window.scrollTo({top: y, behavior: 'smooth'});
        })

        .catch(err => {
            showError(err.message || err);
        })
        .finally(() => {
            button.style.display = "none";
            setTimeout(() => preloadModal.hide(), 500);
        });
}
*/

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("upload-form");
    const hiddenInputColor = document.getElementById("id_printing_color");
    const hiddenInputChoice = document.getElementById("id_format_choice");
    const hiddenInputSupport = document.getElementById("id_support_choice");

    // Observer pour déclencher ShowCalculerButton
    const observerCallback = () => {
        ShowCalculerButton();
    };

    // Observer général
    const observer = new MutationObserver(observerCallback);

    // Observer les hidden principaux
    [hiddenInputColor, hiddenInputChoice, hiddenInputSupport].forEach(input => {
        if (input) observer.observe(input, {attributes: true, attributeFilter: ['value']});
    });

    // Observer tous les hidden des formats
    document.querySelectorAll('input[id^="format-support-"]').forEach(input => {
        observer.observe(input, {attributes: true, attributeFilter: ['name', 'value']});
        // On peut observer aussi 'name' si tu toggle le name selon sélection
    });

    // Event sur le formulaire (si tu veux trigger aussi sur input/change classique)
    form.addEventListener("input", ShowCalculerButton);
    form.addEventListener("change", ShowCalculerButton);
});

// Gère la réponse du serveur
async function handleResponse(data, container, preloadModal) {

    if (data.error) {
        setTimeout(() => {
            preloadModal.hide();
            showErrorsModal(`${data.error}`);
        }, 500);
        return false;
    }

    const canvasDrawQueue = [];

    let html = `<div style="display: flex; align-items: center; gap: 8px; color: #6c3ef1; font-weight: bold; font-family: Arial, sans-serif;">
       <img style="background-color: #6c3ef1 ; color white; border-radius: 8px " src="https://www.realisaprint.com/autoimpose-editeur-dtf/assets/svg/brain.svg" alt="Check Icon" width="35" height="35">
       <span class="fs-1">${IA_rec}</span>
    </div>
    <section id="recommendation" class="container recommendation my-4 text-center">`;

    order_lines = data.order_lines;
// Trier les résultats par count décroissant
    data.results.sort((a, b) => {
        // tri d'abord par count décroissant
        if (b.count !== a.count) {
            return b.count - a.count;
        }
        // si count identique, tri par id_formatdesc croissant
        return b.id_format - a.id_format;
    });

    data.results.forEach(res => {
        const name_planche = res.height > 1000
            ? (res.count > 1 ? bobines : bobine)
            : (res.count > 1 ? planches : planche);

        html += `<p class="planche_2">
                <strong>${res.count} ${name_planche} ${res.name}</strong>
             </p>`;
    });

// Créer un seul container pour tous les résultats
    let totalColumns = data.results.every(res => {
        const rateGroups = {};
        res.rate.forEach((rate, idx) => {
            const sheet = res.sheets[idx];
            // Clé unique basée sur le taux + contenu du sheet
            const sheetKey = rate + "_" + btoa(JSON.stringify(sheet));

            if (!rateGroups[sheetKey]) {
                rateGroups[sheetKey] = {rate, count: 0, indexes: []};
            }
            rateGroups[sheetKey].count++;
            rateGroups[sheetKey].indexes.push(idx);
        });

        // Vérifier si ce res a un seul groupe
        return Object.keys(rateGroups).length === 1;
    }) ? 1 : 2;

    html += `<div class="planche-container" style="display: grid; grid-template-columns: repeat(${totalColumns}, 1fr);">`;

    data.results.forEach(res => {
        if (res.count > 0) {
            const baseCanvasId = res.name.replace(/\s+/g, '_');

            // Regrouper par taux mais aussi stocker les index
            const rateGroups = {};
            res.rate.forEach((rate, idx) => {
                const sheet = res.sheets[idx];
                // Clé unique : rate + hash du contenu du sheet
                const sheetKey = rate + "_" + btoa(JSON.stringify(sheet));

                if (!rateGroups[sheetKey]) {
                    rateGroups[sheetKey] = {rate, count: 0, indexes: []};
                }
                rateGroups[sheetKey].count++;
                rateGroups[sheetKey].indexes.push(idx);
            });

            // Affichage par groupe
            sortRateGroups(rateGroups).forEach(([rateValue, groupData]) => {
                var planche_or_bobine = (res.height > 1000)
                    ? (groupData.count > 1 ? bobines : bobine)
                    : (groupData.count > 1 ? planches : planche);
                const firstIndex = groupData.indexes[0];
                html += `<p class="planche">
                <strong>${groupData.count} ${planche_or_bobine} ${res.name}</strong>
                <span class="small-planche">(${remplissage} : ${parseFloat(rateValue).toFixed(2)}%)</span> 
                &nbsp<a href="javascript:void(0)" class="btn show-preview"     
                data-remplissage="${parseFloat(rateValue).toFixed(2)}%" 
                data-name-planche="${planche_or_bobine} ${res.name}" 
                data-canvas="canvas_${baseCanvasId}_${firstIndex}" title="Afficher l’aperçu"> Afficher l’aperçu <i class="far fa-eye"></i></a>
             </p>`;
            });
        }

        // Création des canvases (inchangé)
        res.sheets.forEach((sheet, i) => {
            const canvasId = `canvas_${res.name.replace(/\s+/g, '_')}_${i}`;
            html += `<canvas id="${canvasId}" class="border mb-3" style="max-width: 300px; max-height: 300px; display:none;"></canvas>`;
            canvasDrawQueue.push({
                id: canvasId,
                width: res.width,
                height: res.height,
                placements: sheet
            });
        });
    });

    html += `</div>`; // Fermeture du container unique
// Après avoir généré toutes les planches et ajouté au container


    //  var nombreDiv = $('#preview > div').length;
    var price = Math.max(data.shipping_params[0].price * 0.21, 2.65);
    html += `<p class="economy-ligne" >
               <span class="fa-stack fa-lg" style="    font-size: smaller;vertical-align: bottom;">
                  <i class="far fa-circle fa-stack-2x"></i>
                  <i class="fas fa-euro-sign fa-stack-1x"></i>
               </span> 
               <strong>${economy_text_1} <span id="economy-price">${(price).toFixed(2)}€</span></strong> 
              ${economy_text_2}
             </p>`;
    html += `</section>`;

    if (data.shipping_params && typeof data.shipping_params === 'object' && Object.keys(data.shipping_params).length > 0) {
        html += `
          <section class="container">
               <div id="shipping_cards" class="options-container">
            ${data.shipping_params[1] && data.shipping_params[1].price > 0 ? `
                  <div class="option-card" data-target="1">
                    <div class="card-header text-muted fw-bold fs-5">
                    ${data.shipping_params[1].date_livraison}
                    </div>
                  <div class="card-body pb-0">
                    <h5 class="card-title icon-urgent">
                        <span class="titreTh"><i class="fas fa-rocket"></i></span>
                    </h5>
                  <div>
                        <span class="card-text fw-bold fs-2" style="padding-left: 1.5rem;">
                            ${data.shipping_params[1].price.toFixed(2)} €
                        </span>
                  </div>
                    <img src="https://www.realisaprint.com/autoimpose-editeur-dtf/assets/svg/check-circle.svg" 
                         alt="Check Icon" class="check-icon check-icon-top" width="24" height="24" style="display: none;">
                </div>
            </div>
            `
            : ''
        }
    
        ${data.shipping_params[2] && data.shipping_params[2].price > 0 ? `
            <div class="option-card active" data-target="2">
                <div class="card-header text-muted fw-bold fs-5">
                    ${data.shipping_params[2].date_livraison}
                </div>
                <div class="card-body pb-0">
                    <h5 class="card-title icon-express">
                        <span class="titreTh"><i class="fas fa-car-side"></i></span>
                    </h5>
                    <div class="card-title">
                        <span class="card-text fw-bold fs-2" style="padding-left: 1.5rem;">
                            ${data.shipping_params[2].price.toFixed(2)} €
                        </span>
                    </div>
                    <img src="https://www.realisaprint.com/autoimpose-editeur-dtf/assets/svg/check-circle.svg" 
                         alt="Check Icon" class="check-icon check-icon-top" width="24" height="24" >
                </div>
            </div>
            `
            : ''
        }

        ${data.shipping_params[0] && data.shipping_params[0].price > 0 ? `
            <div class="option-card" data-target="0">
                <div class="card-header text-violet fw-bold fs-5">
                    ${data.shipping_params[0].date_livraison}
                </div>
                <div class="card-body pb-0">
                    <h5 class="card-title icon-standard">
                        <span class="titreTh"><i class="fas fa-bicycle"></i></span>
                    </h5>
                    <div class="card-title">
                        <span class="card-text fw-bold fs-2" style="padding-left: 1.5rem;">
                            ${data.shipping_params[0].price.toFixed(2)} €
                        </span>
                    </div>
                    <img src="https://www.realisaprint.com/autoimpose-editeur-dtf/assets/svg/check-circle.svg" 
                         alt="Check Icon" class="check-icon check-icon-top" width="24" height="24" style="display: none;">
                </div>
            </div>
            `
            : ''
        }

    </div>
</section>`;
    }

    if (!data.is_simulation) {
        html += `<div class="my-3 tac"><button type="button" onclick="submitOrderDTF()" id="order-btn" class="purple-button order-button "> ${Ajouter_au_panier}</button></div>`;
    }

    container.innerHTML = html;

    // Initialiser le modal Bootstrap
    const previewModal = new bootstrap.Modal(document.getElementById('previewModal'), {
        backdrop: true, // le backdrop commun
        keyboard: false
    });
 /*   const leftTopModal = new bootstrap.Modal(document.getElementById('leftTopModal'), {
        backdrop: false, // pas de backdrop pour éviter double fond
        keyboard: false
    });
    const leftTopModal2 = new bootstrap.Modal(document.getElementById('leftTopModal-2'), {
        backdrop: false, // pas de backdrop pour éviter double fond
        keyboard: false
    }); */
    const modalCanvas = document.getElementById('modalCanvas');

    function closeBothModals() {
        previewModal.hide();
    /*    leftTopModal.hide();
        leftTopModal2.hide(); */
    }

// Événements sur les liens "afficher l’aperçu"
    document.querySelectorAll('.show-preview').forEach(link => {
        link.addEventListener('click', async e => { // async pour pouvoir await
            e.preventDefault();
            $("#preloader").show();
            const canvasId = link.dataset.canvas;
            const sourceCanvas = document.getElementById(canvasId);
            const remplissage = link.dataset.remplissage;
            const namePlanche = link.dataset.namePlanche;
            const tailleSpan = document.getElementById('taille-planche');
            const tauxSpan = document.getElementById('taux-remplissage');
            changePercent(remplissage);
            if (tailleSpan) tailleSpan.textContent = namePlanche;
            if (tauxSpan) tauxSpan.textContent = remplissage;
            if (!sourceCanvas) return;

            // Dessiner le canvas seulement si ce n'est pas déjà fait
            if (!sourceCanvas.dataset.drawn) {
                const canvasData = canvasDrawQueue.find(c => c.id === canvasId);
                if (canvasData) {
                    // Préparer les placements avant le dessin
                    function floatEquals(a, b, epsilon = 0.01) {
                        return Math.abs(a - b) < epsilon;
                    }

                    canvasData.placements.forEach(placement => {
                        const image = data.images.find(
                            img => img.file === placement.file || img.name === placement.name
                        );

                        if (image) {
                            placement.dimensions_changed =
                                (floatEquals(placement.width, image.width) &&
                                    floatEquals(placement.height, image.height)) ? 0 : 1;
                        } else {
                            placement.dimensions_changed = 0;
                        }

                        if (placement.name === "/home/www/realisaprint.com/autoimpose-editeur-dtf/uploads/autoimpose_demo.png") {
                            placement.dimensions_changed = 0;
                            placement.rotated = 0;
                        }
                    });

                    await drawPlanche(canvasId, canvasData.width, canvasData.height, canvasData.placements);
                    sourceCanvas.dataset.drawn = "true"; // marquer comme dessiné
                }
            }

            // Copier le canvas dans le modal
            modalCanvas.width = sourceCanvas.width;
            modalCanvas.height = sourceCanvas.height;
            const ctxModal = modalCanvas.getContext('2d');
            ctxModal.clearRect(0, 0, modalCanvas.width, modalCanvas.height);
            ctxModal.drawImage(sourceCanvas, 0, 0);

            // ✅ Sauvegarde un snapshot propre pour le zoom
            const snapshotImg = new Image();
            snapshotImg.src = modalCanvas.toDataURL();
            snapshotImg.onload = () => {
                magnifyCanvas(modalCanvas, 1);
            };

            $("#preloader").hide();
            previewModal.show();
       /*     leftTopModal.show();
            leftTopModal2.show(); */
        });
    });
    document.querySelectorAll('.close-popup-button').forEach(btn => {
        btn.addEventListener('click', closeBothModals);
    });

 /*   document.getElementById('previewModal').addEventListener('hide.bs.modal', () => {
        leftTopModal.hide();
        leftTopModal2.hide();
    }); */
    setupCardSelection();
}

function circlePercent(taux_remplissage) {
    const circle = document.getElementById('circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference * (1 - taux_remplissage / 100);

    if (taux_remplissage > 75) {
        $('#circle').attr('stroke', '#1CBA2F');
        $('.card__number').css('color', '#1CBA2F');
    }
}

function changePercent(taux_remplissage) {
    const number = document.querySelector('.card__number');
    const value = parseFloat(taux_remplissage);
    number.innerHTML = value + '%';
    circlePercent(value);
}

async function drawPlanche(canvasId, width, height, placements) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Fond couleur
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, width, height);

    // Motif de petits points
    const gridSize = 20;
    const radius = 0.8;
    ctx.fillStyle = 'rgba(128,128,128,0.5)';
    for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x + gridSize / 2, y + gridSize / 2, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Fonction pour dessiner une image ou PDF
    const pdfCache = {}; // Objet pour mettre en cache les PDF rendus

    async function drawItem(p) {
        let img = new Image();
        img.crossOrigin = "anonymous"; //
        const basePath = "/home/www/realisaprint.com/autoimpose-editeur-dtf/";
        const src = p.name.replace(basePath, "");
    //    const src = src0.replace('autoimpose-editeur-dtf', 'autoimpose-editeur-dtf-test');

        // Vérifier si le PDF est déjà dans le cache
        if (src.toLowerCase().endsWith('.pdf')) {
            if (!pdfCache[src]) {
                try {
                    const loadingTask = pdfjsLib.getDocument(src);
                    const pdf = await loadingTask.promise;

                    const page = await pdf.getPage(1);
                    const scale = 1; // miniature rapide
                    const viewport = page.getViewport({scale});

                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = viewport.width;
                    tempCanvas.height = viewport.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    await page.render({canvasContext: tempCtx, viewport}).promise;

                    // Mettre dans le cache sous forme d'image
                    const cachedImg = new Image();
                    cachedImg.src = tempCanvas.toDataURL();
                    pdfCache[src] = cachedImg;

                    if (cachedImg.complete) {
                    } else {
                        await new Promise(res => cachedImg.onload = res);
                    }
                } catch (err) {
                    console.warn("drawItem : erreur PDF", err);
                }
            }
            img = pdfCache[src];
        } else {
            img.src = src;
        }

        return new Promise(resolve => {
            img.onload = () => {
                ctx.save();
                const cx = p.x + p.width / 2;
                const cy = p.y + p.height / 2;
                ctx.translate(cx, cy);

                if (p.dimensions_changed) {
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(img, -p.height / 2, -p.width / 2, p.height, p.width);
                } else {
                    ctx.drawImage(img, -p.width / 2, -p.height / 2, p.width, p.height);
                }

                ctx.restore();
                resolve();
            };

            // Si c'est déjà complet (pour les images normales ou cache PDF)
            if (img.complete) {
                img.onload();
            }
        });
    }

    // Dessiner toutes les images/PDF
    for (const p of placements) {
        await drawItem(p);
    }
}

function magnifyCanvas(canvasElement, zoom = 2, glassSize = 150) {
    // Supprime la loupe existante
    const oldGlass = canvasElement.parentElement.querySelector(".img-magnifier-glass");
    if (oldGlass) oldGlass.remove();

    // Crée la loupe
    const glass = document.createElement("div");
    glass.classList.add("img-magnifier-glass");
    Object.assign(glass.style, {
        position: "absolute",
        border: "3px solid #000",
        borderRadius: "50%",
        width: `${glassSize}px`,
        height: `${glassSize}px`,
        pointerEvents: "none",
        overflow: "hidden",
        boxShadow: "0 0 8px rgba(0,0,0,0.3)",
        display: "none",
        zIndex: 1000,
        cursor: "none"
    });

    // Préparer le parent
    const parent = canvasElement.parentElement;
    parent.style.position = parent.style.position || "relative";
    parent.appendChild(glass);

    const halfGlass = glassSize / 2;

    // Snapshot du canvas (une seule fois pour optimiser)
    const snapshotImg = canvasElement.toDataURL();
    Object.assign(glass.style, {
        backgroundImage: `url('${snapshotImg}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${canvasElement.width * zoom}px ${canvasElement.height * zoom}px`,
    });

    // Fonction pour déplacer la loupe
    function moveMagnifier(e) {
        e.preventDefault();
        const rect = canvasElement.getBoundingClientRect();
        const scaleX = canvasElement.width / rect.width;
        const scaleY = canvasElement.height / rect.height;

        let x = (e.clientX - rect.left) * scaleX;
        let y = (e.clientY - rect.top) * scaleY;

        if (x < 0 || y < 0 || x > canvasElement.width || y > canvasElement.height) {
            glass.style.display = "none";
            return;
        }

        glass.style.display = "block";

        // Centre de la loupe sur la souris
        glass.style.left = `${e.clientX - rect.left - halfGlass}px`;
        glass.style.top = `${e.clientY - rect.top - halfGlass}px`;

        // Centre le pixel sous la souris
        const bgX = -(x * zoom - halfGlass);
        const bgY = -(y * zoom - halfGlass);
        glass.style.backgroundPosition = `${bgX}px ${bgY}px`;
    }

    // Gestion des événements
    canvasElement.addEventListener("mousemove", moveMagnifier);
    canvasElement.addEventListener("touchmove", moveMagnifier);
    canvasElement.addEventListener("mouseleave", () => glass.style.display = "none");

    // Retourne un objet pour permettre de retirer la loupe si besoin
    return {
        glass,
        remove: () => {
            glass.remove();
            canvasElement.removeEventListener("mousemove", moveMagnifier);
            canvasElement.removeEventListener("touchmove", moveMagnifier);
            canvasElement.removeEventListener("mouseleave", () => glass.style.display = "none");
        }
    };
}


/*
// 🔍 Facteur de zoom contrôlable par constante
const ZOOM_FACTOR = 2;   // ⇦ niveau de zoom
const ZOOM_SIZE = 50; // taille de la zone capturée
*/

/*
function enableCanvasZoom(sourceCanvas, snapshotImg, zoom = ZOOM_FACTOR, zoomSize = ZOOM_SIZE) {
    const zoomCanvas = document.getElementById("zoomCanvas");
    const zoomCtx = zoomCanvas.getContext("2d");

    let mouseX = 0, mouseY = 0;

    // ✅ changer le curseur
    sourceCanvas.style.cursor = "zoom-in";

    sourceCanvas.addEventListener("mousemove", (e) => {
        const rect = sourceCanvas.getBoundingClientRect();

        // position de la souris relative au canvas (en pixels CSS)
        let mouseX = e.clientX - rect.left;
        let mouseY = e.clientY - rect.top;

        // conversion vers les pixels internes du canvas
        mouseX = mouseX * (sourceCanvas.width / rect.width);
        mouseY = mouseY * (sourceCanvas.height / rect.height);

        drawZoom(mouseX, mouseY);
    });


    sourceCanvas.addEventListener("mouseleave", () => {
        zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
    });

    function drawZoom(mouseX, mouseY) {
        const sx = mouseX - zoomSize / (2 * zoom);
        const sy = mouseY - zoomSize / (2 * zoom);
        const sw = zoomSize / zoom;
        const sh = zoomSize / zoom;

        zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);

        zoomCtx.drawImage(
            snapshotImg,
            sx, sy, sw, sh,
            0, 0,
            zoomCanvas.width, zoomCanvas.height
        );
    }

}
*/
function sortRateGroups(rateGroups) {
    return Object.entries(rateGroups).sort((a, b) => {
        const countA = a[1].count;
        const countB = b[1].count;

        if (countA !== countB) {
            return countB - countA; // décroissant sur count
        }
        return parseFloat(b[0]) - parseFloat(a[0]); // décroissant sur rateValue si égalité
    });
}

// Affiche une erreur dans le conteneur donné
function showError(error) {
//    showErrorsModal(`<span style="color:red">Erreur : ${error}</span>`);
}

// Active les événements de sélection sur les cartes
function setupCardSelection() {
    const cards = document.querySelectorAll(".option-card");

    cards.forEach(card => {
        card.addEventListener("click", () => {
            // Réinitialiser tous les cards
            cards.forEach(c => {
                const header = c.querySelector(".card-header");
                if (header) {
                    header.classList.remove("text-violet");
                    header.classList.add("text-muted");
                }
                c.classList.remove("active");

                // Masquer toutes les icônes (img)
                const icon = c.querySelector(".check-icon");
                if (icon) {
                    icon.style.display = "none"; // Au lieu de d-none/d-inline
                }
            });

            // Activer le card cliqué
            card.classList.add("active");
            const header2 = card.querySelector(".card-header");
            if (header2) {
                header2.classList.remove("text-muted");
                header2.classList.add("text-violet");
            }

            // Afficher l'icône du card actif
            const activeIcon = card.querySelector(".check-icon");
            if (activeIcon) {
                activeIcon.style.display = "inline-block"; // Afficher l'image
            }
        });
    });
}

function slowScrollBy(distance, duration) {
    const start = window.scrollY;
    const startTime = performance.now();

    function scrollStep(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, start + distance * progress);
        if (progress < 1) {
            requestAnimationFrame(scrollStep);
        }
    }

    requestAnimationFrame(scrollStep);
}

function filterOrdersByType(orderData, type) {
    let keyToKeep;

    switch (type) {
        case 0:
            keyToKeep = "Standard";
            break;
        case 1:
            keyToKeep = "Urgence";
            break;
        case 2:
            keyToKeep = "Express";
            break;
        default:
            console.warn("Type invalide, retour des données complètes.");
            return orderData;
    }

    const filtered = {};
    for (const id in orderData) {
        if (orderData[id][keyToKeep]) {
            filtered[id] = orderData[id][keyToKeep];
        }
    }

    return filtered;
}

function submitOrderDTF() {
    if (utilisateurId !== 0) {
        const activeTarget = $('#shipping_cards .option-card.active').data('target');
        let lines = null;
        switch (activeTarget) {
            case 0:
                lines = filterOrdersByType(order_lines, 0);
                break;
            case 1:
                lines = filterOrdersByType(order_lines, 1);
                break;
            case 2:
                lines = filterOrdersByType(order_lines, 2);
                break;
            default:
                console.warn("Aucune option de livraison valide trouvée.");
        }
        addDtfToCart(lines);
    } else {
        $(document).ready(function () {
            $('.my-account').addClass('hover');
        });
    }
}

function addDtfToCart(lines) {
    $("#preloader").show();
    $.ajax({
        type: "POST",
        url: url_to_cart,
        data: {
            valider: "autoimpose",
            order_line: JSON.stringify(lines),
        },
        success: function (data) {
            $('#tunnel_conversion').html(data);
            if (preloader) {
                $("#preloader").hide();
            }
        },
        error: function () {
            $('#inutile').html('Une erreur est survenue');
            if (preloader) {
                preloader.hide();
            }
        }
    });
}

function showErrorsModal(error) {
    const errorList = document.getElementById('errorList');
    errorList.innerHTML = ''; // Vider la liste
    errorList.innerHTML = `<li>${error}</li>`;

    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    errorModal.show();
}

function get_espacement_and_goutiers(msg1, msg2) {
    const goutieresInput = document.getElementById('goutieres');
    const espacementInput = document.getElementById('espacement');
    const errorMessage = document.getElementById('error-message');

    let goutieres = parseFloat(goutieresInput.value);
    let espacement = parseFloat(espacementInput.value);


    // Vérification des valeurs
    if (!goutieresInput.checkValidity()) {
        errorMessage.style.display = "block";
        errorMessage.innerText = "❌" + msg1;
        return;
    }

    if (!espacementInput.checkValidity()) {
        errorMessage.style.display = "block";
        errorMessage.innerText = "❌" + msg2;
        return;
    }

    // ✅ Si tout est bon, efface l'erreur et ferme le modal
    errorMessage.style.display = "none";
    errorMessage.innerText = "";

    // ✅ Met les valeurs dans les hidden inputs
    document.getElementById("gouttieres").value = goutieres;
    document.getElementById("margin").value = espacement;
    $('#gouttiere-modal').text(goutieresInput.value);
    $('#spacing-modal').text(espacementInput.value);
    ShowCalculerButton();
    // Ferme le modal "ModalParams"
    const modalEl = document.getElementById('ModalParams');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
}

//format checkbox event listener
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.div_puce_pictos_boxes[data-type="format"]').forEach(pic => {
        pic.addEventListener("click", function () {
            this.classList.toggle("selected");

            // input hidden associé
            const input = this.closest(".autoimpose-format").querySelector("input[type=hidden]");
            if (this.classList.contains("selected")) {
                input.setAttribute("name", "format-support[]");
                // image selected
                const img = this.querySelector("img");
                if (img && !img.src.includes("-selected-autoimpose")) {
                    img.src = img.src.replace(".svg", "-selected-autoimpose.svg");
                }
            } else {
                input.removeAttribute("name");
                // image normale
                const img = this.querySelector("img");
                if (img) {
                    img.src = img.src.replace("-selected-autoimpose.svg", ".svg");
                }
            }
        });
    });
});

//choice checkbox event listener


//support checkbox event listener
/*
document.addEventListener("DOMContentLoaded", function () {
    const hiddenSupport = document.getElementById("id_support_choice");

    function selectSupport(supportId) {
        document.querySelectorAll('.div_puce_pictos_boxes[data-type="support"]').forEach(div => {
            const img = div.querySelector("img");

            if (div.getAttribute("data-value") === supportId) {
                div.classList.add("selected");
                hiddenSupport.value = supportId;

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

    // Initial selection
    selectSupport(hiddenSupport.value);

    // Event listener
    document.querySelectorAll('.div_puce_pictos_boxes[data-type="support"]').forEach(div => {
        div.addEventListener("click", function () {
            const supportId = this.getAttribute("data-value");
            selectSupport(supportId);
        });
    });
});
*/
document.addEventListener("DOMContentLoaded", function () {
    const choiceDiv1 = document.querySelector('.div_puce_pictos_boxes[data-value="1"]');
    const allowedSection = document.getElementById("allowed-formats-section");

    if (choiceDiv1 && allowedSection) {
        choiceDiv1.addEventListener("click", function () {
            const imgs = allowedSection.querySelectorAll("img");

            imgs.forEach(img => {
                if (img.src.includes("-selected-autoimpose")) {
                    img.src = img.src.replace("-selected-autoimpose", "");
                }
            });
        });
    }
});

function demandeDevis(title, description, lang) {
    let actionUrl;

    switch (lang) {
        case 2:
            actionUrl = `${base_url_ssl}/preventivo.php`;
            break;
        case 3:
            actionUrl = `${base_url_ssl}/presupuesto-personalizado.php`;
            break;
        default:
            actionUrl = `${base_url_ssl}/devis-specifique.php`; // valeur par défaut
    }

    // Création du formulaire
    const form = $('<form>', {
        method: 'post',
        action: actionUrl
    });

    form.append($('<input>', { type: 'hidden', name: 'prod', value: title }));
    form.append($('<input>', { type: 'hidden', name: 'caracs', value: description }));
    form.append($('<input>', { type: 'hidden', name: 'num_catca', value: 169 }));
    form.append($('<input>', { type: 'hidden', name: 'from_autoimpose', value: 1 }));

    $('body').append(form);
    form.submit();
}