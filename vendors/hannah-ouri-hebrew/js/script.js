// ============================================
// ENVOI À NOTION VIA BACKEND
// ============================================
async function sendToNotion(data, retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/notion/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            result = { success: false, error: `Erreur HTTP ${response.status}` };
        }

        if (!response.ok) {
            const statusCode = result.statusCode || response.status;

            if (statusCode === 410) {
                if (retryCount < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
                    return sendToNotion(data, retryCount + 1);
                }
                return {
                    success: false,
                    error: result.error || 'Le webhook Notion a expiré',
                    statusCode: 410,
                    eventType: result.eventType || data.eventType
                };
            }

            if ((statusCode === 429 || statusCode === 503) && retryCount < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return sendToNotion(data, retryCount + 1);
            }

            return {
                success: false,
                error: result.error || `Erreur HTTP ${response.status}`,
                statusCode: statusCode,
                eventType: result.eventType || data.eventType
            };
        }

        return result;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return sendToNotion(data, retryCount + 1);
        }

        return {
            success: false,
            error: error.message,
            local: true,
            eventType: data.eventType
        };
    }
}

// Variables globales
let currentPage = 'home';
let responses = {};
let isMusicPlaying = false;

// ============================================
// CONTRÔLE DE LA MUSIQUE
// ============================================
function toggleMusic() {
    const music = document.getElementById('bgMusic');
    const toggleBtn = document.getElementById('musicToggle');

    if (isMusicPlaying) {
        music.pause();
        toggleBtn.classList.remove('playing');
    } else {
        music.play().catch(() => {});
        toggleBtn.classList.add('playing');
    }
    isMusicPlaying = !isMusicPlaying;
}

// Mapping transport Houppa pour Notion
const NOTION_VALUE_MAP = {
    'raanana': 'Raanana',
    'tel aviv': 'Tel Aviv'
};

function mapToNotionValue(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
        if (value.length === 0) return null;
        value = value[0];
    }
    if (typeof value !== 'string') return null;
    return NOTION_VALUE_MAP[value.toLowerCase()] || value;
}

// ============================================
// NAVIGATION
// ============================================
function showPage(pageId) {
    try {
        const pages = document.querySelectorAll('.page');
        if (pages.length === 0) return;
        pages.forEach(page => page.classList.remove('active'));

        const targetPage = document.getElementById(pageId);
        if (!targetPage) return;

        targetPage.classList.add('active');

        const navItems = document.querySelectorAll('.nav-menu li');
        navItems.forEach(item => item.classList.remove('active'));

        const navbar = document.getElementById('navbar');
        if (pageId === 'home') {
            navbar.style.display = 'none';
            document.documentElement.classList.add('page-home-active');
            document.body.classList.add('page-home-active');
        } else {
            navbar.style.display = 'block';
            document.documentElement.classList.remove('page-home-active');
            document.body.classList.remove('page-home-active');
            const activeItem = Array.from(navItems).find(item =>
                item.textContent.toLowerCase().includes(getPageDisplayName(pageId).toLowerCase())
            );
            if (activeItem) activeItem.classList.add('active');
        }

        window.scrollTo(0, 0);
        currentPage = pageId;
    } catch (error) {
        // Erreur silencieuse
    }
}

if (typeof window !== 'undefined') {
    window.showPage = showPage;
}

function getPageDisplayName(pageId) {
    const names = {
        'home': 'Accueil',
        'all-events': 'Invitation'
    };
    return names[pageId] || pageId;
}

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    mobileNav.classList.toggle('active');
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
    return false;
}

function navigateToEvent(sectionId) {
    if (currentPage !== 'all-events') {
        showPage('all-events');
        setTimeout(() => {
            scrollToSection(sectionId);
        }, 100);
    } else {
        scrollToSection(sectionId);
    }
}

// ============================================
// COMPTE À REBOURS
// ============================================
function updateCountdown() {
    try {
        const weddingDate = new Date(2026, 7, 12, 18, 0, 0);
        const now = new Date();
        const diff = weddingDate - now;

        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');

        if (!daysEl || !hoursEl || !minutesEl) return;

        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            daysEl.textContent = days.toString().padStart(2, '0');
            hoursEl.textContent = hours.toString().padStart(2, '0');
            minutesEl.textContent = minutes.toString().padStart(2, '0');
        } else {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
        }
    } catch (error) {
        // Erreur silencieuse
    }
}

