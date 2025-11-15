/* =====================================================
   APPLICATION JAVASCRIPT - Carte de visite numérique
   ===================================================== */

let DATA = null;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadData();          // charge JSON ou fallback
        renderStaticData();        // manipule DOM
        generateQRCodes();         // génère les codes QR
        setupModalEvents();        // configuration des événements modaux
    } catch (err) {
        console.error(err);
        showNotification("Erreur", "Impossible de charger les données.");
    }
});

/** ==========================================
 * Charge data.json
 ========================================== */
async function loadData() {
    const localPath = "./assets/json/data.json"; // chemin du fichier JSON
    // Si la page est servie via HTTP(S), utiliser fetch
    const runFetch = location.protocol === 'http:' || location.protocol === 'https:';

    if (runFetch) {
        try {
            const res = await fetch(localPath, { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            DATA = await res.json();
            return;
        } catch (err) {
            console.warn('fetch(data.json) a échoué :', err);
            // Continuer vers le fallback JSON inline
        }
    }

    // Fallback : lire <script id="jsonData" type="application/json"> dans le HTML
    const inline = document.getElementById('jsonData');
    if (inline && inline.textContent.trim().length) {
        try {
            DATA = JSON.parse(inline.textContent);
            return;
        } catch (err) {
            console.error('Erreur de parsing du JSON inline :', err);
        }
    }

    // Si aucune méthode n'a fonctionné, lancer une erreur informative
    throw new Error(
        'Impossible de charger les données. Servez le site via HTTP (ex: python -m http.server) ' +
        'ou ajoutez un <script id="jsonData" type="application/json"> avec votre JSON.'
    );
}

/** ==========================================
 * Remplit tous les éléments statiques du site
 ========================================== */
function renderStaticData() {
    const p = DATA.personal;
    const c = DATA.contact;
    const s = DATA.social;
    const site = DATA.site;

    // Photo + identité
    const avatar = document.getElementById("avatar");
    if (avatar && p.photo) avatar.src = p.photo;
    const fullNameEl = document.getElementById("fullname");
    if (fullNameEl) fullNameEl.textContent = p.fullName;
    const roleEl = document.getElementById("role");
    if (roleEl) roleEl.textContent = p.role;
    const schoolEl = document.getElementById("school");
    if (schoolEl) schoolEl.textContent = p.school;

    // Brand + footer
    const brandEl = document.getElementById("brand");
    if (brandEl) brandEl.textContent = site.brand;

    // Contact
    // Téléphone
    const phoneVal = document.getElementById("phoneValue");
    const phoneLink = document.getElementById("phoneLinkValue");
    if (phoneVal) phoneVal.textContent = c.phone;
    if (phoneLink) phoneLink.href = "tel:" + c.phone;

    // Email
    const mailVal = document.getElementById("emailValue");
    const mailLink = document.getElementById("emailLinkValue");
    if (mailVal) mailVal.textContent = c.email;
    if (mailLink) mailLink.href = "mailto:" + c.email;

    // Localisation
    const loc = document.getElementById("locationValue");
    if (loc) loc.textContent = `${p.city}, ${p.country}`;

    // Liens sociaux
    const linkedinLink = document.getElementById("linkedinLink");
    if (linkedinLink) linkedinLink.href = s.linkedin;
    const githubLink = document.getElementById("githubLink");
    if (githubLink) githubLink.href = s.github;
    const websiteLink = document.getElementById("websiteLink");
    if (websiteLink) websiteLink.href = s.website;
}

/**
 * Génère les codes QR pour le site web et les contacts
 */
function generateQRCodes() {
    const q = DATA.qrCodes;
    if (!q) return;
    const qrSiteImg = document.getElementById("qrCodeSite");
    const qrContactImg = document.getElementById("qrCodeContact");
    if (qrSiteImg && q.site) qrSiteImg.src = q.site;
    if (qrContactImg && q.contact) qrContactImg.src = q.contact;
}

/**
 * Génère une chaîne vCard avec les données de contact
 * @returns {string} Chaîne vCard formatée
 */
function generateVCard() {
    const p = DATA.personal;
    const c = DATA.contact;
    const s = DATA.social;

    // Extraire prénom et nom
    let firstName = "";
    let lastName = "";
    if (p.fullName) {
        const parts = p.fullName.trim().split(" ");
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
    }

    return `BEGIN:VCARD
VERSION:4.0
FN:${p.fullName}
N:${lastName};${firstName};;;
ORG:${p.school}
TITLE:${p.role}
TEL:${c.phone}
EMAIL:${c.email}
URL;TYPE=LINKEDIN:${s.linkedin}
URL;TYPE=GITHUB:${s.github}
URL;TYPE=WEBSITE:${s.website}
ADR;;;${p.street || ''};${p.city || ''};${p.department || ''};${p.postal_code || ''};${p.country || ''}
NOTE:Carte de visite numérique - ${p.nameInitial || ''}
END:VCARD`;
}

// ===== GESTION DES CONTACTS =====

/**
 * Télécharger le contact sous forme de fichier vCard
 */
function addToContact() {
    const vCard = generateVCard();
    downloadVCard(vCard, `${DATA.personal.fullName}_contact.vcf`);

    // Afficher une notification
    showNotification(
        "Contact",
        "Fichier vCard téléchargé. Importez-le dans votre application Contacts pour l'ajouter dans vos contacts."
    );
}

/**
 * Télécharge un fichier vCard
 * @param {string} vCardContent - Contenu du vCard
 * @param {string} fileName - Nom du fichier à télécharger
 */
function downloadVCard(vCardContent, fileName) {
    // Créer un blob avec le contenu vCard
    const blob = new Blob([vCardContent], { type: 'text/vcard' });

    // Créer une URL pour le blob
    const url = window.URL.createObjectURL(blob);

    // Créer un élément anchor pour le téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Ajouter à la page et déclencher le clic
    document.body.appendChild(link);
    link.click();

    // Nettoyer
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Affiche une notification à l'utilisateur
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 */
function showNotification(title, message) {
    // Créer l'élément notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        animation: slideInNotification 0.3s ease-out;
        max-width: 300px;
    `;

    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 14px; opacity: 0.9;">${message}</div>
    `;

    document.body.appendChild(notification);

    // Ajouter les animations CSS pour l'affichage
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInNotification {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes slideOutNotification {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(20px);
            }
        }
    `;
    document.head.appendChild(style);

    // Retirer la notification après 3 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOutNotification 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ===== GESTION DU TÉLÉCHARGEMENT DE CV =====

/**
 * Ouvre la modal de sélection de CV
 */
function downloadCV() {
    showCVModal();
}

/**
 * Affiche la modal de sélection de CV
 */
function showCVModal() {
    const modal = document.getElementById('cvModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        renderCVOptions();
    }
}

/**
 * Ferme la modal de sélection de CV
 */
function closeCVModal() {
    const modal = document.getElementById('cvModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Rend les boutons d'options de CV dynamiquement
 */
function renderCVOptions() {
    const container = document.getElementById('cvOptions');
    if (!container) return;

    // Vider le conteneur
    container.innerHTML = '';

    // Créer un bouton pour chaque version de CV
    DATA.cvVersions.forEach(cv => {
        const button = document.createElement('button');
        button.className = 'cv-option-btn';
        button.textContent = cv.label;
        button.onclick = () => downloadSelectedCV(cv);
        button.style.cursor = 'pointer';
        container.appendChild(button);
    });
}

/**
 * Télécharge le CV sélectionné
 * @param {object} cvData - Données du CV sélectionné
 */
function downloadSelectedCV(cvData) {
    closeCVModal();

    // Créer un élément anchor pour le téléchargement
    const link = document.createElement('a');
    link.target = "_blank";
    link.href = cvData.url;
    link.download = cvData.fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Afficher une notification
    showNotification(
        "Téléchargement",
        `${cvData.label} en cours de téléchargement...`
    );
}

// ===== GESTION DES ÉVÉNEMENTS MODAUX =====

/**
 * Configure les événements de la modal CV
 */
function setupModalEvents() {
    const backdrop = document.querySelector('.modal-backdrop');
    const closeBtn = document.querySelector('.modal-close');

    // Fermer la modal en cliquant sur le backdrop
    if (backdrop) {
        backdrop.addEventListener('click', closeCVModal);
    }

    // Fermer la modal en cliquant sur le bouton de fermeture
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCVModal);
    }

    // Fermer la modal en appuyant sur Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCVModal();
        }
    });
}

// ===== QR modal pour agrandir =====
(function () {
    const qrCards = document.querySelectorAll(".qr-card .qr-canvas");
    const body = document.body;

    qrCards.forEach(qr => {
        qr.style.cursor = "zoom-in";
        qr.addEventListener("click", () => {
            // Créer l'overlay de la modal QR
            const modal = document.createElement("div");
            modal.classList.add("qr-modal");
            modal.innerHTML = `
                <div class="qr-modal-backdrop"></div>
                <div class="qr-modal-content">
                    <button class="qr-modal-close" aria-label="Fermer">&times;</button>
                </div>
            `;
            body.appendChild(modal);

            // Dupliquer le QR à l'intérieur de la modal
            const clone = qr.cloneNode(true);
            clone.style.width = "300px";
            clone.style.height = "300px";
            modal.querySelector(".qr-modal-content").appendChild(clone);

            // Ajouter les événements de fermeture
            const closeBtn = modal.querySelector(".qr-modal-close");
            closeBtn.addEventListener("click", () => modal.remove());
            modal.querySelector(".qr-modal-backdrop").addEventListener("click", () => modal.remove());
        });
    });
})();

// ===== Changement thème =====
(function () {
    const page = document.getElementById('page');
    const btn = document.getElementById('themeToggle');
    if (!page || !btn) return;
    const sun = btn.querySelector('.icon-sun');
    const moon = btn.querySelector('.icon-moon');

    // initialisation du thème
    const saved = localStorage.getItem('color-scheme');
    if (saved) {
        page.setAttribute('data-color-scheme', saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        page.setAttribute('data-color-scheme', 'dark');
    } else {
        page.setAttribute('data-color-scheme', 'light');
    }
    updateThemeToggle();

    btn.addEventListener('click', () => {
        const current = page.getAttribute('data-color-scheme');
        const next = current === 'dark' ? 'light' : 'dark';
        page.setAttribute('data-color-scheme', next);
        localStorage.setItem('color-scheme', next);
        updateThemeToggle();
    });

    function updateThemeToggle() {
        const isDark = page.getAttribute('data-color-scheme') === 'dark';
        btn.setAttribute('aria-pressed', String(isDark));
        if (sun) sun.style.display = isDark ? 'none' : '';
        if (moon) moon.style.display = isDark ? '' : 'none';
    }
})();
