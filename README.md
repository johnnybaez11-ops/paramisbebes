# Juega y aprende

Portal estático con juegos infantiles organizados por categoría. La página principal funciona en GitHub Pages y Netlify; cada juego vive en su propia carpeta dentro de `juegos/`.

## Agregar un juego

1. Crea una carpeta, por ejemplo `juegos/memoria/`.
2. Coloca allí su `index.html` y todos los recursos que necesite. Usa rutas relativas para CSS, JavaScript, imágenes y audio.
3. Abre `juegos.js` y agrega un objeto al arreglo `games`, con título, categoría, descripción, emoji, color y enlace `./juegos/memoria/`.
4. Comprueba que tienes derecho a publicar todos los recursos del juego y sube los cambios a la rama `main`.

Las categorías disponibles son `aprender`, `aventura` y `accion`. Si agregas una categoría nueva, añade también un filtro en `index.html`.
