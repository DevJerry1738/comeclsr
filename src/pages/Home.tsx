import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import m1 from "@/assets/m1.jpg";
import m2 from "@/assets/m2.jpg";
import m3 from "@/assets/m3.jpg";
import m4 from "@/assets/m4.jpg";

const translations = {
  en: {
    modal_title: "Your next connection isn't random—it's already happening.",
    modal_p1: "With ComeClsr, attraction starts before you even make a move. Women nearby are discovering profiles, pausing, and showing interest in real time.",
    modal_p2: "No long bios. No pressure. Just real attention, real curiosity, and real chances to connect.",
    modal_p3: "<strong>Take the step.</strong>",
    modal_btn: "ACCEPT AND CONTINUE +18",
    nav_how: "How It Works",
    nav_features: "Features",
    nav_showcase: "Showcase",
    nav_join: "Join",
    hero_line1: "Be seen.",
    hero_line2: "Be wanted.",
    hero_line3: "Come closer.",
    hero_subtext: "Real-time attraction. Real curiosity. Real connections — waiting to happen.",
    hero_get_started: "Get Started",
    hero_login: "Login",
    how_label: "How It Works",
    how_title: "Connection made effortless.",
    how_desc: "Four simple steps to turn curiosity into connection. No games, just real-time interest.",
    step1_num: "Step 1",
    step1_title: "Create a Minimal Profile",
    step1_desc: "No long bios. Just enough to spark real interest.",
    step2_num: "Step 2",
    step2_title: "Be Discovered",
    step2_desc: "Women nearby see your profile and pause when intrigued.",
    step3_num: "Step 3",
    step3_title: "Feel Real-Time Interest",
    step3_desc: "Get notified when someone shows interest. Attraction, live.",
    step4_num: "Step 4",
    step4_title: "Connect & Come Closer",
    step4_desc: "Mutual interest unlocks the chat. No pressure, just possibility.",
    feat_label: "Features",
    feat_title: "Designed for real attraction.",
    feat_desc: "Every feature is built to accelerate genuine connection — not waste your time.",
    feat1_title: "Real-Time Interest Discovery",
    feat1_desc: "See who's looking at your profile right now. Attraction becomes visible the moment it happens.",
    feat2_title: "Minimal Profiles",
    feat2_desc: "No lengthy questionnaires. Just enough presence to let real chemistry do the talking.",
    feat3_title: "Fast Connections",
    feat3_desc: "When interest is mutual, connection is instant. No swiping marathons, no ghosting culture.",
    show_label: "Visual Showcase",
    show_title: "See the vibe.",
    show_desc: "A glimpse into the world of COMECLSR — where real people make real connections.",
    cta_title: "Ready to come closer?",
    cta_desc: "Your next connection isn't waiting for a perfect moment — it's waiting for you to show up.",
    cta_btn: "Get Started Now",
    footer_privacy: "Privacy",
    footer_terms: "Terms",
    footer_tagline: "Be seen. Be wanted. Come closer."
  },
  es: {
    modal_title: "Tu próxima conexión no es casualidad — ya está sucediendo.",
    modal_p1: "Con ComeClsr, la atracción comienza antes de que hagas un movimiento. Mujeres cercanas están descubriendo perfiles, pausando y mostrando interés en tiempo real.",
    modal_p2: "Sin biografías largas. Sin presión. Solo atención real, curiosidad real y oportunidades reales de conectar.",
    modal_p3: "<strong>Da el paso.</strong>",
    modal_btn: "ACEPTAR Y CONTINUAR +18",
    nav_how: "Cómo Funciona",
    nav_features: "Características",
    nav_showcase: "Galería",
    nav_join: "Únete",
    hero_line1: "Sé visto.",
    hero_line2: "Sé deseado.",
    hero_line3: "Acércate.",
    hero_subtext: "Atracción en tiempo real. Curiosidad real. Conexiones reales — esperando suceder.",
    hero_get_started: "Comenzar",
    hero_login: "Iniciar Sesión",
    how_label: "Cómo Funciona",
    how_title: "Conexión sin esfuerzo.",
    how_desc: "Cuatro pasos simples para convertir la curiosidad en conexión. Sin juegos, solo interés en tiempo real.",
    step1_num: "Paso 1",
    step1_title: "Crea un Perfil Mínimo",
    step1_desc: "Sin biografías largas. Solo lo necesario para despertar interés real.",
    step2_num: "Paso 2",
    step2_title: "Sé Descubierto",
    step2_desc: "Mujeres cercanas ven tu perfil y se detienen cuando están intrigadas.",
    step3_num: "Paso 3",
    step3_title: "Siente el Interés en Vivo",
    step3_desc: "Recibe notificaciones cuando alguien muestra interés. Atracción, en vivo.",
    step4_num: "Paso 4",
    step4_title: "Conecta y Acércate",
    step4_desc: "El interés mutuo desbloquea el chat. Sin presión, solo posibilidad.",
    feat_label: "Características",
    feat_title: "Diseñado para la atracción real.",
    feat_desc: "Cada función está diseñada para acelerar la conexión genuina — no para hacerte perder el tiempo.",
    feat1_title: "Descubrimiento de Interés en Vivo",
    feat1_desc: "Ve quién está mirando tu perfil ahora mismo. La atracción se vuelve visible en el momento.",
    feat2_title: "Perfiles Mínimos",
    feat2_desc: "Sin cuestionarios largos. Solo la presencia suficiente para que la química real hable.",
    feat3_title: "Conexiones Rápidas",
    feat3_desc: "Cuando el interés es mutuo, la conexión es instantánea. Sin maratones de deslizamiento.",
    show_label: "Galería Visual",
    show_title: "Siente la vibra.",
    show_desc: "Un vistazo al mundo de COMECLSR — donde personas reales hacen conexiones reales.",
    cta_title: "¿Listo para acercarte?",
    cta_desc: "Tu próxima conexión no espera el momento perfecto — te espera a ti.",
    cta_btn: "Comenzar Ahora",
    footer_privacy: "Privacidad",
    footer_terms: "Términos",
    footer_tagline: "Sé visto. Sé deseado. Acércate."
  },
  fr: {
    modal_title: "Votre prochaine connexion n'est pas due au hasard — elle se produit déjà.",
    modal_p1: "Avec ComeClsr, l'attraction commence avant même que vous ne fassiez un geste. Les femmes à proximité découvrent des profils, s'arrêtent et montrent de l'intérêt en temps réel.",
    modal_p2: "Pas de longues bios. Pas de pression. Juste une vraie attention, une vraie curiosité et de vraies chances de se connecter.",
    modal_p3: "<strong>Faites le pas.</strong>",
    modal_btn: "ACCEPTER ET CONTINUER +18",
    nav_how: "Fonctionnement",
    nav_features: "Fonctionnalités",
    nav_showcase: "Galerie",
    nav_join: "Rejoindre",
    hero_line1: "Soyez vu.",
    hero_line2: "Soyez désiré.",
    hero_line3: "Rapprochez-vous.",
    hero_subtext: "Attraction en temps réel. Vraie curiosité. Vraies connexions — prêtes à se produire.",
    hero_get_started: "Commencer",
    hero_login: "Connexion",
    how_label: "Fonctionnement",
    how_title: "Connexion sans effort.",
    how_desc: "Quatre étapes simples pour transformer la curiosité en connexion. Sans jeux, juste de l'intérêt en direct.",
    step1_num: "Étape 1",
    step1_title: "Créez un Profil Minimal",
    step1_desc: "Pas de longues bios. Juste assez pour susciter un réel intérêt.",
    step2_num: "Étape 2",
    step2_title: "Soyez Découvert",
    step2_desc: "Les femmes à proximité voient votre profil et s'arrêtent quand elles sont intriguées.",
    step3_num: "Étape 3",
    step3_title: "Ressentez l'Intérêt en Direct",
    step3_desc: "Soyez notifié quand quelqu'un montre de l'intérêt. L'attraction, en direct.",
    step4_num: "Étape 4",
    step4_title: "Connectez-vous et Rapprochez-vous",
    step4_desc: "L'intérêt mutuel débloque le chat. Sans pression, juste des possibilités.",
    feat_label: "Fonctionnalités",
    feat_title: "Conçu pour l'attraction réelle.",
    feat_desc: "Chaque fonctionnalité est conçue pour accélérer les connexions authentiques.",
    feat1_title: "Découverte d'Intérêt en Direct",
    feat1_desc: "Voyez qui regarde votre profil en ce moment. L'attraction devient visible instantanément.",
    feat2_title: "Profils Minimaux",
    feat2_desc: "Pas de longs questionnaires. Juste assez de présence pour laisser la chimie opérer.",
    feat3_title: "Connexions Rapides",
    feat3_desc: "Quand l'intérêt est mutuel, la connexion est instantanée. Sans longs défilements.",
    show_label: "Galerie Visuelle",
    show_title: "Ressentez l'ambiance.",
    show_desc: "Un aperçu du monde de COMECLSR — où de vraies personnes créent de vraies connexions.",
    cta_title: "Prêt à vous rapprocher ?",
    cta_desc: "Votre prochaine connexion n'attend pas le moment parfait — elle vous attend.",
    cta_btn: "Commencer Maintenant",
    footer_privacy: "Confidentialité",
    footer_terms: "Conditions",
    footer_tagline: "Soyez vu. Soyez désiré. Rapprochez-vous."
  },
  de: {
    modal_title: "Deine nächste Verbindung ist kein Zufall — sie passiert bereits.",
    modal_p1: "Mit ComeClsr beginnt die Anziehung, bevor du einen Schritt machst. Frauen in der Nähe entdecken Profile, verweilen und zeigen Interesse in Echtzeit.",
    modal_p2: "Keine langen Bios. Kein Druck. Nur echte Aufmerksamkeit, echte Neugier und echte Chancen.",
    modal_p3: "<strong>Mach den Schritt.</strong>",
    modal_btn: "AKZEPTIEREN UND WEITER +18",
    nav_how: "So Funktioniert's",
    nav_features: "Funktionen",
    nav_showcase: "Galerie",
    nav_join: "Beitreten",
    hero_line1: "Werde gesehen.",
    hero_line2: "Werde begehrt.",
    hero_line3: "Komm näher.",
    hero_subtext: "Echtzeit-Anziehung. Echte Neugier. Echte Verbindungen — bereit zu entstehen.",
    hero_get_started: "Loslegen",
    hero_login: "Anmelden",
    how_label: "So Funktioniert's",
    how_title: "Verbindung mühelos gemacht.",
    how_desc: "Vier einfache Schritte, um Neugier in Verbindung zu verwandeln. Keine Spielchen, nur Echtzeit-Interesse.",
    step1_num: "Schritt 1",
    step1_title: "Erstelle ein Minimalprofil",
    step1_desc: "Keine langen Bios. Nur genug, um echtes Interesse zu wecken.",
    step2_num: "Schritt 2",
    step2_title: "Werde Entdeckt",
    step2_desc: "Frauen in der Nähe sehen dein Profil und verweilen, wenn sie neugierig sind.",
    step3_num: "Schritt 3",
    step3_title: "Spüre Echtzeit-Interesse",
    step3_desc: "Erhalte Benachrichtigungen, wenn jemand Interesse zeigt. Anziehung, live.",
    step4_num: "Schritt 4",
    step4_title: "Verbinde dich & Komm Näher",
    step4_desc: "Gegenseitiges Interesse öffnet den Chat. Kein Druck, nur Möglichkeiten.",
    feat_label: "Funktionen",
    feat_title: "Entwickelt für echte Anziehung.",
    feat_desc: "Jede Funktion ist darauf ausgelegt, echte Verbindungen zu beschleunigen.",
    feat1_title: "Echtzeit-Interessen-Entdeckung",
    feat1_desc: "Sieh, wer gerade dein Profil betrachtet. Anziehung wird sichtbar, sobald sie passiert.",
    feat2_title: "Minimalprofile",
    feat2_desc: "Keine langen Fragebögen. Nur genug Präsenz, damit die Chemie wirken kann.",
    feat3_title: "Schnelle Verbindungen",
    feat3_desc: "Bei gegenseitigem Interesse ist die Verbindung sofort da. Kein endloses Wischen.",
    show_label: "Visuelle Galerie",
    show_title: "Spüre die Stimmung.",
    show_desc: "Ein Blick in die Welt von COMECLSR — wo echte Menschen echte Verbindungen schaffen.",
    cta_title: "Bereit, näher zu kommen?",
    cta_desc: "Deine nächste Verbindung wartet nicht auf den perfekten Moment — sie wartet auf dich.",
    cta_btn: "Jetzt Loslegen",
    footer_privacy: "Datenschutz",
    footer_terms: "AGB",
    footer_tagline: "Werde gesehen. Werde begehrt. Komm näher."
  }
};

