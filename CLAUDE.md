# Sistema Prometeo — Landing Page

## 1. Descripción

Landing page de **Sistema Prometeo**, una metodología/consultoría de negocios ("Roba el
fuego. Lidera la rebelión."). Es un sitio de una sola página (`src/App.jsx`) con cuatro
secciones: `Hero` (con escena 3D) → `QueEsPrometeo` → `Metodologia` → `CTAFinal`.

**Stack:** Vite 8 + React 19 + Tailwind CSS v4 (`@tailwindcss/vite`, tema en
`src/index.css` vía `@theme`) + Motion (`motion/react`, ex Framer Motion) para las
animaciones 2D + React Three Fiber / drei / postprocessing + Three.js para el Hero 3D.
Lint con `oxlint` (`npm run lint`).

**Deploy:** [sistemaprometeo.netlify.app](https://sistemaprometeo.netlify.app), Netlify
auto-deploya cada push a `master` en
[github.com/selope01/sistema-prometeo-landing](https://github.com/selope01/sistema-prometeo-landing).
Config en `netlify.toml`: `npm run build` → publica `dist`, `NODE_VERSION = 22` (pineado
porque el build lo requiere).

## 2. Arquitectura del Hero 3D (`src/components/hero-scene/`)

`Hero.jsx` monta `<HeroScene>` con lazy-load (`React.lazy`) dentro de un
`CanvasErrorBoundary` + `Suspense`, con `SceneFallback` (gradiente 2D estático) como
fallback en ambos casos. La sección es un scroll-pin: `<section class="h-[300vh]">` con
un `<div class="sticky top-0 h-svh">` interno; `scrollYProgress` (via `useScroll`,
offset `['start start','end end']`) da un `progress` 0→1 que maneja toda la narrativa.

| Archivo | Rol |
|---|---|
| `HeroScene.jsx` | `<Canvas>` raíz: cámara, luces, `AmbientParticles`, `Composition` (ver abajo), `Bloom` condicional. |
| `Composition` (dentro de `HeroScene.jsx`) | Agrupa `PrometeoModel` + `BlackHole` y les aplica el encuadre (escala/posición) responsivo por frame — ver constantes clave abajo. |
| `PrometeoModel.jsx` | Carga el GLB (`GLTFLoader` manual, no `useGLTF`/Suspense — ver nota abajo), aplica rotación/escala base, hover del cursor y la narrativa de opacidad/emisivo por scroll. Si falla la carga, cae a `PrometeoEntity`. |
| `PrometeoEntity.jsx` | Figura primitiva de respaldo (cilindros/esferas) usada solo si el GLB no carga. Comparte las mismas cotas de altura que el GLB real. |
| `BlackHole.jsx` | El agujero negro/disco de acreción (shader propio) que "aparece" en la mano del scroll, con `OrbitalParticles` orbitando. |
| `OrbitalParticles.jsx` | Partículas (ascuas) orbitando dentro del radio del disco del `BlackHole`. |
| `AmbientParticles.jsx` | Campo de partículas ambiente que se desvanece a medida que la entidad aparece (estado 1→2 de la narrativa). |
| `usePointerTracking.js` | Hook compartido: un solo listener `pointermove` en `window` (solo si `hover:hover` + `pointer:fine`), expone `{x,y}` normalizado que todo el hover-3D consume. |
| `heroTextBounds.js` | **Nuevo.** Módulo con un valor mutable compartido (`heroTextBounds.rightEdgePx`), escrito por `Hero.jsx` (mide el borde derecho real del headline + fila de CTAs vía `ResizeObserver`) y leído cada frame por `Composition` para calcular cuánto desplazar el modelo a la derecha sin invadir el texto. Ver sección 4a. |
| `CanvasErrorBoundary.jsx` | Error boundary de clase; si el `<Canvas>` de R3F tira un error (contexto WebGL perdido, etc.) cae a `SceneFallback` en vez de romper la página. |
| `SceneFallback.jsx` | Gradiente radial estático 2D — se muestra mientras carga el chunk de `HeroScene`, si WebGL no está soportado, o permanentemente si `prefers-reduced-motion` está activo. |

### Modelo GLB

- `src/assets/models/prometeo-entity.glb` — **1.73 MB**, el que se importa y bundlea.
  Salida de `gltf-transform optimize` (quantize + texturas WebP) sobre el original.
- `src/assets/models/prometeo-entity.source.glb` — original sin comprimir, **12.13 MB**.
  No se importa en el código; queda como fuente para volver a exportar/regenerar.
- Malla estática sin rig (`gltf-transform inspect` confirmó: 1 mesh, 1 material, sin
  `JOINTS_0`/`WEIGHTS_0`, sin animaciones). Bbox: X `[-0.312, 0.312]`, Y `[-1, 1]`,
  Z `[-0.18, 0.18]`. Por no tener partes separadas, el hover de cursor y la narrativa de
  scroll animan la figura completa (no brazo/torso/cabeza por separado como sí hace el
  fallback `PrometeoEntity`).
- Orientación: **+Z confirmado como el frente** del modelo (verificado geométricamente:
  plano de la cara mirando +Z, espinilla protruyendo +Z vs. pantorrilla en -Z — ver
  comentario en `PrometeoModel.jsx` junto a `BASE_ROTATION_Y`). No cambiar sin volver a
  verificar con capturas reales, no solo el análisis geométrico.

### Constantes clave del encuadre (estado actual — ver tarea 4a)

En `HeroScene.jsx`:
- `SCALE_AT_WIDE = 2.35` / `SCALE_AT_NARROW = 2.0` — escala de la composición según
  ancho de viewport (`scaleForWidth()`, breakpoints 768–1440px). Deliberadamente
  **desacoplada** del ajuste horizontal (antes compartían una sola variable `scale` y
  eso hacía que achicar por ancho también aflojara el encuadre vertical).
- `WAIST_TARGET_Y = -1.05` — dónde cae la línea de cintura como fracción de la
  media-altura del frustum de cámara; resuelto junto con `SCALE_AT_WIDE` para que la
  cadera quede justo debajo del borde inferior y la cabeza tenga margen arriba.
- `computeFit()` — calcula `offsetX`/`offsetY` cada frame: `offsetX` usa el borde real
  del texto (`heroTextBounds.rightEdgePx`) en vez de un ancho de contenedor Tailwind
  supuesto; `offsetY` usa `WAIST_TARGET_Y` + `WAIST_ANCHOR_Y` (de `PrometeoModel.jsx`).
- `TEXT_SAFETY_GAP_PX = 40` — margen extra en px entre el borde del texto y el modelo.

En `PrometeoModel.jsx`:
- `CHEST_ANCHOR = [0.62, 1.35, 0.2]` — posición del `BlackHole` junto al
  hombro/pecho (antes estaba en la mano; se movió porque el encuadre de medio cuerpo
  deja la mano fuera de cuadro). **Confirmado que quedó bien posicionado — no tocar.**
- `WAIST_ANCHOR_Y`, `BODY_RIGHT_X` — puntos de referencia geométrica (altura de cadera,
  medio-ancho del cuerpo) que `HeroScene.jsx` usa para el encuadre responsivo.
- `BASE_ROTATION_Y = -0.12` — rotación frontal, no tocar sin re-verificar orientación.

## 3. Historial de fases y decisiones

Fases completadas (ver `git log`, un commit por fase aprox.):

- **Fase 0–1:** escena R3F base + composición provisional (entidad primitiva +
  agujero negro).
- **Fase 2:** interacción de cursor con inercia amortiguada (`THREE.MathUtils.damp`)
  sobre cabeza/torso/brazo.
- **Fase 3:** narrativa dirigida por scroll + sistema de partículas (ambiente +
  orbitales), 5 estados de 0→1 (oscuridad → aparición → disco de acreción → energía →
  atenuación por texto).
- **Fase 4 (fix):** el agujero negro se mantiene encendido en el clímax en vez de
  apagarse antes de tiempo.
- **Fase 5:** disco de acreción real con shader (gradiente radial) + Bloom
  (`@react-three/postprocessing`), condicional a `pointer: fine` (evita el costo extra
  de post-procesado en touch/dispositivos con GPU débil).
- **Fase 8:** integración del CTA de WhatsApp + transición hero-a-sección (gradiente de
  desvanecimiento en el borde inferior del Hero).
- **Fase 9:** pase de performance y accesibilidad — `prefers-reduced-motion` corta
  directo al fallback 2D **sin cargar el chunk de Three.js** (el check de WebGL/reduced
  motion pasa antes del `React.lazy`), reduce recuento de partículas en dispositivos sin
  puntero fino, pausa el render loop (`frameloop='never'`) cuando la pestaña no es
  visible.
- **Fase 10:** integración del modelo GLB real (`PrometeoModel.jsx`) reemplazando la
  entidad primitiva como modelo principal (con fallback a la primitiva si el GLB falla).

Decisiones importantes:
- **Paleta:** `--color-prometeo-red: #FF3131`, `--color-prometeo-navy: #1B2D7C`
  (definidas en `src/index.css` como tokens Tailwind v4), y `#FF741F` (naranja) como
  color de la energía/disco de acreción — usado en `BlackHole.jsx` y como
  `ENERGY_COLOR` en `PrometeoModel.jsx`, no está tokenizado en Tailwind.
- **WhatsApp CTA:** `https://wa.me/59169451074` con mensaje pre-cargado
  ("Hola, quiero mi diagnóstico Prometeo"), usado tanto en el CTA final (`href="#cta"`
  del Hero apunta a la sección `CTAFinal`, que es la que tiene el link real de wa.me)
  como referencia en el resto del copy.
- **`prefers-reduced-motion`:** cuando está activo, `Hero.jsx` renderiza `SceneFallback`
  directamente y ni siquiera dispara el `import()` lazy de `HeroScene` — ahorra
  completamente la descarga del chunk de Three.js para esos usuarios.
- **Bloom solo en `pointer: fine`:** el post-procesado (y el recuento alto de
  partículas) se activa solo si `window.matchMedia('(pointer: fine)').matches` —
  asume que dispositivos touch-only tienen GPUs más débiles y prioriza mantener el
  scroll fluido sobre el brillo del bloom.

## 4. Tareas pendientes (en orden)

### a. Corte de cintura real del encuadre — EN PROGRESO

Objetivo: cámara mucho más cerca, solo torso/cabeza visibles (piernas nunca en cuadro),
sin superposición con el texto/CTA en 1440/1024/768px. Ya se implementó:
- Escala de encuadre desacoplada del ajuste horizontal (`scaleForWidth` +
  `WAIST_TARGET_Y`, ver sección 2).
- `heroTextBounds.js` mide el texto real en vez de asumir anchos de Tailwind.
- Verificado con capturas reales (Playwright headless, instalado/desinstalado
  temporalmente para no dejarlo como dependencia) en 1440×900, 1024×800, 768×1000, en
  varios puntos de scroll — sin piernas visibles, sin overlap de texto/CTA.

Qué falta / qué revisar en la próxima sesión: confirmar visualmente en un viewport real
(no headless) que el encuadre se sostiene también en anchos intermedios y en mobile
real (no solo los tres anchos de referencia), y que el CTA de WhatsApp del Hero
(`href="#cta"`) sigue siendo clickeable sin que el modelo tape el botón durante el
scroll (el modelo tiene `pointer-events: none` en el `<Canvas>`, así que no debería
bloquear clics, pero vale confirmarlo).

### b. Reestructurar la narrativa de scroll (Hero debe arrancar sin texto)

Cambio de diseño pendiente: actualmente el texto (logo, "Sistema Prometeo", headline,
párrafo, CTAs) aparece con un stagger casi inmediato al cargar la página (animación
`container`/`item` en `Hero.jsx`, dispara en el mount vía `initial="hidden"
animate="show"`, **no está atado a `scrollYProgress`**). Hay que:
1. Ocultar el texto+CTA al inicio (el Hero debe arrancar mostrando *solo* la escena 3D
   formándose — estado 1/2 de la narrativa de `PrometeoModel`/`BlackHole`).
2. Atar la aparición del texto a `scrollYProgress` en vez de a un `animate="show"` fijo
   al montar — debe entrar recién cerca del final de la secuencia, cuando el agujero
   negro ya está encendido (`ENERGY_RISE_PEAK = 0.63` en `PrometeoModel.jsx`) y la
   escena empieza a atenuarse/retroceder (`RECEDE_START = 0.75` en `HeroScene.jsx`).
3. Revisar que el nuevo timing no choque con `LATE_FADE_START/END` (0.75–1.0, atenúa el
   modelo) ni con `RECEDE_START/END` (0.75–1.0, encoge y desplaza el modelo) — probable
   que el texto deba empezar a aparecer justo en ese rango para que la transición se
   sienta como una sola secuencia coreografiada, no dos animaciones independientes.

### c. Futuro: animación de "levantar la mano" (Mixamo)

Riggear el modelo automáticamente y gratis vía Mixamo, y traer una animación de
"levantar la mano" (o similar) vinculada al progreso de scroll — reemplazaría el
pulso emisivo estático que hoy simula "la energía viaja por el brazo"
(`ENERGY_RISE_START/PEAK/FALL_START/FALL_END` en `PrometeoModel.jsx`) por un
movimiento real del brazo. Requiere volver a exportar el GLB con skeleton/animation
clips y cambiar la carga de `PrometeoModel.jsx` a algo que soporte animaciones
(`AnimationMixer` de Three.js).

### d. Futuro: regenerar el modelo con mejor pose (Meshy 6)

Si se consigue acceso a Meshy 6, regenerar `prometeo-entity.source.glb` con una pose
mejor (probablemente pensada ya para el encuadre de medio cuerpo / la animación de
brazo de la tarea c, en vez de la pose neutral actual pensada originalmente para
cuerpo completo). Si se regenera, hay que re-derivar `BODY_RIGHT_X`, `CHEST_ANCHOR`,
`WAIST_ANCHOR_Y`, `BASE_ROTATION_Y` y el bbox documentado arriba — todos dependen de
la geometría exacta del mesh actual.
