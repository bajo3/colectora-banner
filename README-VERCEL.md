# Deploy en Vercel (modo estático)

Este proyecto se deployea como sitio estático. `vercel.json` fuerza a Vercel a:
- Servir `/index.html` para cualquier ruta
- Aplicar headers COOP/COEP/CORP (SharedArrayBuffer)
- Permitir Google Fonts (CSP)

En Vercel:
- Framework Preset: **Other**
- Build Command: **(vacío)**
- Output Directory: **.**
