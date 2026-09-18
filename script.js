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

  const cardStatus = {};

  function celebrateUnlock(card) {
    try {
      explode(card, false);
      if (card.animate) {
        card.animate(
          [
            { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(255, 214, 10, 0.75)" },
            { offset: 0.6, transform: "scale(1.045)", boxShadow: "0 0 0 18px rgba(255, 214, 10, 0)" },
            { transform: "scale(1)", boxShadow: "0 0 0 24px rgba(255, 214, 10, 0)" },
          ],
          { duration: 1100, easing: "ease-out" }
        );
      }
    } catch (e) { /* noop */ }
  }

  function renderCards() {
    const heroDate = $("#hero-date");
    if (heroDate) heroDate.textContent = formatDate(new Date());

    $$(".unlock-card").forEach((card) => {
      const key = card.dataset.key;
      const open = unlockedStore[key];
      const was = cardStatus[key];
      card.classList.toggle("unlocked", open);
      if (was === false && open) celebrateUnlock(card);
      cardStatus[key] = open;
      const icon = $(".lock-icon", card);
      const cd = $(".countdown", card);
      icon.textContent = open ? "🔓" : "🔒";
      cd.textContent = open ? "Disponible" : countdownTo(C.unlockDates[key]);
    });
  }

  function startLiveCards() {
    setInterval(() => {
      try { renderCards(); } catch (e) { /* noop */ }
    }, 60000);
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
      if (kv === "letter") Love.enter();
      if (kv === "timeline") Counter.onEnter();
      heartsRain();
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
        img.alt = "🩶";
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
      const emojis = ["🌼", "✨", "🩶", "🌻"];
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
      const bolts = ["✦", "✧", "❀", "🩶"];
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

    /* gran finale: corazón gigante + TE AMO + lluvia de flores */
    function stageFinale() {
      const final = $("#galaxy-final");
      if (!final) return;
      const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      $("#galaxy-final-line").textContent = C.galaxy.finale || "";
      final.hidden = false;
      const heart = $(".galaxy-final-heart", final);
      if (window.gsap && !reduced) {
        window.gsap.fromTo(final, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" });
        if (heart) {
          window.gsap.fromTo(heart, { scale: 0, rotate: -24 }, { scale: 1, rotate: 0, duration: 1, ease: "elastic.out(1.2, 0.5)" });
        }
      } else {
        final.style.opacity = "1";
      }
      if (reduced) return;
      try { explode($("#galaxy-heart") || heart, false); } catch (e) { console.warn("confetti:", e); }

      /* lluvia de flores amarillas */
      const stage = $("#galaxy-stage");
      const rain = document.createElement("div");
      rain.className = "galaxy-rain";
      const glyphs = ["🌼", "🩶", "✨", "🌻"];
      for (let i = 0; i < 16; i++) {
        const d = document.createElement("span");
        d.className = "galaxy-rain-drop";
        d.textContent = glyphs[i % glyphs.length];
        d.style.left = (Math.random() * 96 + 2).toFixed(1) + "%";
        d.style.setProperty("--rd", (2 + Math.random() * 1.6).toFixed(2) + "s");
        d.style.setProperty("--rr", (Math.random() * 0.7).toFixed(2) + "s");
        d.style.setProperty("--rx", ((Math.random() - 0.5) * 90).toFixed(0) + "px");
        d.style.fontSize = (14 + Math.random() * 12).toFixed(1) + "px";
        rain.appendChild(d);
      }
      stage.appendChild(rain);
      setTimeout(() => rain.remove(), 4200);
    }

    /* corazoncitos que brotan de la foto al abrirla */
    function sparkBurst(x, y, n) {
      const count = n || 8;
      for (let i = 0; i < count; i++) {
        const h = document.createElement("div");
        h.className = "heart-pop heart-pop-sm";
        h.textContent = ["🩶", "🌼", "🌟"][i % 3];
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
        if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
          const ring = document.createElement("i");
          ring.className = "photo-ring";
          ring.style.left = r.left + r.width / 2 + "px";
          ring.style.top = r.top + r.height / 2 + "px";
          document.body.appendChild(ring);
          setTimeout(() => ring.remove(), 950);
        }
        const stageRect = $("#galaxy-stage").getBoundingClientRect();
        SkyCanvas.burst(r.left + r.width / 2 - stageRect.left, r.top + r.height / 2 - stageRect.top, 18);
      }
    }

    function bindLightbox() {
      const lb = $("#photo-lightbox");
      if (!lb) return;
      const close = () => {
        lb.classList.remove("open");
        document.body.style.overflow = "";
      };
      const closeBtn = $("#lightbox-close");
      if (closeBtn) closeBtn.addEventListener("click", close);
      lb.addEventListener("click", (e) => {
        if (e.target === lb) close();
      });
    }

    function enter() {
      seed();
      SkyCanvas.init();
      playEntrance();
      flashHeart();
      setTimeout(stageFinale, 1550);
    }

    return { seed, enter, bindLightbox };
  })();

  /* ------------------------------------------------------------
     AMOR Y AMISTAD — viaje entre galaxias + carta
  ------------------------------------------------------------ */
  const Love = (() => {
    let entered = false;
    let raf = 0;
    let flowKill = null;
    let zoneKills = [];
    const warpState = { burst: 0 };

    function fillTexts() {
      const t = C.letter.title,
        s = C.letter.subtitle;
      $("#letter-title").textContent = t;
      $("#letter-subtitle").textContent = s;
      $("#letter-paper-title").textContent = C.letter.letterTitle;
      $("#letter-body").innerHTML = C.letter.letterBody.map((p) => `<p>${p}</p>`).join("");
      const sig = $("#letter-signature");
      if (sig) {
        sig.textContent = C.letter.signature || "";
        sig.hidden = !C.letter.signature;
      }
    }

    function detach() {
      warpState.burst = 0;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (flowKill) { try { flowKill.kill(); } catch (e) { /* noop */ } flowKill = null; }
      if (zoneKills.length) { zoneKills.forEach((k) => k.kill()); zoneKills = []; }
      const canvas = $("#love-canvas");
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      const msgs = $("#love-messages");
      if (msgs) { msgs.classList.remove("love-static"); msgs.innerHTML = ""; }
      const gals = $("#love-galaxies");
      if (gals) gals.innerHTML = "";
      const embers = $("#love-embers");
      if (embers) embers.innerHTML = "";
      const beats = $("#love-beats");
      if (beats) beats.innerHTML = "";
      const zones = $("#love-zones");
      if (zones) zones.innerHTML = "";
      const final = $("#love-final");
      if (final) final.hidden = true;
    }

    /* túnel de estrellas en hipervelocidad */
    function startWarp() {
      const canvas = $("#love-canvas");
      const stage = $("#love-stage");
      if (!canvas || !stage) return;
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const gray = ["#c9c9d4", "#e8e8ee", "#9b9baa"];
      const red = ["#ff2e5f", "#ff6b85", "#ff3b57"];
      let w = 0, h = 0, cx = 0, cy = 0, rot = 0, t = 0;
      const R = () => Math.hypot(w, h) / 2;
      const stars = [];
      const comets = [];
      const nebulas = [
        { x: 0.28, y: 0.32, r: 0.36, cr: [200, 26, 70], ar: 0.7, dx: 0.002, dy: 0.0011 },
        { x: 0.74, y: 0.62, r: 0.42, cr: [140, 38, 95], ar: 1.4, dx: -0.0016, dy: 0.0009 }
      ];

      function resize() {
        const r = stage.getBoundingClientRect();
        w = Math.max(1, r.width);
        h = Math.max(1, r.height);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = w / 2;
        cy = h / 2;
      }
      resize();
      window.addEventListener("resize", resize, { passive: true });

      for (let i = 0; i < 130; i++) {
        const far = i < 72;
        stars.push({
          ang: Math.random() * Math.PI * 2,
          d: Math.random() * 60,
          spd: far ? 0.5 + Math.random() * 0.9 : 1.6 + Math.random() * 2.2,
          len: far ? 4 + Math.random() * 6 : 12 + Math.random() * 16,
          r: far ? 0.6 + Math.random() * 0.6 : 1.3 + Math.random() * 1.5,
          a: far ? 0.35 + Math.random() * 0.35 : 0.5 + Math.random() * 0.45,
          tw: Math.random() * Math.PI * 2,
          col: far ? gray[i % gray.length] : red[i % red.length],
          glow: !far && i % 9 === 0
        });
      }

      const loop = () => {
        t += 0.016;
        rot += 0.0008;
        const brake = warpState.burst;
        if (brake > 0) warpState.burst = Math.max(0, brake - 0.018);
        const pulse = (1 + 0.14 * Math.sin(t * 0.55)) * (1 + brake * 2.2);
        ctx.clearRect(0, 0, w, h);

        for (const nb of nebulas) {
          nb.x += nb.dx;
          nb.y += nb.dy;
          if (nb.x < 0.08 || nb.x > 0.92) nb.dx *= -1;
          if (nb.y < 0.08 || nb.y > 0.92) nb.dy *= -1;
          const nx = nb.x * w;
          const ny = nb.y * h;
          const nr = nb.r * Math.min(w, h);
          const al = 0.5 * (0.55 + 0.45 * Math.sin(t * 0.4 + nb.ar)) * (1 + brake * 0.4);
          const gr = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
          gr.addColorStop(0, `rgba(${nb.cr[0]},${nb.cr[1]},${nb.cr[2]},${(al * 0.5).toFixed(3)})`);
          gr.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = gr;
          ctx.fillRect(0, 0, w, h);
        }

        const lim = R();
        for (const s of stars) {
          s.d += s.spd * pulse;
          if (s.d > lim) { s.d = Math.random() * 20; s.ang = Math.random() * Math.PI * 2; }
          const a = s.ang + rot;
          const x = cx + Math.cos(a) * s.d;
          const y = cy + Math.sin(a) * s.d * 1.05;
          const alpha = Math.min(1, s.a * (s.d / 180 + 0.35)) * (0.82 + 0.18 * Math.sin(t * 2.2 + s.tw));
          ctx.fillStyle = s.col;
          const dots = s.glow ? 5 : 3;
          for (let k = dots; k >= 0; k--) {
            const back = s.d - s.len * k * 0.24;
            if (back <= 0) continue;
            const bx = cx + Math.cos(a) * back;
            const by = cy + Math.sin(a) * back;
            ctx.globalAlpha = alpha * (1 - k * 0.18);
            ctx.beginPath();
            ctx.arc(bx, by, Math.max(0.4, s.r * (1 - k * 0.14)), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (comets.length < 7 && Math.random() < 0.014) {
          const a = Math.PI * (1.04 + Math.random() * 0.42);
          const sp = 170 + Math.random() * 200;
          comets.push({
            x: Math.random() * w,
            y: -30 - Math.random() * 90,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 1,
            col: ["#fff", "#ffd9e2", "#fff", "#ff9cb0"][Math.floor(Math.random() * 4)],
            trail: []
          });
        }

        for (let ci = comets.length - 1; ci >= 0; ci--) {
          const c = comets[ci];
          c.x += c.vx * 0.016;
          c.y += c.vy * 0.016;
          c.life -= 0.006;
          c.trail.push({ x: c.x, y: c.y });
          if (c.trail.length > 7) c.trail.shift();
          const len = c.trail.length;
          for (let k = 0; k < len; k++) {
            const p = c.trail[k];
            const f = (k / len) * c.life;
            ctx.globalAlpha = Math.max(0, f * 0.75);
            ctx.fillStyle = c.col;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.1 - (k / len) * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          if (c.life <= 0 || c.y > h + 60 || c.x < -60 || c.x > w + 60) comets.splice(ci, 1);
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(loop);
      };
      loop();
    }

    /* destello de hipervelocidad */
    function flashOnce() {
      const fl = $("#love-flash");
      if (!fl) return;
      fl.classList.remove("love-flash--on");
      void fl.offsetWidth;
      fl.classList.add("love-flash--on");
    }

    /* galaxias que pasan de largo durante el viaje */
    function flyGalaxies() {
      const layer = $("#love-galaxies");
      const g = window.gsap;
      const hues = ["g-red", "g-rose", "g-slate", "g-charcoal"];
      for (let i = 0; i < 5; i++) {
        const gal = document.createElement("div");
        gal.className = "love-galaxy " + hues[i % hues.length];
        const sz = 170 + Math.random() * 240;
        gal.style.width = sz + "px";
        gal.style.height = sz + "px";
        gal.style.top = (6 + Math.random() * 66).toFixed(0) + "%";
        layer.appendChild(gal);
        const fromLeft = i % 2 === 0;
        g.fromTo(gal,
          { xPercent: fromLeft ? -160 : 160, scale: 0.45, opacity: 0, rotate: -35 },
          { xPercent: fromLeft ? 140 : -140, scale: 1.5, opacity: 0.55, rotate: 30,
            duration: 6.5 + Math.random() * 3, ease: "power2.inOut", delay: i * 3.2 });
        setTimeout(() => gal.remove(), 32000);
      }
    }

    /* latido del corazón: anillos rojos que expanden */
    function buildBeats() {
      const host = $("#love-beats");
      if (!host) return;
      host.innerHTML = "";
      for (let i = 0; i < 3; i++) {
        const b = document.createElement("div");
        b.className = "love-beat";
        b.style.animationDelay = (i * 1.2).toFixed(1) + "s";
        host.appendChild(b);
      }
    }

    /* ascuas rojas que suben desde abajo, algunas son corazoncitos */
    function buildEmbers() {
      const host = $("#love-embers");
      if (!host) return;
      host.innerHTML = "";
      for (let i = 0; i < 18; i++) {
        const e = document.createElement("div");
        e.className = "love-ember";
        e.style.left = (2 + Math.random() * 96).toFixed(1) + "%";
        const sz = 3 + Math.random() * 4;
        if (i % 7 === 0) {
          e.textContent = "🩶";
          e.classList.add("love-ember-heart");
          e.style.fontSize = (sz * 3) + "px";
          e.style.lineHeight = "1";
        } else {
          e.style.width = e.style.height = sz.toFixed(1) + "px";
        }
        e.style.setProperty("--ed", (7 + Math.random() * 6).toFixed(1) + "s");
        e.style.setProperty("--edd", (-Math.random() * 13).toFixed(1) + "s");
        e.style.setProperty("--ex", ((Math.random() - 0.5) * 80).toFixed(1) + "px");
        host.appendChild(e);
      }
    }

    /* planetas que rozan la cámara */
    function flyPlanets() {
      const layer = $("#love-galaxies");
      const g = window.gsap;
      const kinds = ["planet-red", "planet-gray"];
      for (let i = 0; i < 2; i++) {
        const pl = document.createElement("div");
        pl.className = "love-planet " + kinds[i % 2];
        const sz = 110 + Math.random() * 70;
        pl.style.width = pl.style.height = sz + "px";
        pl.style.left = "50%";
        pl.style.top = "42%";
        layer.appendChild(pl);
        const fromLeft = i % 2 === 0;
        g.fromTo(pl,
          { xPercent: -50, yPercent: -50, scale: 0.25, opacity: 0, rotate: fromLeft ? 40 : -40 },
          { xPercent: fromLeft ? 240 : -270, yPercent: fromLeft ? 110 : -80, scale: 2.1, opacity: 0.85,
            rotate: fromLeft ? 140 : -140, duration: 8 + Math.random() * 2, ease: "power1.inOut", delay: 5 + i * 7 });
        setTimeout(() => pl.remove(), 26000);
      }
    }

    /* zonas del viaje: nombres de galaxias que vamos cruzando */
    function scheduleZones() {
      const host = $("#love-zones");
      if (!host) return;
      host.innerHTML = "";
      const g = window.gsap;
      const zones = C.letter.journey.zones || [];
      zones.forEach((label, i) => {
        const z = document.createElement("div");
        z.className = "love-zone";
        z.textContent = label;
        host.appendChild(z);
        const tl = g.timeline({ delay: 1.2 + i * 2.1 });
        tl.fromTo(z, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
          .to(z, { opacity: 1, duration: 1.7 })
          .to(z, { opacity: 0, y: -8, duration: 0.5, ease: "power1.in" });
        zoneKills.push(tl);
      });
    }

    /* corazones que estallan desde el centro al llegar */
    function heartBurst() {
      const stage = $("#love-stage");
      const r = stage.getBoundingClientRect();
      const cx = r.width / 2;
      const cy = r.height * 0.42;
      const glyphs = ["🩶", "🌹", "💌"];
      for (let i = 0; i < 12; i++) {
        const e = document.createElement("div");
        e.className = "love-burst";
        e.textContent = glyphs[i % 3];
        e.style.left = cx + "px";
        e.style.top = cy + "px";
        const ang = (i / 12) * Math.PI * 2;
        const dist = 70 + Math.random() * 90;
        e.style.setProperty("--ex", (Math.cos(ang) * dist).toFixed(0) + "px");
        e.style.setProperty("--ey", (Math.sin(ang) * dist - 40).toFixed(0) + "px");
        stage.appendChild(e);
        setTimeout(() => e.remove(), 1300);
      }
    }

    /* mensajes románticos cruzándose en el viaje */
    function streamMessages(pool, onDone) {
      const layer = $("#love-messages");
      const g = window.gsap;
      const msgs = C.letter.journey.messages || [];
      const pace = C.letter.journey.pace || 0.9;
      const glyphs = ["🩶", "🌹", "💌", "✦", "🌙", "💫"];
      pool.forEach((mi, i) => {
        const el = document.createElement("div");
        const tier = [26, 32, 42, 54][mi % 4];
        el.className = "love-msg " + (tier >= 42 ? "love-msg--near" : "love-msg--far");
        el.textContent = msgs[mi] + (Math.random() < 0.4 ? " " + glyphs[(mi + i) % glyphs.length] : "");
        el.style.fontSize = tier + "px";
        el.style.top = (5 + Math.random() * 82).toFixed(1) + "%";
        layer.appendChild(el);
        const radial = mi % 4 === 3;
        const start = i * pace;
        let tl;
        if (radial) {
          el.classList.add("love-msg--radial");
          const dur = 4.8 + Math.random() * 1.6;
          tl = g.timeline({ delay: start });
          tl.set(el, { left: "50%", xPercent: -50, scale: 0.45, opacity: 0, rotate: 0 })
            .to(el, { opacity: 1, duration: 0.5 }, 0.15)
            .to(el, { scale: 3.2, duration: dur, ease: "power1.out" }, 0)
            .to(el, { opacity: 0, duration: dur * 0.35 }, dur * 0.65);
          setTimeout(() => el.remove(), start * 1000 + dur * 1000 + 3200);
        } else {
          const fromLeft = i % 2 === 0;
          const rot = fromLeft ? -4 : 4;
          const dur = tier >= 42 ? 4.6 + Math.random() * 1.6 : 3.2 + Math.random() * 1.4;
          tl = g.timeline({ delay: start });
          tl.set(el, { xPercent: fromLeft ? -25 : 125, opacity: 0, rotate: rot, scale: 1 })
            .to(el, { opacity: 1, duration: 0.4 }, 0.1)
            .to(el, { xPercent: fromLeft ? 120 : -20, duration: dur, ease: "power1.inOut" }, 0)
            .to(el, { opacity: 0, duration: dur * 0.14 }, dur * 0.86);
          setTimeout(() => el.remove(), start * 1000 + dur * 1000 + 3200);
        }
      });
      flowKill = g.delayedCall((pool.length - 1) * pace + 1.5, onDone);
    }

    function buildStatic() {
      const layer = $("#love-messages");
      const msgs = (C.letter.journey || {}).messages || [];
      layer.classList.add("love-static");
      msgs.forEach((m) => {
        const el = document.createElement("div");
        el.className = "love-msg-static";
        el.textContent = m;
        layer.appendChild(el);
      });
    }

    function arrive() {
      const final = $("#love-final");
      final.hidden = false;
      const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (window.gsap && !reduced) {
        warpState.burst = 1;
        flashOnce();
        window.gsap.fromTo(final,
          { opacity: 0, y: 26, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.6)" });
        heartBurst();
      } else {
        final.style.opacity = "1";
      }
    }

    function enter() {
      fillTexts();
      const stage = $("#love-stage");
      const ov = $("#letter-overlay");
      const sc = $("#env-scene");
      $("#love-replay").hidden = true;
      if (sc) sc.classList.remove("env-scene--open");
      ov.hidden = true;
      stage.style.display = "";
      if (entered) detach();
      entered = true;

      const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      const fancy = !!window.gsap && !reduced;
      const j = C.letter.journey || {};

      const kicker = $("#love-kicker");
      kicker.textContent = j.kicker || "";
      $("#love-final-line").textContent = j.finalLine || "";
      $("#open-letter-btn").textContent = j.cta || "Abrir carta 💌";

      if (reduced) {
        buildStatic();
        arrive();
        return;
      }

      startWarp();
      if (window.gsap) {
        const g = window.gsap;
        buildBeats();
        buildEmbers();
        flyPlanets();
        scheduleZones();
        flyGalaxies();
        flashOnce();
        g.fromTo(kicker, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.2 });
        g.to(kicker, { opacity: 0, y: -16, duration: 0.5, ease: "power1.in", delay: 2.4 });
      }

      const msgs = j.messages || [];
      const cycles = Math.min(4, Math.max(1, j.cycles || 2));
      const pool = [];
      for (let c = 0; c < cycles; c++) {
        const batch = msgs.map((m, i) => i);
        for (let k = batch.length - 1; k > 0; k--) {
          const r = Math.floor(Math.random() * (k + 1));
          [batch[k], batch[r]] = [batch[r], batch[k]];
        }
        pool.push(...batch);
      }

      if (fancy) {
        streamMessages(pool, () => setTimeout(arrive, 600));
      } else {
        buildStatic();
        setTimeout(arrive, 2000);
      }
    }

    function openLetter() {
      const ov = $("#letter-overlay");
      const sc = $("#env-scene");
      const btn = $("#open-letter-btn");
      const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      detach();
      ov.hidden = false;
      requestAnimationFrame(() => {
        if (sc) sc.classList.add("env-scene--open");
        if (!reduced) {
          try { explode(btn, true); } catch (err) { console.warn("confetti:", err); }
        }
      });
      if (reduced) {
        setTimeout(() => { try { typeLetter(); } catch (err) { console.warn("type:", err); } }, 60);
        return;
      }
      setTimeout(() => { try { typeLetter(); } catch (err) { console.warn("type:", err); } }, 1400);
    }

    function closeLetter(replay) {
      const ov = $("#letter-overlay");
      const sc = $("#env-scene");
      if (twTimer) { clearInterval(twTimer); twTimer = null; }
      if (sc) sc.classList.remove("env-scene--open");
      ov.hidden = true;
      if (replay) {
        entered = false;
        enter();
      }
    }

    /* la carta se escribe sola, letra por letra */
    let twTimer = null;
    function typeLetter() {
      const body = $("#letter-body");
      if (!body) return;
      const ps = Array.from(body.querySelectorAll("p"));
      if (!ps.length) return;
      if (twTimer) { clearInterval(twTimer); twTimer = null; }
      const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (reduced) return;
      const full = ps.map((p) => p.textContent);
      ps.forEach((p) => (p.textContent = ""));
      const sig = $("#letter-signature");
      if (sig) sig.style.opacity = "0";
      let pi = 0, ci = 0, wait = 0;
      twTimer = setInterval(() => {
        if (wait > 0) { wait--; return; }
        const f = full[pi];
        if (ci < f.length) {
          ps[pi].textContent += f[ci];
          ci++;
        } else {
          const last = pi === ps.length - 1;
          pi++;
          ci = 0;
          if (pi >= ps.length) {
            clearInterval(twTimer);
            twTimer = null;
            if (last) { const s = $("#letter-signature"); if (s) s.style.opacity = "1"; }
            return;
          }
          wait = 10;
        }
      }, 14);
    }

    function bindLetter() {
      $("#open-letter-btn").addEventListener("click", openLetter);
      $("#letter-close").addEventListener("click", () => closeLetter(false));
      $("#love-replay").addEventListener("click", () => closeLetter(true));
    }

    return { enter, bindLetter };
  })();

  /* ------------------------------------------------------------
     NUESTRO MES — candado telefónico + contador en tiempo real
  ------------------------------------------------------------ */
  const Counter = (() => {
    const ANN = new Date(C.timeline.anniversary);
    const PIN = String(C.timeline.pinCode || "02222026");
    const REDUCED = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dotEls = [];
    let buffer = "";
    let locked = true;
    let intv = null;

    function addMonths(d, n) {
      const r = new Date(d);
      const day = r.getDate();
      r.setDate(1);
      r.setMonth(r.getMonth() + n);
      const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
      r.setDate(Math.min(day, last));
      r.setHours(ANN.getHours(), ANN.getMinutes(), ANN.getSeconds(), 0);
      return r;
    }

    function parts(now) {
      if (now < ANN) return { y: 0, mo: 0, d: 0, h: 0, mi: 0, s: 0 };
      let anchor = new Date(ANN);
      let months = 0;
      while (true) {
        const nxt = addMonths(anchor, 1);
        if (nxt > now) break;
        anchor = nxt;
        months++;
      }
      const sec = Math.floor((now - anchor) / 1000);
      return {
        y: Math.floor(months / 12),
        mo: months % 12,
        d: Math.floor(sec / 86400),
        h: Math.floor((sec % 86400) / 3600),
        mi: Math.floor((sec % 3600) / 60),
        s: sec % 60,
      };
    }

    function label(n, one, many) { return n === 1 ? one : many; }

    function buildTitle() {
      $("#timeline-title").textContent = C.timeline.title;
      $("#timeline-subtitle").textContent = C.timeline.subtitle;
      $("#phone-lock-title").textContent = C.timeline.lockTitle;
      $("#phone-lock-hint").textContent = C.timeline.lockHint;
    }

    function buildDots() {
      const box = $("#pin-dots");
      box.textContent = "";
      dotEls = [];
      for (let i = 0; i < PIN.length; i++) {
        const d = document.createElement("span");
        d.className = "pin-dot";
        box.appendChild(d);
        dotEls.push(d);
      }
    }

    function renderDots() {
      dotEls.forEach((el, i) => el.classList.toggle("is-filled", i < buffer.length));
    }

    function clearBuffer() { buffer = ""; renderDots(); }

    function shock() {
      const lock = $("#phone-lock");
      lock.classList.remove("shake");
      void lock.offsetWidth;
      lock.classList.add("shake");
      setTimeout(() => lock.classList.remove("shake"), 500);
      setTimeout(clearBuffer, 430);
    }

    function startCounter() {
      if (intv) clearInterval(intv);
      tick();
      intv = setInterval(tick, 1000);
    }

    function unlock() {
      locked = false;
      const lock = $("#phone-lock");
      const counter = $("#phone-counter");
      if (REDUCED()) {
        lock.hidden = true;
        counter.hidden = false;
        startCounter();
        return;
      }
      lock.style.pointerEvents = "none";
      gsap.to(lock, {
        opacity: 0, scale: 0.82, rotateX: 30, duration: 0.42, ease: "power2.in",
        onComplete() {
          lock.hidden = true;
          gsap.set(lock, { opacity: 1, scale: 1, rotateX: 0, clearProps: "pointer-events" });
        },
      });
      counter.hidden = false;
      gsap.fromTo(
        counter,
        { opacity: 0, scale: 0.9, rotateX: -22, y: 26 },
        { opacity: 1, scale: 1, rotateX: 0, y: 0, duration: 0.5, ease: "back.out(1.5)" }
      );
      explode(counter, false);
      startCounter();
    }

    function press(k) {
      if (!locked) return;
      if (k === "clear") { clearBuffer(); return; }
      if (k === "back") { buffer = buffer.slice(0, -1); renderDots(); return; }
      if (buffer.length >= PIN.length) return;
      buffer += k;
      renderDots();
      if (buffer.length === PIN.length) {
        if (buffer === PIN) unlock();
        else shock();
      }
    }

    function kpBtn(text, key, util) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "kp-btn" + (util ? " kp-btn--util" : "");
      b.textContent = text;
      b.setAttribute("aria-label", text);
      b.addEventListener("click", () => press(key));
      return b;
    }

    function buildKeypad() {
      const pad = $("#keypad");
      pad.textContent = "";
      for (let i = 1; i <= 9; i++) pad.appendChild(kpBtn(String(i), i));
      pad.appendChild(kpBtn("C", "clear", true));
      pad.appendChild(kpBtn("0", 0));
      pad.appendChild(kpBtn("⌫", "back", true));
    }

    function statusClock() {
      const e1 = $("#phone-time");
      const e2 = $("#phone-time-2");
      const up = () => {
        const t = new Date();
        const s = String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0");
        if (e1) e1.textContent = s;
        if (e2) e2.textContent = s;
      };
      up();
      setInterval(up, 30000);
    }

    function tick() {
      const p = parts(Date.now());
      $("#mc-years").textContent = p.y;
      $("#mc-months").textContent = p.mo;
      $("#mc-months-label").textContent = label(p.mo, "mes", "meses");
      $("#mc-days").textContent = p.d;
      $("#mc-hours").textContent = p.h;
      $("#mc-minutes").textContent = p.mi;
      $("#mc-seconds").textContent = p.s;
    }

    function onEnter() {
      buildTitle();
      buildDots();
      buildKeypad();
      clearBuffer();
      locked = true;
      fillLetter();
      buildMemories();
      bindMonthActions();
      gsap.set([$("#phone-lock"), $("#phone-counter")], { opacity: 1, scale: 1, rotateX: 0 });
      $("#phone-lock").hidden = false;
      $("#phone-counter").hidden = true;
      $("#phone-lock").style.pointerEvents = "";
      if (intv) clearInterval(intv);
    }

    /* ---------- carta de nuestro mes ---------- */
    function fillLetter() {
      const L = C.timeline.letter;
      if (!L) return;
      const t = $("#month-letter-title");
      const b = $("#month-letter-body");
      const s = $("#month-letter-sign");
      if (t) t.textContent = L.title;
      if (b) b.innerHTML = L.body.map((p) => `<p>${p}</p>`).join("");
      if (s) s.textContent = L.signature || "";
    }

    /* ---------- recuerdos de nuestro mes ---------- */
    function memoryDate(days) {
      const off = days - 1;
      const d = new Date(ANN.getFullYear(), ANN.getMonth(), ANN.getDate() + off, ANN.getHours(), ANN.getMinutes());
      return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
    }

    function buildMemories() {
      const M = C.timeline.memories;
      const list = $("#memories-list");
      if (!M || !list || list.childElementCount) return;
      const t = $("#month-memories-title");
      const sub = $("#month-memories-sub");
      const ep = $("#month-epilogue");
      if (t) t.textContent = M.title;
      if (sub) sub.textContent = M.subtitle;
      C.timeline.milestones.forEach((m) => {
        const card = document.createElement("div");
        card.className = "memory-card";
        card.innerHTML =
          `<span class="memory-card-title">${m.title}</span>` +
          `<span class="memory-card-text">${m.text}</span>` +
          `<span class="memory-card-date">${memoryDate(m.days)}</span>`;
        list.appendChild(card);
      });
      if (ep) ep.textContent = C.timeline.epilogue;
      const f = $("#month-forever-btn");
      if (f) f.textContent = M.celebrationCTA || "Quedate para siempre 🩶";
    }

    /* ---------- apertura/cierre de overlays + acciones ---------- */
    function openOverlay(id) {
      const ov = $(id);
      if (!ov) return;
      ov.hidden = false;
      if (REDUCED()) return;
      try {
        const card = ov.querySelector(".month-letter, .month-memories");
        if (card) {
          gsap.fromTo(card, { opacity: 0, scale: 0.85, y: 26 }, { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: "back.out(1.6)" });
        }
      } catch (e) { /* noop */ }
    }

    function closeOverlay(id) {
      const ov = $(id);
      if (ov) ov.hidden = true;
    }

    function forever() {
      const btn = $("#month-forever-btn");
      if (btn) {
        try { explode(btn, true); } catch (e) { console.warn("forever:", e); }
      }
      const msg = document.createElement("div");
      msg.className = "month-forever-msg";
      msg.textContent = "Y no es un adiós, es el empezar de siempre 🩶";
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3200);
    }

    let actionsBound = false;
    function bindMonthActions() {
      if (actionsBound) return;
      actionsBound = true;
      const l = $("#month-letter-btn");
      const m = $("#month-memories-btn");
      if (l) {
        l.addEventListener("click", () => {
          try { explode(l, false); } catch (e) {}
          openOverlay("#month-letter-overlay");
        });
      }
      if (m) m.addEventListener("click", () => openOverlay("#month-memories-overlay"));
      const lc = $("#month-letter-close");
      const mc = $("#month-memories-close");
      if (lc) lc.addEventListener("click", () => closeOverlay("#month-letter-overlay"));
      if (mc) mc.addEventListener("click", () => closeOverlay("#month-memories-overlay"));
      const fb = $("#month-forever-btn");
      if (fb) fb.addEventListener("click", forever);
      const kb = $("#letter-keep-btn");
      if (kb) {
        kb.addEventListener("click", () => {
          try { explode(kb, false); } catch (e) {}
          const msg = document.createElement("div");
          msg.className = "month-forever-msg";
          msg.textContent = "Guardada para siempre en nuestro corazón 🩶";
          document.body.appendChild(msg);
          setTimeout(() => {
            closeOverlay("#month-letter-overlay");
            msg.remove();
          }, 1800);
        });
      }
    }

    statusClock();

    return { onEnter };
  })();

  /* ------------------------------------------------------------
     CONFETTI + corazoncitos
  ------------------------------------------------------------ */
  function explode(anchor, love) {
    const layer = $("#confetti-layer");
    const rect = anchor.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const colors = love
      ? ["#ff2e5f", "#ff6b85", "#c40a3e", "#ffffff", "#ff93ab", "#8b0e35"]
      : ["#ffd60a", "#ffe14d", "#f5a800", "#ff8fab", "#9ef01a", "#ffffff", "#ffb347"];

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

    const glyphs = love ? ["🩶", "🌹", "💌"] : ["🩶", "🌼"];
    for (let i = 0; i < 10; i++) {
      const h = document.createElement("div");
      h.className = "heart-pop";
      h.textContent = glyphs[i % glyphs.length];
      h.style.left = cx + (Math.random() - 0.5) * 120 + "px";
      h.style.top = cy + "px";
      h.style.animationDelay = (Math.random() * 0.5).toFixed(2) + "s";
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 2200);
    }
  }

  /* ------------------------------------------------------------
     Decoración de cielos: estrellas + flotantes
  ------------------------------------------------------------ */
  function seedStars(host, total, cls, colorSet) {
    if (!host || host.childElementCount) return;
    for (let i = 0; i < total; i++) {
      const s = document.createElement("span");
      s.className = cls;
      const size = (1.6 + Math.random() * 2.6).toFixed(1);
      const c = colorSet[i % colorSet.length];
      s.style.cssText =
        `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;` +
        `width:${size}px;height:${size}px;background:${c};` +
        `--tw:${(2.6 + Math.random() * 4).toFixed(2)}s;--td:${(-Math.random() * 6).toFixed(2)}s;`;
      host.appendChild(s);
    }
  }

  function seedMonthFloats() {
    const host = $("#month-floats");
    if (!host || host.childElementCount) return;
    const glyphs = ["🩶", "✨", "💫", "🌼", "⭐", "🩶"];
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("span");
      s.className = "month-float";
      const side = i % 2;
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = (side ? 84 + Math.random() * 10 : 4 + Math.random() * 12).toFixed(1) + "%";
      s.style.top = (20 + Math.random() * 60).toFixed(0) + "%";
      s.style.setProperty("--sz", (13 + Math.random() * 12).toFixed(1) + "px");
      s.style.setProperty("--af", (13 + Math.random() * 9).toFixed(1) + "s");
      s.style.setProperty("--ad", (-Math.random() * 18).toFixed(1) + "s");
      host.appendChild(s);
    }
  }

  /* ------------------------------------------------------------
     Ambiente: corazones y brillitos flotando en toda la página
  ------------------------------------------------------------ */
  function buildAmbient() {
    const host = $("#ambient");
    if (!host || host.childElementCount) return;
    const glyphs = ["🩶", "🌼", "✨", "💫", "🩶", "⭐"];
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
     LOVE FIELD — orbs bokeh de amor + cometas doradas
     (el polvo de oro fino lo dibuja tsParticles)
  ------------------------------------------------------------ */
  function startLoveCanvas() {
    const cv = $("#love-canvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ORBS = [
      [255, 214, 10], [255, 143, 171], [176, 130, 255], [255, 185, 45], [255, 105, 165],
    ];
    let W = 0, H = 0, raf = null, running = false;
    const orbs = [];
    const comets = [];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + "px";
      cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function newOrb(init) {
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : H + 90 + Math.random() * 130,
        r: 46 + Math.random() * 110,
        vy: 0.05 + Math.random() * 0.14,
        sway: Math.random() * Math.PI * 2,
        sw: 0.003 + Math.random() * 0.006,
        phase: Math.random() * Math.PI * 2,
        c: ORBS[Math.floor(Math.random() * ORBS.length)],
      };
    }

    function spawnComet() {
      const fromLeft = Math.random() < 0.5;
      comets.push({
        x: fromLeft ? -40 : W + 40,
        y: 0.08 * H + Math.random() * 0.42 * H,
        vx: (fromLeft ? 1 : -1) * (2.2 + Math.random() * 1.4),
        vy: 0.7 + Math.random() * 0.7,
        len: 90 + Math.random() * 90,
      });
    }

    function drawFrame() {
      ctx.clearRect(0, 0, W, H);

      for (const o of orbs) {
        o.y -= o.vy;
        o.sway += o.sw;
        o.phase += 0.02;
        const x = o.x + Math.sin(o.sway) * 40;
        const alpha = 0.05 + 0.045 * (0.5 + 0.5 * Math.sin(o.phase));
        const g = ctx.createRadialGradient(x, o.y, 0, x, o.y, o.r);
        g.addColorStop(0, "rgba(" + o.c.join(",") + "," + alpha.toFixed(3) + ")");
        g.addColorStop(1, "rgba(" + o.c.join(",") + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        if (o.y < -o.r - 40) Object.assign(o, newOrb(false));
      }

      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.x += c.vx;
        c.y += c.vy;
        const g = ctx.createLinearGradient(c.x, c.y, c.x - c.vx * c.len, c.y - c.vy * c.len);
        g.addColorStop(0, "rgba(255, 225, 77, 0.85)");
        g.addColorStop(1, "rgba(255, 214, 10, 0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x - c.vx * c.len, c.y - c.vy * c.len);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 240, 185, 0.95)";
        ctx.beginPath();
        ctx.arc(c.x, c.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        if (c.x < -160 || c.x > W + 160 || c.y > H + 90) comets.splice(i, 1);
      }
    }

    resize();
    for (let i = 0; i < 8; i++) orbs.push(newOrb(true));

    if (reduced) {
      drawFrame();
      return;
    }

    function loop() {
      if (!running) return;
      drawFrame();
      raf = requestAnimationFrame(loop);
    }

    running = true;
    loop();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        loop();
      }
    });
    setInterval(() => {
      if (!document.hidden && comets.length < 2) spawnComet();
    }, 6000);
  }

  /* ------------------------------------------------------------
     DESTELLOS al tocar — chispitas doradas en cada gesto
  ------------------------------------------------------------ */
  function bindTapSparkle() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.addEventListener("pointerdown", (e) => {
      spawnTapSpark(e.clientX, e.clientY);
    }, { passive: true });
  }

  function spawnTapSpark(x, y) {
    const glyphs = ["✨", "🩶", "💫"];
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "tap-spark";
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.setProperty("--sx", (Math.random() * 96 - 48).toFixed(0) + "px");
      s.style.setProperty("--sy", (-32 - Math.random() * 76).toFixed(0) + "px");
      s.style.setProperty("--sr", (Math.random() * 60 - 30).toFixed(0) + "deg");
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
  }

  /* ------------------------------------------------------------
     LLUVIA de corazones al entrar a una sección
  ------------------------------------------------------------ */
  function heartsRain() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const glyphs = ["🩶", "🩶", "🩶", "🩶", "✨", "🌼"];
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span");
      s.className = "rain-heart";
      s.textContent = glyphs[i % glyphs.length];
      s.style.setProperty("--lx", (Math.random() * 100).toFixed(1) + "%");
      s.style.setProperty("--sz", (15 + Math.random() * 14).toFixed(1) + "px");
      s.style.setProperty("--fd", (2.4 + Math.random() * 1.6).toFixed(1) + "s");
      s.style.setProperty("--ad", (Math.random() * 0.9).toFixed(2) + "s");
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 4300);
    }
  }

  /* ------------------------------------------------------------
     ESTELA de corazones al mover el dedo / cursor
  ------------------------------------------------------------ */
  function bindHeartTrail() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = 0;
    document.addEventListener("pointermove", (e) => {
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      const s = document.createElement("span");
      s.className = "trail-heart";
      s.textContent = e.pointerType === "touch" ? "🩶" : "🩶";
      s.style.left = e.clientX + "px";
      s.style.top = e.clientY + "px";
      s.style.setProperty("--tx", (Math.random() * 44 - 22).toFixed(0) + "px");
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1500);
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     Entrada del hero: letras que vuelan (una sola vez)
  ------------------------------------------------------------ */
  function splitLetters(title) {
    if (title.dataset.split) return [];
    const text = title.textContent.trim();
    title.textContent = "";
    const spans = [];
    for (const ch of text) {
      const s = document.createElement("span");
      s.className = "hl";
      if (ch === " ") {
        s.style.width = "0.34em";
        s.textContent = "\u00A0";
      } else {
        s.textContent = ch;
      }
      spans.push(s);
      title.appendChild(s);
    }
    title.dataset.split = "1";
    return spans;
  }

  function playHeroIntro() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.gsap) return;
    const title = $(".hero-title");
    const badge = $(".hero-badge");
    const sub = $(".hero-sub");
    const date = $("#hero-date");
    if (!title || !badge || !sub || !date) return;
    const letters = splitLetters(title);
    if (!letters.length) return;
    const tl = window.gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(badge, { scale: 0, rotate: -30, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: "back.out(1.8)" })
      .fromTo(letters, { y: 46, rotate: 8, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: "back.out(1.6)" }, "-=0.25")
      .fromTo(sub, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.15")
      .fromTo(date, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, "-=0.1");
  }

  /* ------------------------------------------------------------
     Polvo de oro — tsParticles
  ------------------------------------------------------------ */
  function initTSParticles() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.tsParticles) return;
    const host = $(".gold-dust");
    if (!host) return;

    const emojiUrl = (ch) =>
      "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">' +
        '<text y="40" font-size="42">' + ch + "</text></svg>"
      );

    window.__tsP = window.tsParticles.load(host, {
      fpsLimit: 60,
      pauseOnBlur: true,
      detectRetina: true,
      background: { color: "transparent" },
      particles: {
        number: { value: 70 },
        color: { value: ["#ffd60a", "#ffe14d", "#ff8fab", "#fff8e1"] },
        shape: { type: "image", options: { image: [
          { src: emojiUrl("🩶"), width: 48, height: 48 },
          { src: emojiUrl("🌼"), width: 48, height: 48 },
        ] } },
        opacity: {
          value: 0.5,
          animation: { enable: true, speed: 0.6, sync: false, minimumValue: 0.15 },
        },
        size: { value: 16, random: { enable: true, minimumValue: 5 } },
        move: {
          enable: true,
          speed: 0.55,
          direction: "top",
          straight: false,
          outModes: { default: "bounce" },
        },
        twinkle: { particles: { enable: true, color: "#ffe14d", frequency: 0.05, opacity: 0.6 } },
        links: { enable: true, distance: 110, color: "#ffd60a", opacity: 0.18, width: 1 },
      },
      interactivity: {
        detectsOn: "window",
        events: { onHover: { enable: false }, onClick: { enable: false }, resize: true },
      },
    });
  }

  /* ------------------------------------------------------------
     Boot
  ------------------------------------------------------------ */
  function boot() {
    detectSection();
    try { renderCards(); } catch (e) { console.warn("cards:", e); }
    try { bindNav(); } catch (e) { console.warn("nav:", e); }
    try { Love.bindLetter(); } catch (e) { console.warn("letter:", e); }
    try { Galaxy.bindLightbox(); } catch (e) { console.warn("lightbox:", e); }
    try { buildAmbient(); } catch (e) { console.warn("ambient:", e); }
    try {
      seedStars($("#landing-stars"), 42, "star-dot", ["#ffe14d", "#fff8e1", "#ffd60a", "#ffffff", "#ffb347"]);
    } catch (e) { console.warn("lstars:", e); }
    try {
      seedStars($("#month-stars"), 30, "star-dot", ["#ffe14d", "#fff8e1", "#f5a800", "#ffd60a"]);
    } catch (e) { console.warn("mstars:", e); }
    try { seedMonthFloats(); } catch (e) { console.warn("mfloats:", e); }
    try { startLoveCanvas(); } catch (e) { console.warn("lovefield:", e); }
    try { bindTapSparkle(); } catch (e) { console.warn("tapspark:", e); }
    try { bindHeartTrail(); } catch (e) { console.warn("trail:", e); }
    try { startLiveCards(); } catch (e) { console.warn("livecards:", e); }
    try { startShootingStars(); } catch (e) { console.warn("stars:", e); }
    try { startButterflies(); } catch (e) { console.warn("butterflies:", e); }
    try { setupMusic(); } catch (e) { console.warn("music:", e); }
    try { initTSParticles(); } catch (e) { console.warn("tsparticles:", e); }
    try { playHeroIntro(); } catch (e) { console.warn("hero:", e); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();