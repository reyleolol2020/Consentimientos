# Clara CRM

App web sencilla para gestionar clientes y consentimientos informados.

## Abrir

Abre `index.html` directamente en el navegador. No requiere Node.js, npm ni servidor local.

## Incluye

- Dashboard con métricas de clientes, citas y consentimientos pendientes.
- Sección visible de consentimientos para seleccionar una clienta y diligenciar el consentimiento del procedimiento, tratamiento de datos o uso de imágenes.
- Los consentimientos guardados registran aceptación, nombre de quien firma y fecha en el navegador.
- Código QR descargable que dirige al flujo público `#clienta`: servicio, cédula, búsqueda de ficha y creación de ficha clínica.
- Alta de nuevos clientes desde el botón `Nuevo cliente`.
- Búsqueda por nombre, correo o teléfono.
- Filtro por estado activo/inactivo.
- Eliminación de clientes.
- Persistencia local mediante `localStorage` del navegador.
- Diseño responsive para escritorio y móvil.

Los datos quedan guardados únicamente en el navegador y en el dispositivo donde se utiliza la app. En esta versión de demostración, la ficha diligenciada desde el celular no se sincroniza con el computador.

## Publicar el QR para usarlo desde otro celular

1. Sube estos archivos a un repositorio de GitHub.
2. Activa **Settings > Pages > Deploy from branch** y selecciona la rama principal.
3. Abre la URL pública de GitHub Pages en el computador y cópiala en el campo **URL pública de tu página**.
4. Presiona **Generar QR**, luego descarga el código y compártelo o imprímelo para que la clienta lo escanee.
5. Para que las fichas lleguen al panel desde distintos celulares se debe conectar una base de datos compartida (Firebase, Supabase o Google Sheets).