// ============================================
// FORMULAIRE HOUPPA
// ============================================
function toggleGuestsField(eventType) {
    const attendanceSelect = document.getElementById(`${eventType}-attendance-unified`);
    const guestsGroup = document.getElementById(`${eventType}-guests-group`);
    const guestsInput = document.getElementById(`${eventType}-guests-unified`);

    if (attendanceSelect && guestsGroup) {
        if (attendanceSelect.value === 'oui') {
            guestsGroup.style.display = 'block';
            guestsInput.required = true;
            const transportGroup = document.getElementById('houppa-transport-group');
            if (transportGroup) transportGroup.style.display = 'block';
        } else {
            guestsGroup.style.display = 'none';
            guestsInput.required = false;
            guestsInput.value = '1';
            const transportGroup = document.getElementById('houppa-transport-group');
            if (transportGroup) {
                transportGroup.style.display = 'none';
                transportGroup.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            }
        }
    }
}

async function submitAllResponses(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector('.submit-button');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '⏳ Envoi en cours...';
    submitButton.classList.add('loading');

    const formData = new FormData(event.target);
    const nom = formData.get('nom');
    const prenom = formData.get('prenom');
    const message = formData.get('message');
    const houppaAttendance = formData.get('houppa-attendance');
    const houppaGuests = houppaAttendance === 'oui' ? formData.get('houppa-guests') : null;
    const transportsHouppa = formData.getAll('transport-houppa');
    const transporthouppa = transportsHouppa && transportsHouppa.length > 0
        ? mapToNotionValue(transportsHouppa[0])
        : null;

    const dateFormatted = new Date().toISOString();
    const notionEntry = {
        nom,
        prenom,
        eventType: 'Houppa',
        attendance: houppaAttendance === 'oui' ? 'Oui' : 'Non',
        guests: houppaAttendance === 'oui' && houppaGuests ? parseInt(houppaGuests) || 1 : null,
        message: message || null,
        dateFormatted,
        transporthouppa,
        transportChabbat: null
    };

    let result;
    try {
        result = await sendToNotion(notionEntry);
    } catch (err) {
        result = { success: false, error: err.message };
    }

    const responseKey = `unified_${nom}_${prenom}_${Date.now()}`;
    responses[responseKey] = { nom, prenom, message, evenements: { houppa: { attendance: houppaAttendance, guests: houppaGuests, transport: transportsHouppa || [] } } };
    saveToLocalStorage();

    submitButton.disabled = false;
    submitButton.textContent = originalText;
    submitButton.classList.remove('loading');

    alert('✅ Vos réponses ont été enregistrées avec succès !');

    event.target.reset();
    const houppaGuestsGroup = document.getElementById('houppa-guests-group');
    if (houppaGuestsGroup) houppaGuestsGroup.style.display = 'none';
    const houppaTransportGroup = document.getElementById('houppa-transport-group');
    if (houppaTransportGroup) {
        houppaTransportGroup.style.display = 'none';
        houppaTransportGroup.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// STOCKAGE LOCAL
// ============================================
function saveToLocalStorage() {
    try {
        localStorage.setItem('wedding_responses', JSON.stringify(responses));
    } catch (error) {
        // Erreur silencieuse
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('wedding_responses');
        if (saved) {
            responses = JSON.parse(saved);
        }
    } catch (error) {
        // Erreur silencieuse
    }
}

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    showPage('home');
    updateCountdown();
    setInterval(updateCountdown, 1000);
});

// Fermer le menu mobile en cliquant à l'extérieur
document.addEventListener('click', function(event) {
    const mobileNav = document.getElementById('mobileNav');
    const mobileBtn = document.querySelector('.mobile-menu-btn');

    if (!mobileNav.contains(event.target) && !mobileBtn.contains(event.target)) {
        mobileNav.classList.remove('active');
    }
});

// ============================================
// ANIMATIONS AU SCROLL
// ============================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.event-page').forEach(el => {
        el.classList.add('scroll-reveal');
        observer.observe(el);
    });
}

window.addEventListener('load', () => {
    initScrollAnimations();
});

// ============================================
// ITINÉRAIRE
// ============================================
function openItinerary() {
    const address = 'Terra, Caesarea, Israel';
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(googleMapsUrl, '_blank');
}
