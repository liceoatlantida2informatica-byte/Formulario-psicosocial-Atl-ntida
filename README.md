# Ficha Psicosocial 2027 — Liceo Atlántida 2

Formulario web para que las familias completen los módulos 1 a 5 de la ficha original. Incluye diseño adaptable, navegación por módulos, integrantes convivientes repetibles, trayectoria de 2024–2026, revisión previa y envío definitivo a Google Sheets mediante Apps Script.

## Archivos
- `index.html`: estructura del formulario.
- `estilos.css`: diseño adaptable a celular y PC.
- `formulario.js`: navegación, validaciones y envío.
- `google-apps-script.gs`: recepción, bloqueo de duplicados por C.I. y guardado en Sheets.
- `INSTRUCCIONES.md`: instalación y publicación.

## Importante
Esta primera versión es una base funcional para probar con datos ficticios y ajustar antes de publicar a las familias. La C.I. se utiliza como clave de duplicación. El control de duplicados está en el servidor y utiliza un bloqueo para evitar dos envíos simultáneos.

No se almacenan respuestas en GitHub. El repositorio público solo contiene el código estático. No agregue credenciales, datos reales ni enlaces privados de hojas al repositorio.
