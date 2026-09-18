(() => {
  "use strict";

  const C = window.PAGE_CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const SECRET_KEY = "beisy_unlocked_v1";
  const unlockedStore = loadUnlocked();

  /* ------------------------------------------------------------
     Unlock por fecha
  ------------------------------------------------------------ */
  function loadUnlocked() {
    try {
      const raw = JSON.parse(localStorage.getItem(SECRET_KEY) || "{}");
      return {
        galaxy: !!raw.galaxy,
        letter: !!raw.letter,
        timeline: !!raw.timeline
      };
    } catch (e) {
      return { galaxy: false, letter: false, timeline: false };
    }
  }

  function persist() {
    try { localStorage.setItem(SECRET_KEY, JSON.stringify(unlockedStore)); } catch (e) { /* noop */ }
  }

  function isBefore(dateA, dateB) { return dateA < dateB; }

  function detectSection() {
    if (C.forceUnlock) return true;
    const now = new Date();
    ["galaxy", "letter", "timeline"].forEach((k) => {
      const target = C.unlockDates[k];
      if (target && !isBefore(now, target)) {
        if (!unlockedStore[k]) {
          unlockedStore[k] = true;
          persist();
        }
      }
    });
  }

  function countdownTo(target) {
    if (!target) return "";
    const ms = target.getTime() - Date.now();
    if (ms <= 0) return "En línea";
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${Math.max(1, m)}m`;
  }

  function formatDate(d) {
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}, ${d.getFullYear()}`;
  }

  function renderCards() {
    const heroDate = $("#hero-date");
    if (heroDate) heroDate.textContent = formatDate(new Date());

    $$(".unlock-card").forEach((card) => {
      const key = card.dataset.key;
      const open = unlockedStore[key];
      card.classList.toggle("unlocked", open);
      const icon = $(".lock-icon", card);
      const cd = $(".countdown", card);
      icon.textContent = open ? "🔓" : "🔒";
      cd.textContent = open ? "Disponible" : countdownTo(C.unlockDates[key]);
    });
  }

  /* ------------------------------------------------------------
     Navegación entre vistas
  ------------------------------------------------------------ */
  function showView(name) {
    $$(".view").forEach((v) => v.classList.remove("active"));
    const target = $("#view-" + name);
    if (target) target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function bindNav() {
    $("#unlock-cards").addEventListener("click", (e) => {
      const card = e.target.closest(".unlock-card");
      if (!card || !card.classList.contains("unlocked")) return;
      showView(card.dataset.view);
      const kv = card.dataset.view;
      if (kv === "galaxy") Galaxy.seed();
      if (kv === "letter") Later.ensureIntro();
      if (kv === "timeline") Counter.onEnter();
    });

    $$(".nav-back").forEach((btn) => {
      btn.addEventListener("click", () => showView(btn.dataset.back));
    });
  }

  /* ------------------------------------------------------------
     GALAXIA — órbita circular de fotos
  ------------------------------------------------------------ */
  const Galaxy = (() => {
    let photoEls = [];
    const stage = $("#galaxy-stage");

    function makePhoto(p, idx) {
      const n = C.galaxy.photos.length;
      const R = Math.round(Math.max(22, Math.min(window.innerHeight, 520) * (0.24 + (idx % 4) * 0.085)));
      const baseSpeed = 0.045 + (idx % 4) * 0.02;
      const speed = Math.round(baseSpeed * 1000) / 1000;
      const dur = 60 / speed;

      const orbit = document.createElement("div");
      orbit.className = "orbit-layer";
      orbit.style.cssText =
        `--orb-d:${dur}s;` +
        `--orb-o:${(-360 * Math.random()).toFixed(1)}s;` +
        `--orb-r:${R}px;` +
        `--orb-s:${speed}`;

      const counter = document.createElement("div");
      counter.className = "orbit-counter";

      const d = document.createElement("div");
      d.className = "orbit-photo";
      d.dataset.i = idx;

      const img = document.createElement("img");
      img.alt = p.caption || "Nuestra foto";
      img.draggable = false;
      img.onerror = () => {
        img.alt = "💛";
        img.style.background = "linear-gradient(135deg,#241a4d,#f5a800)";
      };
      img.src = p.src;
      d.appendChild(img);
      counter.appendChild(d);
      orbit.appendChild(counter);
      return orbit;
    }

    function seed() {
      const wrap = $("#galaxy-photos");
      if (!wrap || photoEls.length === C.galaxy.photos.length) return;

      const t = C.galaxy.title,
        s = C.galaxy.subtitle;
      $("#galaxy-title").textContent = t;
      $("#galaxy-subtitle").textContent = s;
      $("#galaxy-intro").textContent = C.galaxy.intro;

      wrap.innerHTML = "";
      photoEls = [];
      const n = C.galaxy.photos.length;
      C.galaxy.photos.forEach((p, i) => {
        const el = makePhoto(p, i);
        photoEls.push(el);
        wrap.appendChild(el);
        el.classList.add("orbit-enter");
        const cycle = Math.floor(i / n);
        const idx = n * cycle + i;
        el.style.transitionDelay = (idx * 0.06).toFixed(2) + "s";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          openLightbox(i);
        });
      });

      let io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              photoEls.forEach((ph) => ph.classList.add("orbit-visible"));
              obs.disconnect();
            }
          });
        },
        { threshold: 0.25 }
      );
      io.observe(stage);
    }

    function openLightbox(i) {
      const p = C.galaxy.photos[i];
      const el = photoEls[i];
      const inner = el ? $(".orbit-photo", el) : null;
      if (!p || !el) return;

      $("#lightbox-img").src = p.src;
      $("#lightbox-caption").textContent = p.caption || "";
      $("#photo-lightbox").classList.add("open");
      document.body.style.overflow = "hidden";
      if (inner) {
        inner.classList.add("spin-burst");
        setTimeout(() => inner.classList.remove("spin-burst"), 700);
      }
    }

    function bindLightbox() {
      const lb = $("#photo-lightbox");
      const close = () => {
        lb.classList.remove("open");
        document.body.style.overflow = "";
      };
      $("#lightbox-close").addEventListener("click", close);
      lb.addEventListener("click", (e) => {
        if (e.target === lb) close();
      });
    }

    return { seed, bindLightbox };
  })();

  /* ------------------------------------------------------------
     AMOR Y AMISTAD — sobre + carta + postales
  ------------------------------------------------------------ */
  const Later = (() => {
    let introDone = false;

    function ensureIntro() {
      const t = C.letter.title,
        s = C.letter.subtitle;
      $("#letter-title").textContent = t;
      $("#letter-subtitle").textContent = s;

      if (introDone) return;
      introDone = true;
      buildPostcards();

      const env = $("#envelope");
      const label = $(".env-label", env);
      label.textContent = C.letter.envelopeLabel;

      const paper = $("#letter-paper");
      $("#letter-paper-title").textContent = C.letter.letterTitle;
      $("#letter-body").innerHTML = C.letter.letterBody.map((p) => `<p>${p}</p>`).join("");
      $("#letter-signature").textContent = C.letter.signature;

      env.addEventListener("click", () => {
        if (env.classList.contains("open")) return;
        env.classList.add("open");
        setTimeout(() => {
          env.classList.add("done");
          paper.hidden = false;
          paper.classList.add("wobble");
          setTimeout(() => paper.classList.remove("wobble"), 550);
          setTimeout(() => paper.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
        }, 900);
      });
    }

    const ICONS = { heart: "💛", star: "⭐", music: "🎵", smile: "😄", home: "🏡", infinity: "∞" };

    function buildPostcards() {
      const wrap = $("#postcards");
      if (wrap.childElementCount) return;
      C.letter.postcards.forEach((pc) => {
        const card = document.createElement("div");
        card.className = "postcard";
        card.innerHTML =
          `<div class="pc-inner">
             <div class="pc-face front">
               <span class="pc-icon">${ICONS[pc.icon] || "💛"}</span>
               <span class="pc-title">${pc.title}</span>
               <span class="pc-hint">toca para dar vuelta</span>
             </div>
             <div class="pc-face back">
               <span class="pc-text">${pc.text}</span>
             </div>
           </div>`;
        card.addEventListener("click", () => card.classList.toggle("flipped"));
        wrap.appendChild(card);
      });
    }

    return { ensureIntro };
  })();

  /* ------------------------------------------------------------
     NUESTRO MES — contador + timeline + celebración
  ------------------------------------------------------------ */
  const Counter = (() => {
    const start = C.unlockDates.timeline;
    let intv = null;

    function tick() {
      const diff = Date.now() - start.getTime();
      const days = Math.max(0, Math.floor(diff / 86400000));
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      $("#counter-days").textContent = days + 1;
      $("#counter-time").textContent =
        String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }

    function buildTitle() {
      $("#timeline-title").textContent = C.timeline.title;
      $("#timeline-subtitle").textContent = C.timeline.subtitle;
    }

    function buildMilestones() {
      const list = $("#timeline-list");
      if (list.childElementCount) return;
      C.timeline.milestones.forEach((m, i) => {
        const el = document.createElement("div");
        el.className = "tl-item hidden-rev";
        el.innerHTML =
          `<div class="tl-day">Día ${m.days}</div>` +
          `<div class="tl-title">${m.title}</div>` +
          `<div class="tl-text">${m.text}</div>`;
        list.appendChild(el);
      });
      const ep = document.createElement("div");
      ep.className = "tl-epilogue";
      ep.textContent = C.timeline.epilogue;
      list.appendChild(ep);

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.remove("hidden-rev");
              en.target.classList.add("revealed");
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.25 }
      );
      $$(".tl-item", list).forEach((el) => io.observe(el));

      $("#celebrate-btn").textContent = C.timeline.celebrationCTAs[0];
    }

    function onEnter() {
      buildTitle();
      buildMilestones();
      if (intv) clearInterval(intv);
      tick();
      intv = setInterval(tick, 1000);
      bindCelebrate();
    }

    function bindCelebrate() {
      const btn = $("#celebrate-btn");
      btn.textContent = C.timeline.celebrationCTAs[0];
      let step = 0;
      btn.addEventListener("click", () => {
        step = (step + 1) % C.timeline.celebrationCTAs.length;
        btn.textContent = C.timeline.celebrationCTAs[step];
        explode(btn);
        if (step === C.timeline.celebrationCTAs.length - 1) {
          btn.style.pointerEvents = "none";
          btn.style.filter = "brightness(1.15)";
        }
      });
    }

    return { onEnter };
  })();

  /* ------------------------------------------------------------
     CONFETTI + corazoncitos
  ------------------------------------------------------------ */
  function explode(anchor) {
    const layer = $("#confetti-layer");
    const rect = anchor.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const colors = ["#ffd60a", "#ffe14d", "#f5a800", "#ff8fab", "#9ef01a", "#ffffff", "#ffb347"];

    for (let i = 0; i < 46; i++) {
      const el = document.createElement("div");
      el.className = "confetti";
      const size = 7 + Math.random() * 8;
      const dur = 2.2 + Math.random() * 1.6;
      const dx = (Math.random() - 0.5) * 220;
      el.style.cssText =
        `left:${cx + dx}px;width:${size}px;height:${size * 0.55}px;` +
        `background:${colors[i % colors.length]};border-radius:${Math.random() < 0.3 ? "50%" : "2px"};` +
        `--rot:${(Math.random() * 720 + 360).toFixed(0)}deg;animation-duration:${dur.toFixed(2)}s;` +
        `animation-delay:${(Math.random() * 0.35).toFixed(2)}s;`;
      layer.appendChild(el);
      setTimeout(() => el.remove(), (dur + 0.6) * 1000);
    }

    for (let i = 0; i < 10; i++) {
      const h = document.createElement("div");
      h.className = "heart-pop";
      h.textContent = Math.random() < 0.5 ? "💛" : "🌼";
      h.style.left = cx + (Math.random() - 0.5) * 120 + "px";
      h.style.top = cy + "px";
      h.style.animationDelay = (Math.random() * 0.5).toFixed(2) + "s";
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 2200);
    }
  }

  /* ------------------------------------------------------------
     Boot
  ------------------------------------------------------------ */
  function boot() {
    detectSection();
    renderCards();
    bindNav();
    Galaxy.bindLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();