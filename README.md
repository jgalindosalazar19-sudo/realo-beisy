# Nuestras Fechas 💛

Web regalo para el 19, 21 y 22 de septiembre. Tres secciones que se desbloquean en su fecha correspondiente; después del 22 quedan todas abiertas para siempre.

- **19 sep · Flores Amarillas** — una galaxia amarilla donde las fotos orbitan como estrellas. Toca una para mirarla de cerca.
- **21 sep · Amor y Amistad** — sobre con carta + postales que se dan vuelta.
- **22 sep · Nuestro Mes** — contador de días juntos, timelínea y botón sorpresa con confeti.

## Archivos

| Archivo | Qué editar |
| --- | --- |
| `config.js` | Todo el contenido: fechas, frases de cada foto, carta, postales, timelínea |
| `photos/` | Tus fotos (`1.jpg`, `2.jpg`, ... — el nombre debe coincidir con `config.js`) |
| `index.html` / `styles.css` / `script.js` | No tocar salvo que quieras cambiar diseño o lógica |

## Paso 1 — Tus fotos

1. Borra los `1.jpg` … `10.jpg` de prueba de `photos/`.
2. Copia tus fotos ahí con **nombre `1.jpg`, `2.jpg`, `3.jpg`...** (así están referidas en `config.js`).
3. **Compresión recomendada** (por el peso en el celular de ella). En el iPhone con Heic ya optimizado puedes dejar la foto como está, pero si van pesadas:

   ```bash
   # con ImageMagick instalado (Linux/Mac). O usa squoosh.app desde el navegador.
   magick original.png -resize "900x900>" -quality 82 photos/1.jpg
   ```

   La galaxia muestra las fotos redondas (recorta a cuadrado: 700–900px es ideal).

## Paso 2 — Editar frases y mensajes

Todo está en `config.js`:

- `unlockDates`: las fechas de desbloqueo (por defecto 19/21/22 de septiembre de 2026).
- `galaxy.photos`: para cada foto `src` (ruta) y `caption` (frase que aparece debajo al tocarla).
- `letter.letterBody`: párrafos de tu carta.
- `letter.postcards`: las 6 postales (title · text · icon).
- `timeline.milestones`: hitos de la timelínea.

Para probar el diseño sin esperar las fechas, pone `forceUnlock: true`.

## Paso 3 — Probarla en tu teléfono

```bash
python3 -m http.server 8844
# abrí http://TU-IP-LOCAL:8844 desde el celular (misma red wifi)
```

## Paso 4 — Publicar (GitHub Pages)

```bash
# 1. login (una vez)
gh auth login

# 2. crear repo (cambia NOMBRE y VISIBILIDAD)
gh repo create NOMBRE --public --source . --push

# 3. activar GitHub Pages
gh api repos/:owner/:repo/pages -f source[branch]=main -f source[path]=/ -X POST
```

La URL queda `https://TU-USUARIO.github.io/NOMBRE/`.

> El desbloqueo usa la fecha del dispositivo de ella. Una vez que una sección se abre, queda abierta para siempre (guardado en `localStorage`), así que después del 22 entra libre a las tres.