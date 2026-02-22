Convención de imágenes (Andanada del 5)

Ubicación
- Carpeta: /media/posts/
- Formato recomendado: JPG (calidad 80–85). Opcional WEBP si lo prefieres (mantén la misma convención de nombre).

Nombres de archivos
- Base: <slug>.jpg
- Variantes (srcset): <slug>@480.jpg, <slug>@720.jpg, <slug>@1200.jpg, <slug>@1600.jpg
- Social (OG/Twitter): <slug>-og.jpg
 - Si usas WEBP paralelo: <slug>.webp, <slug>@480.webp, <slug>@720.webp, <slug>@1200.webp, <slug>@1600.webp, <slug>-og.webp

Dimensiones recomendadas
- Cards: mínimo 800×480 (ratio 5:3). Variantes: 480, 720, 1200
- Artículo (imagen principal): 1520×855 (ratio 16:9). Variantes: 480, 720, 1200 (+1600 si hay hero grande)
- Hero/portada grande: 1600×960 (ratio 5:3)
- Social (OG/Twitter): 1200×630, composición centrada y texto legible

Campos en contenido (JSON)
- image: URL absoluta a la base (ej. https://andanadadel5.com/media/posts/<slug>.jpg)
- imageVariants: [480, 720, 1200] (+1600 si aplica)
- socialImage: URL absoluta al archivo -og
- imageAlt: texto alternativo descriptivo
- imageCaption: pie de foto (opcional)

Comportamiento del sitio
- srcset se construye automáticamente con las variantes declaradas en imageVariants usando la convención @ancho.
- sizes ya está definido para escoger la resolución óptima en cards y artículos.
- Si falta alguna variante, se usa la imagen base sin errores.
- OG/Twitter usan socialImage si existe, con fallback a image.
 - WEBP: si marcas webpEnabled (se activa al usar --webp en el script), el frontend sirve <picture> con <source type="image/webp"> y fallback JPG. Mantén las mismas variantes en .webp.

Buenas prácticas
- Recorta a los ratios indicados para evitar banding o barras.
- Optimiza con compresión moderada (JPG 80–85). Evita artefactos visibles.
- Centra el contenido importante para redes en 1200×630 y evita texto demasiado al borde.
- Evita subir imágenes excesivamente grandes; usa las variantes propuestas.
 - Para WEBP, usa compresión visualmente equivalente y revisa que no aparezcan artefactos en textos finos.

Ejemplo
- slug: cronica-san-isidro-apertura-feria
- Archivos:
  - cronica-san-isidro-apertura-feria.jpg
  - cronica-san-isidro-apertura-feria@480.jpg
  - cronica-san-isidro-apertura-feria@720.jpg
  - cronica-san-isidro-apertura-feria@1200.jpg
  - cronica-san-isidro-apertura-feria@1600.jpg
  - cronica-san-isidro-apertura-feria-og.jpg
 - WEBP paralelo:
   - cronica-san-isidro-apertura-feria.webp
   - cronica-san-isidro-apertura-feria@480.webp
   - cronica-san-isidro-apertura-feria@720.webp
   - cronica-san-isidro-apertura-feria@1200.webp
   - cronica-san-isidro-apertura-feria@1600.webp
   - cronica-san-isidro-apertura-feria-og.webp
