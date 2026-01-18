import './styles/app.scss';
import * as bootstrap from 'bootstrap';

// Exemple pour activer tooltips si tu veux
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el);
});
