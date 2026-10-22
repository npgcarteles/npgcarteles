# Corrección del simulador y envío de pedidos

## Qué cambia para el cliente
- La foto que sube queda exactamente igual: sin reencuadre, sin fachada reconstruida.
- El logo se coloca en la franja superior de la fachada (sobre el acceso), no en el centro ni abajo.
- El tamaño aparente depende de la medida elegida (2, 3, 4 o 5 m), estimado a partir de la puerta detectada en la foto (unos 2,1 m de alto).
- El cartel se ve más real: volumen de letras, halo de luz blanca o cálida y sombra sutil, solo dentro de la zona del cartel.
- Si la foto no permite ubicar bien el cartel, se avisa y se usa una ubicación ilustrativa prudente, con la advertencia legal de siempre.
- Se quitan por completo los botones de WhatsApp e Instagram del pedido. El cliente revisa, confirma y envía mediante el sistema de pedidos actual, y ve el estado "Pendiente de presupuesto".
- Se mantienen sin dibujo ni controles de escala manuales.

## Cómo funciona la simulación
1. Análisis de la foto con IA (solo lectura): devuelve la zona de instalación (franja sobre la puerta/vidriera), las esquinas de esa franja y la altura de la puerta en la imagen. Las respuestas se validan (dentro de la imagen, en la mitad superior, forma coherente); si fallan se usa la ubicación prudente por defecto.
2. Escala: metros por píxel = altura de puerta / 2,1 m; el ancho del cartel se calcula con esa escala y se limita al ancho de la franja (si no cabe, se avisa en vez de achicarlo en silencio).
3. Composición geométrica actual (homografía) del logo original, sin deformarlo, sobre la foto original.
4. Realismo localizado: efectos de volumen, halo y sombra dibujados solo dentro de una máscara alrededor del cartel. No se usa IA generativa para redibujar la fachada ni el logo.
5. Validación antes de mostrar: se comparan los píxeles fuera de la máscara con la foto original (deben ser idénticos), se controla que el cartel esté en la zona y que el tamaño corresponda a la medida. Si algo falla, se muestra el error y se permite reintentar sin perder foto, logo ni opciones.

## Pedido
- Quitar el componente de envío por WhatsApp/Instagram del detalle del pedido y sus funciones y pruebas asociadas.
- Agregar en la página del pedido nuevo un resumen de confirmación (medidas, iluminación, simulación) antes de enviar; el envío usa la función de creación existente (sin duplicados) y luego muestra confirmación clara. Los errores no borran los datos cargados.
- El WhatsApp de contacto general del sitio se mantiene (solo se elimina del envío del pedido).

## Detalles técnicos
- Nueva función de servidor `analyzeFacade` (Lovable AI, modelo por defecto, salida JSON estricta con esquema) que recibe una versión reducida de la foto y devuelve coordenadas normalizadas; nunca precios.
- `montage-geometry.ts`: función pura `placementFromAnalysis(analysis, widthM, heightM)` con pruebas (2/3/4/5 m, cartel que no cabe, análisis inválido → ubicación por defecto en la franja superior).
- `montage-compositor.ts`: capa de efectos limitada a máscara + `verifyUntouched(original, result, mask)`.
- Eliminar `order-sharing.tsx`, `order-sharing.ts` y su test; actualizar memoria (envío de pedidos) y AGENTS.md.
- Verificación: pruebas unitarias, build y prueba en navegador con una foto de fachada en 2 m y 5 m.
