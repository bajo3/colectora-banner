# Generador de Portada — Jesús Díaz Automotores · Colectora

Abrí `index.html`.

> Recomendado: usar "Live Server" (VS Code) o cualquier servidor estático, porque los módulos ES (`type=module`) no funcionan bien con doble click en algunos navegadores.

## Uso
1. Completá los datos del vehículo.
2. Subí una o más fotos.
3. Tocá **Generar**.
4. Reencuadrá cada preview:
   - Arrastrar = mover
   - Rueda = zoom
5. Tocá **Descargar ZIP** (imágenes) o **Descargar MP4** (en modo Video).

## Video (MP4)
- Elegí la plantilla **Video MP4 9:16**.
- Cada foto es un "slide".
- Ajustá **Duración por foto** y **FPS**.
- Tocá **Descargar MP4**.

Notas:
- El MP4 se genera en tu navegador (ffmpeg.wasm). Si ponés muchas fotos, puede consumir bastante RAM.
- Recomendación práctica: 5–20 fotos, duración 2–3s por foto.

## Datos fijos en portada
- Marca: **JESÚS DÍAZ AUTOMOTORES**
- Submarca: **COLECTORA**
- Dirección: **Colectora Macaya esq. Mejico**
- Teléfono: **2494 630646**

Sin precio.

---

## Export MP4: requisito SharedArrayBuffer (COOP/COEP)

Para que **ffmpeg.wasm** funcione, el navegador exige **cross-origin isolation**.  
Live Server normalmente **no** agrega estos headers, por eso aparece:

`ReferenceError: SharedArrayBuffer is not defined`

### Correr con el server incluido

1) Instalar dependencias:
```bash
npm install
```

2) Levantar server con headers correctos:
```bash
npm run dev
```

3) Abrir:
- http://localhost:5173

En la consola del navegador:
- `window.crossOriginIsolated` debe ser `true`
