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
      if (kv === "galaxy") Galaxy.enter();
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
    let magicBound = false;

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
      const gsapWrap = document.createElement("div");
      gsapWrap.className = "gph-gsap";
      gsapWrap.appendChild(d);
      inner.appendChild(gsapWrap);
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
      const emojis = ["🌼", "✨", "💛", "🌻"];
      for (let i = 0; i < 16; i++) {
        const p = document.createElement("div");
        p.className = "galaxy-petal" + (i % 5 === 0 ? " is-front" : "");
        p.textContent = emojis[i % emojis.length];
        p.style.cssText =
          `left:${(2 + Math.random() * 94).toFixed(1)}%;` +
          `font-size:${(13 + Math.random() * 12).toFixed(1)}px;` +
          `--pd:${(7 + Math.random() * 7).toFixed(1)}s;` +
          `--sx:${((Math.random() - 0.5) * 54).toFixed(1)}px;` +
          `animation-delay:${(-Math.random() * 14).toFixed(1)}s;`;
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

    /* flor gigante central: capas de pétalos girando + mazorca dorada */
    function buildFlower() {
      const host = $("#galaxy-flower");
      if (!host || host.childElementCount) return;
      const limit = Math.min(window.innerWidth || 390, 520);
      const f = 1.15;
      const core = Math.round((limit * 0.075 + 12) * f);

      const layers = [
        { w: Math.round(limit * 0.20 * f), h: Math.round(limit * 0.30 * f), n: 12, r: core + 4, cls: "fl-outer", spin: "fl-cw" },
        { w: Math.round(limit * 0.13 * f), h: Math.round(limit * 0.20 * f), n: 10, r: core - 4, cls: "fl-inner", spin: "fl-ccw" }
      ];

      layers.forEach((ly) => {
        const wrap = document.createElement("div");
        wrap.className = "fl-layer " + ly.spin;
        for (let i = 0; i < ly.n; i++) {
          const p = document.createElement("div");
          p.className = "fl-petal " + ly.cls;
          p.style.cssText =
            `width:${ly.w}px;height:${ly.h}px;margin:-${ly.h}px 0 0 -${(ly.w / 2).toFixed(0)}px;` +
            `--pa:${((i * 360) / ly.n).toFixed(1)}deg;--pr:${ly.r}px;` +
            `animation-delay:${(i * 0.05).toFixed(2)}s;`;
          wrap.appendChild(p);
        }
        host.appendChild(wrap);
      });

      const c = document.createElement("div");
      c.className = "fl-core";
      const cs = core * 2;
      c.style.cssText = `width:${cs}px;height:${cs}px;margin:${-cs / 2}px 0 0 ${-cs / 2}px;`;
      host.appendChild(c);

      const halo = document.createElement("div");
      halo.className = "fl-layer fl-halo";
      for (let i = 0; i < 8; i++) {
        const hp = document.createElement("div");
        hp.className = "fl-halo-p";
        hp.style.setProperty("--pa", (i * 45) + "deg");
        hp.style.transform = `rotate(${i * 45}deg)`;
        halo.appendChild(hp);
      }
      host.insertBefore(halo, host.firstChild);
    }

    /* polvo dorado flotando */
    function buildDust() {
      const host = $("#galaxy-dust");
      if (!host || host.childElementCount) return;
      for (let i = 0; i < 24; i++) {
        const d = document.createElement("div");
        d.className = "dust";
        const s = 3 + Math.random() * 5;
        d.style.cssText =
          `left:${(Math.random() * 100).toFixed(1)}%;top:${(10 + Math.random() * 80).toFixed(1)}%;` +
          `width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;` +
          `--df:${(11 + Math.random() * 9).toFixed(1)}s;--dd:${(-Math.random() * 16).toFixed(1)}s;` +
          `--dx:${((Math.random() - 0.5) * 70).toFixed(1)}px;--do:${(0.35 + Math.random() * 0.45).toFixed(2)};`;
        host.appendChild(d);
      }
    }

    /* anillos orbitales alrededor del disco de fotos */
    function buildOrbitRings(disc) {
      const limit = Math.min(window.innerWidth || 390, 520);
      const base = Math.round(limit * 0.34);
      [0.55, 0.95].forEach((k) => {
        const ring = document.createElement("div");
        const r = Math.round(base * k);
        ring.className = "orbit-ring";
        ring.style.cssText = `width:${r * 2}px;height:${r * 2}px;`;
        disc.appendChild(ring);
      });
    }

    /* cielo: estelas de luciérnaga + destellos grandes */
    function buildSkyfx() {
      const host = $("#galaxy-skyfx");
      if (!host || host.childElementCount) return;
      for (let i = 0; i < 4; i++) {
        const st = document.createElement("div");
        st.className = "streak";
        st.style.cssText =
          `left:${(6 + Math.random() * 88).toFixed(1)}%;bottom:${(-10 + Math.random() * 18).toFixed(1)}%;` +
          `--st:${(9 + Math.random() * 7).toFixed(1)}s;--sd:${(-Math.random() * 14).toFixed(1)}s;`;
        host.appendChild(st);
      }
      const bolts = ["✦", "✧", "❀", "💛"];
      for (let i = 0; i < 6; i++) {
        const b = document.createElement("span");
        b.className = "big-sparkle";
        b.textContent = bolts[i % bolts.length];
        b.style.cssText =
          `left:${(8 + Math.random() * 84).toFixed(1)}%;top:${(6 + Math.random() * 80).toFixed(1)}%;` +
          `font-size:${(11 + Math.random() * 9).toFixed(1)}px;` +
          `--sz:${(3 + Math.random() * 3.4).toFixed(1)}s;--sdd:${(-Math.random() * 6).toFixed(1)}s;`;
        host.appendChild(b);
      }
    }

    /* canvas: constelaciones de polvo dorado conectado */
    const SkyCanvas = (() => {
      let canvas = null,
        ctx = null,
        running = false,
        parts = [],
        raf = 0;

      function W() { return canvas ? canvas.clientWidth : 0; }
      function H() { return canvas ? canvas.clientHeight : 0; }

      function makePart() {
        const w = W() || 390,
          h = H() || 300;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: 0.6 + Math.random() * 1.6,
          a: 0.35 + Math.random() * 0.6,
          tw: Math.random() * Math.PI * 2
        };
      }

      function init() {
        if (running) return;
        canvas = $("#galaxy-canvas");
        if (!canvas) return;
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        ctx = canvas.getContext("2d");
        if (!ctx) return;
        running = true;
        const stage = $("#galaxy-stage");
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const resize = () => {
          const r = stage.getBoundingClientRect();
          canvas.width = Math.max(1, Math.round(r.width * dpr));
          canvas.height = Math.max(1, Math.round(r.height * dpr));
          canvas.style.width = r.width + "px";
          canvas.style.height = r.height + "px";
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener("resize", resize, { passive: true });
        for (let i = 0; i < 66; i++) parts.push(makePart());
        raf = requestAnimationFrame(loop);
      }

      function burst(x, y, n) {
        if (!running || !ctx) return;
        const count = n || 12;
        for (let i = 0; i < count; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 0.5 + Math.random() * 1.6;
          parts.push({
            x, y,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp,
            r: 1 + Math.random() * 2.2,
            a: 0.9,
            tw: 0,
            burst: true,
            life: 1
          });
        }
        if (parts.length > 240) parts = parts.filter((p) => !p.burst || p.life > 0);
      }

      function loop() {
        const w = W(),
          h = H();
        if (w > 0 && h > 0) {
          ctx.clearRect(0, 0, w, h);

          ctx.lineWidth = 0.6;
          for (let i = 0; i < parts.length; i++) {
            for (let j = i + 1; j < parts.length; j++) {
              const p = parts[i],
                q = parts[j];
              const dx = p.x - q.x,
                dy = p.y - q.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < 130 * 130) {
                const alpha = (1 - Math.sqrt(d2) / 130) * 0.16;
                ctx.strokeStyle = "rgba(255,225,90," + alpha.toFixed(3) + ")";
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(q.x, q.y);
                ctx.stroke();
              }
            }
          }

          for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.tw += 0.05;
            p.x += p.vx;
            p.y += p.vy;
            if (p.burst) {
              p.life -= 0.03;
              p.vx *= 0.96;
              p.vy *= 0.96;
              if (p.life <= 0) { parts.splice(i, 1); continue; }
            } else {
              if (p.x < -10) p.x = w + 10;
              if (p.x > w + 10) p.x = -10;
              if (p.y < -10) p.y = h + 10;
              if (p.y > h + 10) p.y = -10;
            }
            const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw));
            ctx.fillStyle = "rgba(255,238,140," + alpha.toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        raf = requestAnimationFrame(loop);
      }

      return { init, burst };
    })();

    /* tilteo 3D sutil de las fotos */
    function bindPhotoTilt(ph) {
      let armed = false;
      ph.addEventListener("pointerenter", () => {
        armed = true;
        ph.classList.add("ph-tilt");
        ph.classList.remove("ph-flat");
      });
      ph.addEventListener("pointermove", (e) => {
        if (!armed) return;
        const r = ph.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ph.style.transform =
          "perspective(320px) rotateX(" + (-py * 14).toFixed(1) + "deg) rotateY(" + (px * 14).toFixed(1) + "deg)";
      });
      ph.addEventListener("pointerleave", () => {
        armed = false;
        ph.style.transform = "";
        ph.classList.add("ph-flat");
        ph.classList.remove("ph-tilt");
      });
    }

    /* coreografía de entrada con GSAP */
    function playEntrance() {
      if (!window.gsap || photoEls.length === 0) return;
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const g = window.gsap;
      const stage = $("#galaxy-stage");
      const targets = {
        title: $("#galaxy-title"),
        sub: $("#galaxy-subtitle"),
        photos: Array.from(document.querySelectorAll("#galaxy-photos .gph-gsap")),
        msgs: Array.from(document.querySelectorAll("#galaxy-messages .msg-inner")),
        hint: $("#galaxy-hint"),
        sparkles: Array.from(document.querySelectorAll("#galaxy-skyfx .big-sparkle"))
      };
      const tl = g.timeline();
      tl.fromTo(targets.title, { y: 26, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, 0.05)
        .fromTo(targets.sub, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, 0.2)
        .fromTo(targets.photos, { scale: 0, opacity: 0, y: 28 }, { scale: 1, opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: "elastic.out(1, 0.55)" }, 0.3)
        .fromTo(targets.msgs, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.06, ease: "back.out(2.2)" }, 0.55)
        .fromTo(targets.hint, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0.7)
        .fromTo(targets.sparkles, { opacity: 0 }, { opacity: 0.9, duration: 0.4, stagger: 0.05 }, 0.8);
      tl.call(() => {
        const ring = document.createElement("div");
        ring.className = "stage-flash";
        stage.appendChild(ring);
        setTimeout(() => ring.remove(), 1500);
      }, [], 0.95);
    }

    /* magia al tocar: onda + chispitas donde toques */
    function bindStageMagic() {
      if (magicBound) return;
      magicBound = true;
      const stage = $("#galaxy-stage");
      stage.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".orbit-photo, .galaxy-msg, .nav-back")) return;
        const rect = stage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rip = document.createElement("div");
        rip.className = "stage-ripple";
        rip.style.left = x + "px";
        rip.style.top = y + "px";
        stage.appendChild(rip);
        setTimeout(() => rip.remove(), 1200);
        SkyCanvas.burst(x, y, 14);

        for (let k = 0; k < 4; k++) {
          const sp = document.createElement("div");
          sp.className = "spark";
          sp.style.left = (x - 3) + "px";
          sp.style.top = (y - 3) + "px";
          sp.style.setProperty("--tx", ((Math.random() - 0.5) * 70).toFixed(0) + "px");
          sp.style.setProperty("--ty", ((Math.random() - 0.5) * 60).toFixed(0) + "px");
          sp.style.setProperty("--td", (Math.random() * 0.2).toFixed(2) + "s");
          stage.appendChild(sp);
          setTimeout(() => sp.remove(), 1100);
        }
      });
    }

    /* ondas de corazón al entrar a la galaxia */
    function flashHeart() {
      const stage = $("#galaxy-stage");
      const ring = document.createElement("div");
      ring.className = "stage-flash";
      stage.appendChild(ring);
      setTimeout(() => ring.remove(), 1500);
    }

    /* corazoncitos que brotan de la foto al abrirla */
    function sparkBurst(x, y, n) {
      const count = n || 8;
      for (let i = 0; i < count; i++) {
        const h = document.createElement("div");
        h.className = "heart-pop heart-pop-sm";
        h.textContent = ["💛", "🌼", "🌟"][i % 3];
        h.style.left = (x + (Math.random() - 0.5) * 120) + "px";
        h.style.top = (y - 10) + "px";
        h.style.animationDelay = (Math.random() * 0.3).toFixed(2) + "s";
        document.body.appendChild(h);
        setTimeout(() => h.remove(), 2100);
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
        el.innerHTML = `<span class="msg-inner">${text}</span>`;
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
      buildDust();
      buildFlower();
      buildSkyfx();
      buildPetals();
      buildHeart();
      buildMessages();
      bindStageMagic();

      wrap.innerHTML = "";
      photoEls = [];
      const disc = document.createElement("div");
      disc.className = "galaxy-disc";
      wrap.appendChild(disc);
      buildOrbitRings(disc);

      const withGsap = !!window.gsap;
      C.galaxy.photos.forEach((p, i) => {
        const gph = makePhoto(p, i);
        const ph = gph.__photo;
        photoEls.push(gph);
        disc.appendChild(gph);
        if (!withGsap) {
          ph.classList.add("orbit-enter");
          ph.style.animationDelay = Math.min(i * 0.08, 0.9).toFixed(2) + "s";
        }
        bindPhotoTilt(ph);
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
        const r = inner.getBoundingClientRect();
        sparkBurst(r.left + r.width / 2, r.top + r.height / 2, 8);
        const stageRect = $("#galaxy-stage").getBoundingClientRect();
        SkyCanvas.burst(r.left + r.width / 2 - stageRect.left, r.top + r.height / 2 - stageRect.top, 18);
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

    function enter() {
      seed();
      SkyCanvas.init();
      playEntrance();
      flashHeart();
    }

    return { seed, enter, bindLightbox };
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
        explode(env);
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
     Ambiente: corazones y brillitos flotando en toda la página
  ------------------------------------------------------------ */
  function buildAmbient() {
    const host = $("#ambient");
    if (!host || host.childElementCount) return;
    const glyphs = ["💛", "🌼", "✨", "💫", "🤍", "⭐"];
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = (Math.random() * 100).toFixed(1) + "%";
      s.style.setProperty("--sz", (10 + Math.random() * 12).toFixed(1) + "px");
      s.style.setProperty("--af", (13 + Math.random() * 12).toFixed(1) + "s");
      s.style.setProperty("--ad", (-Math.random() * 22).toFixed(1) + "s");
      host.appendChild(s);
    }
  }

  /* ------------------------------------------------------------
     Estrellas fugaces en la galaxia
  ------------------------------------------------------------ */
  function startShootingStars() {
    const host = $("#galaxy-shooting");
    if (!host) return;
    const spawn = () => {
      const s = document.createElement("div");
      s.className = "shooting-star";
      s.style.left = (4 + Math.random() * 52).toFixed(1) + "%";
      s.style.top = (Math.random() * 42).toFixed(1) + "%";
      s.style.setProperty("--sd", (1.1 + Math.random() * 0.9).toFixed(2) + "s");
      host.appendChild(s);
      setTimeout(() => s.remove(), 2600);
      setTimeout(spawn, 2600 + Math.random() * 3800);
    };
    setTimeout(spawn, 1600);
  }

  /* ------------------------------------------------------------
     Mariposas doradas cruzando la galaxia
  ------------------------------------------------------------ */
  function startButterflies() {
    const host = $("#galaxy-stage");
    if (!host) return;
    const glyphs = ["🦋", "🦋", "🌟"];
    for (let i = 0; i < 3; i++) {
      const b = document.createElement("div");
      b.className = "butterfly";
      b.textContent = glyphs[i];
      b.style.cssText =
        `top:${(14 + Math.random() * 46).toFixed(0)}%;` +
        `--bf:${(14 + Math.random() * 6).toFixed(1)}s;` +
        `--bd:${(-Math.random() * 16).toFixed(1)}s;`;
      host.appendChild(b);
    }
  }

  /* ------------------------------------------------------------
     Música opcional (se activa desde config.js)
  ------------------------------------------------------------ */
  function setupMusic() {
    const btn = $("#music-btn");
    const audio = $("#music-audio");
    const m = C.music || {};
    if (!btn || !audio || !m.enabled || !m.src) return;
    audio.src = m.src;
    btn.hidden = false;
    if (m.title) btn.setAttribute("aria-label", m.title);
    btn.addEventListener("click", () => {
      if (audio.paused) {
        audio.play().then(() => btn.classList.add("playing")).catch(() => {});
      } else {
        audio.pause();
        btn.classList.remove("playing");
      }
    });
  }

  /* ------------------------------------------------------------
     Boot
  ------------------------------------------------------------ */
  function boot() {
    detectSection();
    renderCards();
    bindNav();
    Galaxy.bindLightbox();
    buildAmbient();
    startShootingStars();
    startButterflies();
    setupMusic();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();