const showcaseImages = [m1, m2, m3, m4];

export default function Home() {
  const [entryModalOpen, setEntryModalOpen] = useState(() => {
    return sessionStorage.getItem("comeclsr_entry_accepted") !== "true";
  });
  const [theme, setTheme] = useState<"light" | "dark" | string>(() => {
    const saved = localStorage.getItem("comeclsr_theme");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });
  const [language, setLanguage] = useState<"en" | "es" | "fr" | "de">(() => {
    const saved = localStorage.getItem("comeclsr_lang") as "en" | "es" | "fr" | "de";
    if (["en", "es", "fr", "de"].includes(saved)) return saved;
    return "en";
  });
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());

  const navbarRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLImageElement>(null);

  const t = translations[language];

  // Dynamic stylesheet, script, and font-awesome loaders scoped for the homepage
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "COMECLSR — Be Seen. Be Wanted. Come Closer.";

    // Inject Bootstrap 5 CSS
    const bootstrapLink = document.createElement("link");
    bootstrapLink.rel = "stylesheet";
    bootstrapLink.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.4/dist/css/bootstrap.min.css";
    bootstrapLink.id = "bootstrap-css";
    document.head.appendChild(bootstrapLink);

    // Inject Font Awesome 6.5.1
    const faLink = document.createElement("link");
    faLink.rel = "stylesheet";
    faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    faLink.id = "font-awesome-css";
    document.head.appendChild(faLink);

    // Inject Google Fonts
    const fontsLink = document.createElement("link");
    fontsLink.rel = "stylesheet";
    fontsLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap";
    fontsLink.id = "google-fonts-css";
    document.head.appendChild(fontsLink);

    // Inject exact custom style tag substituting Vite-hashed asset
    const customStyle = document.createElement("style");
    customStyle.id = "home-custom-styles";
    customStyle.innerHTML = `
      :root {
          --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --font-heading: 'Playfair Display', 'Times New Roman', serif;
          --transition-smooth: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          --transition-bounce: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          --glass-bg-light: rgba(255, 255, 255, 0.55);
          --glass-bg-dark: rgba(20, 20, 30, 0.6);
          --glass-border-light: rgba(255, 255, 255, 0.35);
          --glass-border-dark: rgba(255, 255, 255, 0.1);
          --shadow-soft: 0 8px 40px rgba(0, 0, 0, 0.06);
          --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.08);
          --shadow-glow: 0 0 60px rgba(255, 90, 120, 0.15);
          --accent: #e8546e;
          --accent-soft: #f4728a;
          --accent-glow: #ff6b81;
          --bg-light: rgba(250, 249, 248, 0.85);
          --bg-dark: rgba(15, 14, 20, 0.88);
          --text-light: #2c2a2e;
          --text-dark: #e8e6e3;
          --card-bg-light: rgba(255, 255, 255, 0.7);
          --card-bg-dark: rgba(26, 25, 33, 0.7);
      }

      [data-bs-theme="dark"] {
          --glass-bg: var(--glass-bg-dark);
          --glass-border: var(--glass-border-dark);
          --bg: var(--bg-dark);
          --text: var(--text-dark);
          --card-bg: var(--card-bg-dark);
      }
      [data-bs-theme="light"] {
          --glass-bg: var(--glass-bg-light);
          --glass-border: var(--glass-border-light);
          --bg: var(--bg-light);
          --text: var(--text-light);
          --card-bg: var(--card-bg-light);
      }

      html {
          scroll-behavior: smooth !important;
          font-size: 16px !important;
      }

      body.home-active {
          font-family: var(--font-body) !important;
          background-color: #1a0a14 !important;
          color: var(--text) !important;
          transition: background-color 0.5s ease, color 0.5s ease !important;
          overflow-x: hidden !important;
          line-height: 1.6 !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          position: relative !important;
          min-height: 100vh !important;
      }

      body.home-active::before {
          content: '';
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: -2;
          background-image: url('${m4}');
          background-size: cover;
          background-position: center 30%;
          background-repeat: no-repeat;
          background-attachment: fixed;
          filter: brightness(0.7) saturate(0.9);
          transition: filter 0.5s ease;
      }

      body.home-active::after {
          content: '';
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          background: linear-gradient(135deg,
                  rgba(20, 10, 18, 0.45) 0%,
                  rgba(10, 8, 16, 0.5) 40%,
                  rgba(15, 10, 20, 0.45) 100%);
          transition: background 0.5s ease;
          pointer-events: none;
      }

      [data-bs-theme="light"] body.home-active::after {
          background: linear-gradient(135deg,
                  rgba(255, 245, 250, 0.6) 0%,
                  rgba(250, 240, 248, 0.65) 40%,
                  rgba(255, 248, 252, 0.6) 100%) !important;
      }

      [data-bs-theme="dark"] body.home-active::after {
          background: linear-gradient(135deg,
                  rgba(10, 6, 14, 0.7) 0%,
                  rgba(8, 4, 12, 0.75) 40%,
                  rgba(12, 8, 18, 0.7) 100%) !important;
      }

      .hero-overlay {
          display: none !important;
      }

      .navbar {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 1050 !important;
          padding: 0.75rem 1.5rem !important;
          transition: all var(--transition-smooth) !important;
          background: transparent !important;
      }
      .navbar-collapse {
          visibility: visible !important;
      }
      .navbar.scrolled {
          background: var(--glass-bg) !important;
          backdrop-filter: blur(18px) !important;
          -webkit-backdrop-filter: blur(18px) !important;
          border-bottom: 1px solid var(--glass-border) !important;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05) !important;
      }
      .navbar-brand {
          font-family: var(--font-heading) !important;
          font-weight: 700 !important;
          font-size: 1.55rem !important;
          letter-spacing: 0.06em !important;
          color: #fff !important;
          transition: color var(--transition-smooth) !important;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
      }
      .navbar.scrolled .navbar-brand {
          color: var(--text) !important;
          text-shadow: none !important;
      }
      .navbar .nav-link {
          color: rgba(255, 255, 255, 0.9) !important;
          font-weight: 500 !important;
          margin: 0 0.3rem !important;
          transition: color var(--transition-smooth) !important;
          font-size: 0.95rem !important;
          letter-spacing: 0.02em !important;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4) !important;
          cursor: pointer !important;
      }
      .navbar.scrolled .nav-link {
          color: var(--text) !important;
          text-shadow: none !important;
      }
      .navbar .nav-link:hover {
          color: var(--accent-glow) !important;
      }
      .theme-toggle-btn {
          background: transparent !important;
          border: 1.5px solid rgba(255, 255, 255, 0.6) !important;
          color: #fff !important;
          border-radius: 50% !important;
          width: 38px !important;
          height: 38px !important;
          cursor: pointer !important;
          font-size: 1rem !important;
          transition: all var(--transition-smooth) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
      }
      .navbar.scrolled .theme-toggle-btn {
          border-color: var(--text) !important;
          color: var(--text) !important;
      }
      .theme-toggle-btn:hover {
          background: var(--accent) !important;
          border-color: var(--accent) !important;
          color: #fff !important;
          transform: rotate(20deg) !important;
      }
      .lang-switch {
          background: transparent !important;
          border: 1.5px solid rgba(255, 255, 255, 0.6) !important;
          color: #fff !important;
          border-radius: 20px !important;
          padding: 0.35rem 0.9rem !important;
          cursor: pointer !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          transition: all var(--transition-smooth) !important;
          letter-spacing: 0.03em !important;
      }
      .navbar.scrolled .lang-switch {
          border-color: var(--text) !important;
          color: var(--text) !important;
      }
      .lang-switch:hover {
          background: var(--accent) !important;
          border-color: var(--accent) !important;
          color: #fff !important;
      }

      /* ========== HERO ========== */
      .hero-section {
          position: relative !important;
          min-height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          background: transparent !important;
      }
      .hero-bg-img {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          opacity: 0.35 !important;
          pointer-events: none !important;
          animation: heroBgPulse 8s ease-in-out infinite !important;
          z-index: 0 !important;
      }
      @keyframes heroBgPulse {
          0%,
          100% {
              opacity: 0.3;
          }
          50% {
              opacity: 0.45;
          }
      }
      .hero-content {
          position: relative !important;
          z-index: 2 !important;
          text-align: center !important;
          padding: 2rem !important;
          max-width: 750px !important;
      }
      .hero-headline {
          font-family: var(--font-heading) !important;
          font-size: clamp(2.8rem, 7vw, 5.5rem) !important;
          font-weight: 700 !important;
          line-height: 1.1 !important;
          color: #ffffff !important;
          text-shadow: 0 4px 30px rgba(0, 0, 0, 0.6) !important;
          letter-spacing: -0.01em !important;
      }
      .hero-headline .line {
          display: block;
          opacity: 0;
          transform: translateY(30px);
          animation: fadeSlideUp 0.9s ease forwards;
      }
      .hero-headline .line:nth-child(1) {
          animation-delay: 0.15s;
      }
      .hero-headline .line:nth-child(2) {
          animation-delay: 0.35s;
      }
      .hero-headline .line:nth-child(3) {
          animation-delay: 0.55s;
          background: linear-gradient(135deg, #ff6b81, #ff3d5c, #ff8fa3) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          font-weight: 800 !important;
      }
      @keyframes fadeSlideUp {
          to {
              opacity: 1;
              transform: translateY(0);
          }
      }
      .hero-subtext {
          font-size: 1.2rem !important;
          color: rgba(255, 255, 255, 0.9) !important;
          margin-top: 1.2rem !important;
          margin-bottom: 2.5rem !important;
          opacity: 0;
          animation: fadeSlideUp 0.9s ease forwards;
          animation-delay: 0.7s;
          font-weight: 400 !important;
          letter-spacing: 0.02em !important;
          max-width: 550px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4) !important;
      }
      .hero-btns {
          display: flex !important;
          gap: 1rem !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          opacity: 0;
          animation: fadeSlideUp 0.9s ease forwards;
          animation-delay: 0.9s;
      }
      .btn-hero-primary {
          background: linear-gradient(135deg, #e8546e, #d43d58) !important;
          color: #fff !important;
          border: none !important;
          padding: 0.85rem 2.4rem !important;
          border-radius: 50px !important;
          font-weight: 600 !important;
          font-size: 1.05rem !important;
          letter-spacing: 0.03em !important;
          transition: all var(--transition-bounce) !important;
          box-shadow: 0 8px 30px rgba(232, 84, 110, 0.4) !important;
          position: relative !important;
          overflow: hidden !important;
          text-decoration: none !important;
          display: inline-block !important;
      }
      .btn-hero-primary:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 14px 40px rgba(232, 84, 110, 0.55) !important;
          background: linear-gradient(135deg, #f06078, #e04055) !important;
          color: #fff !important;
      }
      .btn-hero-outline {
          background: transparent !important;
          color: #fff !important;
          border: 2px solid rgba(255, 255, 255, 0.7) !important;
          padding: 0.85rem 2.4rem !important;
          border-radius: 50px !important;
          font-weight: 600 !important;
          font-size: 1.05rem !important;
          letter-spacing: 0.03em !important;
          transition: all var(--transition-bounce) !important;
          backdrop-filter: blur(4px) !important;
          text-decoration: none !important;
          display: inline-block !important;
      }
      .btn-hero-outline:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: #fff !important;
          transform: translateY(-3px) !important;
          color: #fff !important;
          box-shadow: 0 8px 30px rgba(255, 255, 255, 0.15) !important;
      }
      .scroll-indicator {
          position: absolute !important;
          bottom: 2rem !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 2 !important;
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 1.8rem !important;
          animation: bounceDown 2s ease-in-out infinite !important;
          cursor: pointer !important;
          transition: color var(--transition-smooth) !important;
      }
      .scroll-indicator:hover {
          color: #fff !important;
      }
      @keyframes bounceDown {
          0%,
          100% {
              transform: translateX(-50%) translateY(0);
          }
          50% {
              transform: translateX(-50%) translateY(14px);
          }
      }

      /* ========== SECTION COMMONS ========== */
      .section-padding {
          padding: 6rem 1.5rem !important;
          position: relative !important;
          z-index: 1 !important;
      }
      @media (max-width: 768px) {
          .section-padding {
              padding: 4rem 1rem !important;
          }
      }
      .section-label {
          font-size: 0.8rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          color: var(--accent) !important;
          font-weight: 700 !important;
          margin-bottom: 0.5rem !important;
          display: block !important;
      }
      .section-title {
          font-family: var(--font-heading) !important;
          font-size: clamp(2rem, 4.5vw, 3.2rem) !important;
          font-weight: 700 !important;
          margin-bottom: 1rem !important;
          letter-spacing: -0.02em !important;
          color: var(--text) !important;
      }
      .section-desc {
          font-size: 1.1rem !important;
          color: var(--text) !important;
          opacity: 0.8 !important;
          max-width: 550px !important;
          margin: 0 auto 3rem !important;
      }

      /* ========== HOW IT WORKS ========== */
      #how-it-works {
          background: transparent !important;
          position: relative !important;
          z-index: 1 !important;
      }
      .step-card {
          background: var(--card-bg) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border-radius: 20px !important;
          padding: 2.5rem 1.8rem !important;
          text-align: center !important;
          border: 1px solid var(--glass-border) !important;
          transition: all var(--transition-smooth) !important;
          box-shadow: var(--shadow-card) !important;
          position: relative !important;
          overflow: hidden !important;
          height: 100% !important;
      }
      .step-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: var(--shadow-glow), 0 16px 48px rgba(0, 0, 0, 0.12) !important;
          border-color: var(--accent-soft) !important;
      }
      .step-icon {
          width: 70px !important;
          height: 70px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, rgba(232, 84, 110, 0.15), rgba(255, 107, 129, 0.2)) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto 1.4rem !important;
          font-size: 1.8rem !important;
          color: var(--accent) !important;
          transition: all var(--transition-bounce) !important;
      }
      .step-card:hover .step-icon {
          transform: scale(1.1) !important;
          background: linear-gradient(135deg, var(--accent), var(--accent-soft)) !important;
          color: #fff !important;
          box-shadow: 0 8px 28px rgba(232, 84, 110, 0.35) !important;
      }
      .step-number {
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.12em !important;
          color: var(--accent) !important;
          text-transform: uppercase !important;
          margin-bottom: 0.3rem !important;
      }
      .step-title {
          font-weight: 700 !important;
          font-size: 1.2rem !important;
          margin-bottom: 0.5rem !important;
          color: var(--text) !important;
      }
      .step-desc {
          font-size: 0.9rem !important;
          opacity: 0.75 !important;
          line-height: 1.5 !important;
          color: var(--text) !important;
      }

      /* ========== FEATURES ========== */
      #features {
          background: transparent !important;
          position: relative !important;
          z-index: 1 !important;
      }
      #features::before {
          content: '' !important;
          position: absolute !important;
          inset: 0 !important;
          background: radial-gradient(ellipse at 30% 50%, rgba(232, 84, 110, 0.04) 0%, transparent 60%) !important;
          pointer-events: none !important;
          z-index: 0 !important;
      }
      .feature-card {
          background: var(--card-bg) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border-radius: 22px !important;
          padding: 2.2rem 1.8rem !important;
          border: 1px solid var(--glass-border) !important;
          transition: all var(--transition-smooth) !important;
          box-shadow: var(--shadow-card) !important;
          height: 100% !important;
          position: relative !important;
          overflow: hidden !important;
          cursor: default !important;
          z-index: 1 !important;
      }
      .feature-card::after {
          content: '' !important;
          position: absolute !important;
          top: -50% !important;
          left: -50% !important;
          width: 200% !important;
          height: 200% !important;
          background: radial-gradient(circle, rgba(232, 84, 110, 0.06) 0%, transparent 70%) !important;
          opacity: 0 !important;
          transition: opacity var(--transition-smooth) !important;
          pointer-events: none !important;
      }
      .feature-card:hover::after {
          opacity: 1 !important;
      }
      .feature-card:hover {
          transform: translateY(-6px) !important;
          box-shadow: var(--shadow-glow), 0 20px 50px rgba(0, 0, 0, 0.12) !important;
          border-color: var(--accent-soft) !important;
      }
      .feature-icon {
          font-size: 2.2rem !important;
          color: var(--accent) !important;
          margin-bottom: 1rem !important;
          transition: transform var(--transition-bounce) !important;
      }
      .feature-card:hover .feature-icon {
          transform: scale(1.15) !important;
      }
      .feature-title {
          font-weight: 700 !important;
          font-size: 1.25rem !important;
          margin-bottom: 0.5rem !important;
          color: var(--text) !important;
      }
      .feature-desc {
          font-size: 0.9rem !important;
          opacity: 0.75 !important;
          color: var(--text) !important;
      }

      /* ========== VISUAL SHOWCASE ========== */
      #showcase {
          background: transparent !important;
          position: relative !important;
          z-index: 1 !important;
      }
      .showcase-carousel {
          border-radius: 20px !important;
          overflow: hidden !important;
          box-shadow: var(--shadow-soft) !important;
          background: var(--card-bg) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          border: 1px solid var(--glass-border) !important;
      }
      .showcase-img {
          width: 100% !important;
          height: 420px !important;
          object-fit: cover !important;
          border-radius: 20px !important;
          transition: transform 0.6s ease !important;
      }
      @media (max-width: 768px) {
          .showcase-img {
              height: 280px !important;
          }
      }
      .carousel-control-prev,
      .carousel-control-next {
          width: 44px !important;
          height: 44px !important;
          border-radius: 50% !important;
          background: var(--glass-bg) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid var(--glass-border) !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          opacity: 0.85 !important;
          transition: all var(--transition-smooth) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-style: none !important;
          color: var(--text) !important;
      }
      .carousel-control-prev:hover,
      .carousel-control-next:hover {
          opacity: 1 !important;
          background: var(--accent) !important;
          border-color: var(--accent) !important;
          color: #fff !important;
      }
      .carousel-indicators button {
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
          border: 2px solid var(--accent) !important;
          background: transparent !important;
          transition: all var(--transition-smooth) !important;
      }
      .carousel-indicators button.active {
          background: var(--accent) !important;
          width: 28px !important;
          border-radius: 10px !important;
      }

      /* ========== CTA ========== */
      #cta {
          background: transparent !important;
          position: relative !important;
          overflow: hidden !important;
          text-align: center !important;
          padding: 7rem 1.5rem !important;
          z-index: 1 !important;
      }
      #cta::before {
          content: '' !important;
          position: absolute !important;
          inset: 0 !important;
          background: radial-gradient(ellipse at center, rgba(232, 84, 110, 0.25) 0%, transparent 70%) !important;
          pointer-events: none !important;
          z-index: 0 !important;
      }
      #cta .cta-content {
          position: relative !important;
          z-index: 2 !important;
          max-width: 600px !important;
          margin: 0 auto !important;
      }
      #cta .cta-title {
          font-family: var(--font-heading) !important;
          font-size: clamp(2.2rem, 5vw, 3.5rem) !important;
          font-weight: 700 !important;
          color: #fff !important;
          margin-bottom: 1rem !important;
          letter-spacing: -0.02em !important;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
      }
      #cta .cta-desc {
          color: rgba(255, 255, 255, 0.9) !important;
          font-size: 1.1rem !important;
          margin-bottom: 2.5rem !important;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
      }
      #cta .btn-hero-primary {
          font-size: 1.1rem !important;
          padding: 0.95rem 3rem !important;
      }

      /* ========== FOOTER ========== */
      footer {
          background: var(--card-bg) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border-top: 1px solid var(--glass-border) !important;
          padding: 2rem 1.5rem !important;
          text-align: center !important;
          font-size: 0.85rem !important;
          opacity: 0.8 !important;
          position: relative !important;
          z-index: 1 !important;
          color: var(--text) !important;
      }
      footer a {
          color: var(--accent) !important;
          text-decoration: none !important;
          font-weight: 500 !important;
      }
      footer a:hover {
          text-decoration: underline !important;
      }

      /* ========== ENTRY MODAL ========== */
      .entry-modal-backdrop {
          position: fixed !important;
          inset: 0 !important;
          z-index: 9999 !important;
          background: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          animation: fadeIn 0.5s ease !important;
      }
      @keyframes fadeIn {
          from {
              opacity: 0;
          }
          to {
              opacity: 1;
          }
      }
      .entry-modal {
          background: var(--card-bg) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-radius: 24px !important;
          padding: 3rem 2rem !important;
          max-width: 520px !important;
          width: 90% !important;
          text-align: center !important;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5) !important;
          animation: modalSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          border: 1px solid var(--glass-border) !important;
          position: relative !important;
      }
      @keyframes modalSlideUp {
          from {
              opacity: 0;
              transform: translateY(50px) scale(0.92);
          }
          to {
              opacity: 1;
              transform: translateY(0) scale(1);
          }
      }
      .entry-modal .modal-icon {
          font-size: 3rem !important;
          margin-bottom: 1rem !important;
          color: var(--accent) !important;
          animation: pulseIcon 2s ease-in-out infinite !important;
      }
      @keyframes pulseIcon {
          0%,
          100% {
              transform: scale(1);
          }
          50% {
              transform: scale(1.15);
          }
      }
      .entry-modal h3 {
          font-family: var(--font-heading) !important;
          font-weight: 700 !important;
          font-size: 1.6rem !important;
          margin-bottom: 1rem !important;
          letter-spacing: -0.02em !important;
          color: var(--text) !important;
      }
      .entry-modal p {
          font-size: 0.95rem !important;
          opacity: 0.8 !important;
          line-height: 1.7 !important;
          margin-bottom: 0.8rem !important;
          color: var(--text) !important;
      }
      .entry-modal .btn-accept {
          background: linear-gradient(135deg, #e8546e, #d43d58) !important;
          color: #fff !important;
          border: none !important;
          padding: 0.9rem 2.5rem !important;
          border-radius: 50px !important;
          font-weight: 700 !important;
          font-size: 1rem !important;
          letter-spacing: 0.04em !important;
          cursor: pointer !important;
          transition: all var(--transition-bounce) !important;
          box-shadow: 0 10px 30px rgba(232, 84, 110, 0.4) !important;
          margin-top: 1rem !important;
      }
      .entry-modal .btn-accept:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 16px 40px rgba(232, 84, 110, 0.55) !important;
          background: linear-gradient(135deg, #f06078, #e04055) !important;
      }

      /* ========== ANIMATIONS ON SCROLL ========== */
      .reveal {
          opacity: 0 !important;
          transform: translateY(40px) !important;
          transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
      }
      .reveal.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
      }
      .reveal-delay-1 {
          transition-delay: 0.1s !important;
      }
      .reveal-delay-2 {
          transition-delay: 0.2s !important;
      }
      .reveal-delay-3 {
          transition-delay: 0.3s !important;
      }
      .reveal-delay-4 {
          transition-delay: 0.4s !important;
      }

      /* ========== RESPONSIVE ========== */
      @media (max-width: 576px) {
          .hero-headline {
              font-size: 2.2rem !important;
          }
          .hero-subtext {
              font-size: 1rem !important;
          }
          .btn-hero-primary,
          .btn-hero-outline {
              padding: 0.7rem 1.6rem !important;
              font-size: 0.9rem !important;
              width: 100% !important;
          }
          .hero-btns {
              flex-direction: column !important;
              align-items: center !important;
          }
          .navbar {
              padding: 0.5rem 0.8rem !important;
          }
          .navbar-brand {
              font-size: 1.2rem !important;
          }
      }
    `;
    document.head.appendChild(customStyle);

    // Apply active class to body for scoped styling
    document.body.classList.add("home-active");

    return () => {
      document.title = prevTitle;
      document.getElementById("bootstrap-css")?.remove();
      document.getElementById("font-awesome-css")?.remove();
      document.getElementById("google-fonts-css")?.remove();
      document.getElementById("home-custom-styles")?.remove();
      document.body.classList.remove("home-active");
    };
  }, []);

  // Sync theme with data-bs-theme attribute on document root (matching standard HTML CSS selectors)
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("comeclsr_theme", theme);
  }, [theme]);

  // Handle body scroll locking based on modal state
  useEffect(() => {
    if (entryModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [entryModalOpen]);

  // Scroll Event for Scrolled Navbar styling class
  useEffect(() => {
    const handleScroll = () => {
      setNavbarScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto cycle Showcase Carousel images every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % showcaseImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // IntersectionObserver for Reveal-on-Scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.18,
      rootMargin: "0px 0px -40px 0px",
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleElements((prev) => {
            const next = new Set(prev);
            next.add(entry.target.id);
            return next;
          });
          revealObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => revealObserver.observe(el));

    return () => revealObserver.disconnect();
  }, []);

  // Subtle Hero Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroBgRef.current && window.innerWidth > 768) {
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight) {
          const offset = scrollY * 0.35;
          heroBgRef.current.style.transform = `translateY(${offset}px) scale(1.05)`;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAcceptEntry = () => {
    sessionStorage.setItem("comeclsr_entry_accepted", "true");
    setEntryModalOpen(false);
  };

  const handleLangSwitch = () => {
    const langCycle: ("en" | "es" | "fr" | "de")[] = ["en", "es", "fr", "de"];
    const currentIdx = langCycle.indexOf(language);
    const nextIdx = (currentIdx + 1) % langCycle.length;
    const nextLang = langCycle[nextIdx];
    setLanguage(nextLang);
    localStorage.setItem("comeclsr_lang", nextLang);
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      const navbarHeight = navbarRef.current?.offsetHeight || 80;
      const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 10;
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    }
    setIsNavCollapsed(true);
  };

  const handleScrollDown = () => {
    const targetEl = document.getElementById("how-it-works");
    if (targetEl) {
      const navbarHeight = navbarRef.current?.offsetHeight || 80;
      const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 10;
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    }
  };

  const isVisible = (id: string) => visibleElements.has(id);

  return (
    <>
      {/* ==================== ENTRY MODAL ==================== */}
      {entryModalOpen && (
        <div className="entry-modal-backdrop" id="entryModal">
          <div className="entry-modal">
            <div className="modal-icon">💫</div>
            <h3 dangerouslySetInnerHTML={{ __html: t.modal_title }} />
            <p dangerouslySetInnerHTML={{ __html: t.modal_p1 }} />
            <p dangerouslySetInnerHTML={{ __html: t.modal_p2 }} />
            <p dangerouslySetInnerHTML={{ __html: t.modal_p3 }} />
            <button className="btn-accept" id="btnAcceptEntry" onClick={handleAcceptEntry}>
              {t.modal_btn}
            </button>
          </div>
        </div>
      )}

      {/* ==================== NAVBAR ==================== */}
      <nav className={`navbar navbar-expand-lg ${navbarScrolled ? "scrolled" : ""}`} id="mainNavbar" ref={navbarRef}>
        <div className="container-fluid">
          <a className="navbar-brand" href="#">COMECLSR</a>
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            aria-controls="navbarContent"
            aria-expanded={!isNavCollapsed}
            aria-label="Toggle navigation"
            style={{ borderColor: "rgba(255,255,255,0.5)" }}
          >
            <span className="navbar-toggler-icon" style={{ filter: "invert(1)" }}></span>
          </button>
          <div className={`collapse navbar-collapse ${isNavCollapsed ? "" : "show"}`} id="navbarContent">
            <ul className="navbar-nav ms-auto align-items-center gap-2">
              <li className="nav-item">
                <a className="nav-link" href="#how-it-works" onClick={(e) => scrollToSection(e, "#how-it-works")}>
                  {t.nav_how}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#features" onClick={(e) => scrollToSection(e, "#features")}>
                  {t.nav_features}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#showcase" onClick={(e) => scrollToSection(e, "#showcase")}>
                  {t.nav_showcase}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#cta" onClick={(e) => scrollToSection(e, "#cta")}>
                  {t.nav_join}
                </a>
              </li>
              <li className="nav-item">
                <button className="lang-switch" id="langSwitch" onClick={handleLangSwitch} title="Switch Language">
                  {language === "en" && "🌐 EN"}
                  {language === "es" && "🌐 ES"}
                  {language === "fr" && "🌐 FR"}
                  {language === "de" && "🌐 DE"}
                </button>
              </li>
              <li className="nav-item ms-2">
                <button className="theme-toggle-btn" id="themeToggle" onClick={handleThemeToggle} title="Toggle Dark/Light Mode">
                  <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} id="themeIcon"></i>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* ==================== HERO SECTION ==================== */}
      <section className="hero-section" id="hero">
        <img
          src={m1}
          alt="Hero Background"
          className="hero-bg-img"
          loading="eager"
          ref={heroBgRef}
        />
        <div className="hero-content">
          <h1 className="hero-headline">
            <span className="line">{t.hero_line1}</span>
            <span className="line">{t.hero_line2}</span>
            <span className="line">{t.hero_line3}</span>
          </h1>
          <p className="hero-subtext">
            {t.hero_subtext}
          </p>
          <div className="hero-btns">
            <Link to="/register" className="btn btn-hero-primary">{t.hero_get_started}</Link>
            <Link to="/login" className="btn btn-hero-outline">{t.hero_login}</Link>
          </div>
        </div>
        <div className="scroll-indicator" id="scrollDownIndicator" onClick={handleScrollDown}>
          <i className="fa-solid fa-chevron-down"></i>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="section-padding" id="how-it-works">
        <div className="container">
          <div className={`text-center mb-5 reveal ${isVisible("how-header") ? "visible" : ""}`} id="how-header">
            <span className="section-label">{t.how_label}</span>
            <h2 className="section-title">{t.how_title}</h2>
            <p className="section-desc">
              {t.how_desc}
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-3 col-sm-6">
              <div className={`step-card reveal reveal-delay-1 ${isVisible("step-1") ? "visible" : ""}`} id="step-1">
                <div className="step-number">{t.step1_num}</div>
                <div className="step-icon"><i className="fa-solid fa-user-plus"></i></div>
                <h5 className="step-title">{t.step1_title}</h5>
                <p className="step-desc">{t.step1_desc}</p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className={`step-card reveal reveal-delay-2 ${isVisible("step-2") ? "visible" : ""}`} id="step-2">
                <div className="step-number">{t.step2_num}</div>
                <div className="step-icon"><i className="fa-solid fa-eye"></i></div>
                <h5 className="step-title">{t.step2_title}</h5>
                <p className="step-desc">{t.step2_desc}</p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className={`step-card reveal reveal-delay-3 ${isVisible("step-3") ? "visible" : ""}`} id="step-3">
                <div className="step-number">{t.step3_num}</div>
                <div className="step-icon"><i className="fa-solid fa-bolt"></i></div>
                <h5 className="step-title">{t.step3_title}</h5>
                <p className="step-desc">{t.step3_desc}</p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className={`step-card reveal reveal-delay-4 ${isVisible("step-4") ? "visible" : ""}`} id="step-4">
                <div className="step-number">{t.step4_num}</div>
                <div className="step-icon"><i className="fa-solid fa-message"></i></div>
                <h5 className="step-title">{t.step4_title}</h5>
                <p className="step-desc">{t.step4_desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="section-padding" id="features">
        <div className="container">
          <div className={`text-center mb-5 reveal ${isVisible("feat-header") ? "visible" : ""}`} id="feat-header">
            <span className="section-label">{t.feat_label}</span>
            <h2 className="section-title">{t.feat_title}</h2>
            <p className="section-desc">
              {t.feat_desc}
            </p>
          </div>
          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className={`feature-card reveal reveal-delay-1 ${isVisible("feat-1") ? "visible" : ""}`} id="feat-1">
                <div className="feature-icon"><i className="fa-solid fa-wave-square"></i></div>
                <h5 className="feature-title">{t.feat1_title}</h5>
                <p className="feature-desc">{t.feat1_desc}</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className={`feature-card reveal reveal-delay-2 ${isVisible("feat-2") ? "visible" : ""}`} id="feat-2">
                <div className="feature-icon"><i className="fa-solid fa-address-card"></i></div>
                <h5 className="feature-title">{t.feat2_title}</h5>
                <p className="feature-desc">{t.feat2_desc}</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className={`feature-card reveal reveal-delay-3 ${isVisible("feat-3") ? "visible" : ""}`} id="feat-3">
                <div className="feature-icon"><i className="fa-solid fa-rocket"></i></div>
                <h5 className="feature-title">{t.feat3_title}</h5>
                <p className="feature-desc">{t.feat3_desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== VISUAL SHOWCASE ==================== */}
      <section className="section-padding" id="showcase">
        <div className="container">
          <div className={`text-center mb-5 reveal ${isVisible("showcase-header") ? "visible" : ""}`} id="showcase-header">
            <span className="section-label">{t.show_label}</span>
            <h2 className="section-title">{t.show_title}</h2>
            <p className="section-desc">{t.show_desc}</p>
          </div>
          <div className={`reveal ${isVisible("carousel-reveal") ? "visible" : ""}`} id="carousel-reveal">
            <div id="showcaseCarousel" className="carousel slide showcase-carousel" data-bs-ride="carousel">
              <div className="carousel-indicators">
                {showcaseImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCarouselIndex(idx)}
                    className={idx === carouselIndex ? "active" : ""}
                    aria-current={idx === carouselIndex ? "true" : "false"}
                  />
                ))}
              </div>
              <div className="carousel-inner">
                {showcaseImages.map((imgSrc, idx) => (
                  <div key={idx} className={`carousel-item ${idx === carouselIndex ? "active" : ""}`}>
                    <img src={imgSrc} className="showcase-img" alt={`Lifestyle ${idx + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
              <button
                className="carousel-control-prev"
                type="button"
                onClick={() => setCarouselIndex((i) => (i - 1 + showcaseImages.length) % showcaseImages.length)}
              >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                onClick={() => setCarouselIndex((i) => (i + 1) % showcaseImages.length)}
              >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section id="cta">
        <div className={`cta-content reveal ${isVisible("cta-content") ? "visible" : ""}`} id="cta-content">
          <h2 className="cta-title">{t.cta_title}</h2>
          <p className="cta-desc">
            {t.cta_desc}
          </p>
          <Link to="/register" className="btn btn-hero-primary">{t.cta_btn}</Link>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer>
        <div className="container">
          <p>
            &copy; 2026 <strong>COMECLSR</strong>. All rights reserved. |{" "}
            <a href="https://comeclsr.com/privacy">{t.footer_privacy}</a> |{" "}
            <a href="https://comeclsr.com/terms">{t.footer_terms}</a>
          </p>
          <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>{t.footer_tagline}</p>
        </div>
      </footer>
    </>
  );
}
