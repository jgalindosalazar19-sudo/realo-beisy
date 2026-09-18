window.PAGE_CONFIG = {
  names: {
    her: "Mi amor",
    me: "Tu persona"
  },

  unlockDates: {
    galaxy: new Date(2026, 8, 19), // 19 de septiembre
    letter: new Date(2026, 8, 21), // 21 de septiembre
    timeline: new Date(2026, 8, 22) // 22 de septiembre
  },

  galaxy: {
    title: "Flores Amarillas",
    subtitle: "19 de septiembre · Día de las Flores Amarillas",
    intro:
      "Dicen que regalar flores amarillas es un gesto de amor y de verano eterno. Tocá los mensajes de la galaxia y descubrí la foto de cada momento nuestro.",
    messages: [
      { text: "Te amo", photo: 0 },
      { text: "Mi niña", photo: 1 },
      { text: "Hermosa", photo: 2 },
      { text: "Ojos hermosos", photo: 3 },
      { text: "Mi vida", photo: 4 },
      { text: "Mi todo", photo: 5 },
      { text: "Estaré", photo: 6 },
      { text: "Contigo", photo: 7 },
      { text: "Siempre", photo: 8 }
    ],
    photos: [
      { src: "photos/1.jpg?v=2", caption: "El inicio de todo" },
      { src: "photos/2.jpg?v=2", caption: "Nuestra primera risa compartida" },
      { src: "photos/3.jpg?v=2", caption: "Ese día que no quisimos que terminara" },
      { src: "photos/4.jpg?v=2", caption: "Tus flores amarillas, mi persona favorita" },
      { src: "photos/5.jpg?v=2", caption: "Momentos simples, corazones grandes" },
      { src: "photos/6.jpg?v=2", caption: "De tu mano, todo es mejor" },
      { src: "photos/7.jpg?v=2", caption: "Nuestro mundo en una mirada" },
      { src: "photos/8.jpg?v=2", caption: "El verano que se quedó conmigo" },
      { src: "photos/9.jpg?v=2", caption: "Cada foto, un latido" },
      { src: "photos/10.jpg?v=2", caption: "Y lo mejor está por venir" }
    ]
  },

  letter: {
    title: "Amor y Amistad",
    subtitle: "21 de septiembre · Día de la Amistad (y del amor)",
    envelopeLabel: "Tenés un mensaje para vos",
    letterTitle: "Para la dueña de mis días",
    letterBody: [
      "Hoy se celebra el Día del Amor y la Amistad, y no pude evitar pensar que con vos no hace falta que exista una fecha para celebrar lo nuestro.",
      "Porque primero fuimos amigues, nos reímos, nos contamos todo, y de ese cariño nació algo más grande. Y acá estoy yo, enamorado de mi mejor amiga.",
      "Gracias por cada mensaje, cada llamada, cada momento que ya es eterno en mi memoria. Gracias por elegirme todos los días.",
      "Que el universo me regale muchísimos años más a tu lado. Feliz día, mi amor."
    ],
    signature: "Con todo mi corazón, de tu persona ✔",
    postcards: [
      { title: "Mi lugar favorito", text: "Donde sea que estés, ese es mi lugar favorito.", icon: "heart" },
      { title: "Te elijo hoy...", text: "...y te voy a elegir todos los días.", icon: "star" },
      { title: "Nuestra canción", text: "Cada canción me recuerda a vos, y todas me gustan.", icon: "music" },
      { title: "Reírme de todo", text: "Mi mejor momento: cuando nos reímos de nada por horas.", icon: "smile" },
      { title: "Mi paz", text: "Tu voz es mi lugar seguro.", icon: "home" },
      { title: "Siempre juntos", text: "Pase lo que pase, elegimos caminar juntos.", icon: "infinity" }
    ]
  },

  timeline: {
    title: "Nuestro Mes",
    subtitle: "22 de septiembre · Un mes juntos",
    counterTitle: "Llevamos juntos...",
    celebrationTitle: "¿Qué va a ser? 💛",
    celebrationCTAs: ["¿Qué va a ser? 👇", "Quedate un mes más", "Quedate otro mes más", "Quedate para siempre 💛"],
    milestones: [
      { days: 1, title: "Día 1 — El comienzo", text: "El día que dijimos \"sí\" y el universo sonrió." },
      { days: 7, title: "Día 7 — Nuestra primera semana", text: "Siete días llenos de mensajes, risas y \"buenos días\"." },
      { days: 14, title: "Día 14 — Dos semanas", text: "Ya siento que te conozco de toda la vida y me queda toda una vida por conocer." },
      { days: 21, title: "Día 21 — Tres semanas", text: "Le agarré el gusto a tu risa, y ya no quiero soltarlo." },
      { days: 30, title: "Hoy — Capítulo 1", text: "Un mes de nosotros. Y esto recién arranca." }
    ],
    epilogue:
      "Un mes es poquito comparado con todo lo que viene. Gracias por elegirme, por acompañarme, por ser mi hogar. Te amo."
  },

  // Música de fondo opcional: poné enabled: true y la ruta del mp3 en src.
  music: {
    enabled: false,
    src: "", // ej: "music/nuestra-cancion.mp3"
    title: "Nuestra canción"
  },

  // Bloquea pruebas cambiando esto a false (así ves todo el contenido sin esperar las fechas)
  forceUnlock: false
};