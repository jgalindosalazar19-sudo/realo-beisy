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
    const transient =
      new URLSearchParams(window.location.search).get("vista") === "nuestrasfechas";
    if (transient || C.forceUnlock) {
      unlockedStore.galaxy = true;
      unlockedStore.letter = true;
      unlockedStore.timeline = true;
      return;
    }
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
     GALAXIA DE FOTOS — disco en espiral + estrellas doradas
  ------------------------------------------------------------ */
  const Galaxy = (() => {
    let photoEls = [];

    function makePhoto(p, idx) {
      const limit = Math.min(window.innerWidth || 390, 520);
      const minR = Math.round(limit * 0.16) + 10;
      const maxR = Math.round(limit * 0.40);
      const n = C.galaxy.photos.length;
      const f = (idx + 0.5) / n;
      const ang = idx * 137.5;
      const rad = minR + f * (maxR - minR) + Math.sin(idx * 1.7) * 14;

      const gph = document.createElement("div");
      gph.className = "gph";
      gph.style.cssText = `--ang:${ang.toFixed(1)}deg;--rad:${rad.toFixed(0)}px`;

      const inner = document.createElement("div");
      inner.className = "gph-inner";

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
      inner.appendChild(d);
      gph.appendChild(inner);
      gph.__photo = d;
      return gph;
    }

    function buildStars() {
      const host = $("#galaxy-stars");
      if (host.childElementCount) return;
      const colors = ["#ffe14d", "#fff8e1", "#ffd60a"];
      for (let i = 0; i < 60; i++) {
        const s = document.createElement("div");
        s.className = "galaxy-star";
        const size = (1.5 + Math.random() * 2.5).toFixed(1);
        s.style.cssText =
          `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;` +
          `width:${size}px;height:${size}px;background:${colors[i % colors.length]};` +
          `--tw:${(2 + Math.random() * 3).toFixed(1)}s;animation-delay:${(-Math.random() * 4).toFixed(2)}s;`;
        host.appendChild(s);
      }
    }

    function buildPetals() {
      const host = $("#galaxy-petals");
      if (host.childElementCount) return;
      const emojis = ["🌼", "✨", "💛"];
      for (let i = 0; i < 9; i++) {
        const p = document.createElement("div");
        p.className = "galaxy-petal";
        p.textContent = emojis[i % emojis.length];
        p.style.cssText =
          `left:${(3 + Math.random() * 92).toFixed(1)}%;` +
          `--pd:${(7 + Math.random() * 6).toFixed(1)}s;` +
          `animation-delay:${(-Math.random() * 9).toFixed(1)}s;`;
        host.appendChild(p);
      }
    }

    function buildHeart() {
      const host = $("#galaxy-heart");
      if (host.childElementCount) return;
      const pts = 80;
      const scale = 5.2;
      for (let i = 0; i < pts; i++) {
        const t = (i / pts) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const dot = document.createElement("div");
        dot.className = "gh-dot";
        if (i % 5 === 0) dot.classList.add("gh-glow");
        dot.style.setProperty("--hx", (x * scale + (0.8 - Math.random() * 1.6)).toFixed(1));
        dot.style.setProperty("--hy", (y * scale + (0.8 - Math.random() * 1.6)).toFixed(1));
        dot.style.setProperty("--tw", (1.8 + Math.random() * 2.4).toFixed(1) + "s");
        dot.style.setProperty("--md", (-Math.random() * 3).toFixed(2) + "s");
        host.appendChild(dot);
      }
    }

    function buildMessages() {
      const host = $("#galaxy-messages");
      if (host.childElementCount) return;
      const msgs = C.galaxy.messages || [];
      const slots = [
        { x: 16, y: 26 }, { x: 84, y: 24 }, { x: 12, y: 56 }, { x: 88, y: 50 },
        { x: 30, y: 10 }, { x: 70, y: 12 }, { x: 24, y: 82 }, { x: 76, y: 80 },
        { x: 50, y: 90 }, { x: 92, y: 30 }, { x: 8, y: 38 }, { x: 50, y: 10 }
      ];
      msgs.forEach((m, i) => {
        if (!slots[i]) return;
        const text = typeof m === "string" ? m : m.text;
        const photoIdx = typeof m === "string" ? i : (m.photo ?? i);
        const el = document.createElement("div");
        el.className = "galaxy-msg is-btn" + (i % 3 === 0 ? " gold" : "");
        el.textContent = text;
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.style.left = slots[i].x + "%";
        el.style.top = slots[i].y + "%";
        el.style.setProperty("--dm", (4.5 + (i % 4) * 0.8).toFixed(1) + "s");
        el.style.setProperty("--md", (-(i * 1.3)).toFixed(1) + "s");
        if (C.galaxy.photos[photoIdx]) {
          el.addEventListener("click", () => openLightbox(photoIdx, text));
          el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openLightbox(photoIdx, text);
            }
          });
        }
        host.appendChild(el);
      });
    }

    function seed() {
      const wrap = $("#galaxy-photos");
      if (!wrap || photoEls.length === C.galaxy.photos.length) return;

      const t = C.galaxy.title,
        s = C.galaxy.subtitle;
      $("#galaxy-title").textContent = t;
      $("#galaxy-subtitle").textContent = s;
      $("#galaxy-intro").textContent = C.galaxy.intro;

      buildStars();
      buildPetals();
      buildHeart();
      buildMessages();

      wrap.innerHTML = "";
      photoEls = [];
      const disc = document.createElement("div");
      disc.className = "galaxy-disc";
      wrap.appendChild(disc);

      C.galaxy.photos.forEach((p, i) => {
        const gph = makePhoto(p, i);
        const ph = gph.__photo;
        photoEls.push(gph);
        disc.appendChild(gph);
        ph.classList.add("orbit-enter");
        ph.style.animationDelay = Math.min(i * 0.08, 0.9).toFixed(2) + "s";
        ph.addEventListener("click", (e) => {
          e.stopPropagation();
          openLightbox(i);
        });
      });
    }

    function openLightbox(i, customText) {
      const p = C.galaxy.photos[i];
      const el = photoEls[i];
      const inner = el ? $(".orbit-photo", el) : null;
      if (!p) return;

      $("#lightbox-img").src = p.src;
      $("#lightbox-caption").textContent = customText || p.caption || "";
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