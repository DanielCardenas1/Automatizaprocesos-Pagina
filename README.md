# Daniel Cárdenas — Automatiza Procesos

Sitio web estático de portafolio y diagnóstico interactivo.

## Estructura

- `index.html` — página principal y experiencia de diagnóstico.
- `sistemas-internos.html` — página independiente de sistemas internos.
- `trabajo/` — páginas individuales de casos.
- `styles.css` — estilos compartidos de las páginas de casos.
- `assets/css/home.css` — estilos de la página principal.
- `assets/css/sistemas-internos.css` — estilos de sistemas internos.
- `assets/js/home.js` — lógica de la página principal/diagnóstico.
- `assets/js/sistemas-internos.js` — interacciones de sistemas internos.
- `assets/images/` — imágenes locales.
- `docs/` — documentación y fuentes de referencia del proyecto.
- `.claude/` — configuración de previsualización usada por Claude.

## Regla de mantenimiento

No volver a insertar CSS o JavaScript masivo dentro de los HTML. Los estilos y scripts de cada página deben permanecer en sus archivos externos correspondientes.

## Previsualización local

Desde la raíz del proyecto:

```bash
python -m http.server 8934
```

Luego abrir `http://localhost:8934`.
