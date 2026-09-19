window.PAGE_CONFIG = {
  names: {
    her: "Mi amor",
    me: "Tu persona"
  },

  unlockDates: {
    galaxy: new Date(2026, 8, 21), // 21 de septiembre
    letter: new Date(2026, 8, 19), // 19 de septiembre
    timeline: new Date(2026, 8, 22) // 22 de septiembre
  },

  galaxy: {
    title: "Flores Amarillas",
    subtitle: "21 de septiembre · Día de las Flores Amarillas",
    intro:
      "Dicen que regalar flores amarillas es un gesto de amor y si, lo es por eso hice esto para ti mi niña.",
    messages: [
      { text: "Te amo", photo: 0 },
      { text: "Mi niña", photo: 1 },
      { text: "Hermosa", photo: 2 },
      { text: "Ojos hermosos", photo: 3 },
      { text: "Mi vida", photo: 4 },
      { text: "Mi todo", photo: 5 },
      { text: "Estaré", photo: 6 },
      { text: "Contigo", photo: 7 },
      { text: "Siempre", photo: 8 },
      { text: "Mi flor favorita eres tú", photo: 3 },
      { text: "Sos mi lugar favorito", photo: 4 },
      { text: "Mi princesa amarilla", photo: 8 }
    ],
    finale: "TE AMO MI NIÑA 🩶",
    photos: [
      { src: "photos/1.jpg?v=2", caption: "Estaré contigo, siempre" },
      { src: "photos/2.jpg?v=2", caption: "La mujer de mi vida" },
      { src: "photos/3.jpg?v=2", caption: "Gracias por quedarte conmigo" },
      { src: "photos/4.jpg?v=2", caption: "Tus flores amarillas, mi persona favorita" },
      { src: "photos/5.jpg?v=2", caption: "Eres y serás tu, siempre" },
      { src: "photos/6.jpg?v=2", caption: "De tu mano, todo es mejor" },
      { src: "photos/7.jpg?v=2", caption: "tu mirada es mi mundo" },
      { src: "photos/8.jpg?v=2", caption: "Te amo mi niña" },
      { src: "photos/9.jpg?v=2", caption: "mi princesa hermosa" },
      { src: "photos/10.jpg?v=2", caption: "mi princesa hermosa" }
    ]
  },

  letter: {
    title: "Amor y Amistad",
    subtitle: "19 de septiembre · Un viaje entre galaxias",
    journey: {
      kicker: "Alistá tu corazón: nos vamos de viaje entre galaxias 💫",
      messages: [
        "Te amo mucho, mi niña",
        "La dueña de mi moto",
        "Mi tesoro más sagrado",
        "Estemos juntos toda la vida",
        "Mi compañera de vida",
        "Mi sonrisa hermosa",
        "Mis ojos enormes",
        "Mi futura esposa"
      ],
      cycles: 2,
      pace: 0.62,
      finalLine: "TE AMOOOOOOOOOOOOOOOOOOOOOO 🩶",
      cta: "Abrir carta 💌"
    },
    letterTitle: "Para la dueña de mi vida",
    letterBody: [
      "Mi niña hermosa, te amo con mi vida entera. Eres lo más hermoso que me pudo pasar en este mundo.",
      "En el día del amor y la amistad quiero demostrarte mi amor con esto. Quizás sea poco, pero te lo hice con todo el amor del mundo, CON TODO EL AMOR QUE TENGO PARA TI.",
      "Te amo, mi princesa hermosa. Feliz día del amor y la amistad."
    ]
  },

  timeline: {
    title: "Nuestro Mes",
    subtitle: "22 de septiembre · 7 meses juntos",
    lockTitle: "Felices 7 meses, mi amor",
    lockHint: "Ingresá fecha de noviazgo",
    pinCode: "02222026",
    anniversary: new Date(2026, 1, 22, 10, 3, 0),
    counterTitle: "Llevamos juntos...",
    celebrationTitle: "¿Qué va a ser? 🩶",
    celebrationCTAs: ["¿Qué va a ser? 👇", "Quedate un mes más", "Quedate otro mes más", "Quedate para siempre 🩶"],
    letter: {
      title: "Para mi princesa hermosa 💌",
      body: [
        "Mi princesa hermosa: el día de hoy quiero decirte que estamos cumpliendo 7 meses de tener esta hermosa y maravillosa relación.",
        "Mi amor precioso, te amo con todo mi ser. Independientemente de cualquier percance y mal rato que hayamos tenido, quiero que sepas que te amo, que tendremos nuestra relación soñada y que seremos los más felices del mundo.",
        "Todo saldrá excelente, mi niña hermosa. Te amo con todo mi ser, mi princesa.",
        "¡Felices 7 meses, mi niña hermosa! 🩶"
      ],
      signature: "— Tu persona, con todo mi amor 🩶"
    },
    memories: {
      title: "Nuestros recuerdos 🩶",
      subtitle: "un poquito de lo que ya vivimos",
      celebrationCTA: "Quedate para siempre 🩶"
    },
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