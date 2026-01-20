// ==================== CSS ====================
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'flag-icons/css/flag-icons.min.css';
import 'toastr/build/toastr.min.css';
import 'select2/dist/css/select2.min.css';

import './css/style.css';
import './css/logosSheet.css';
import './css/animate.css';

// ==================== JS ====================
import $ from 'jquery';
window.$ = $;
window.jQuery = $;

import 'bootstrap';
import toastr from 'toastr';
window.toastr = toastr;
import 'select2';

import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
window.pdfjsLib = pdfjsLib;

// Tes fichiers JS perso
import './js/main.js';


// ==================== Config Toastr ====================
toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: "toast-top-right",
    preventDuplicates: true,
    showDuration: "3000",
    hideDuration: "5000",
    timeOut: "6000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut"
};
