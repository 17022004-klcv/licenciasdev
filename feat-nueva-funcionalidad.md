# Cambios de la rama `feat/nueva-funcionalidad`

Resumen de todo lo que se hizo en esta rama, explicado de forma sencilla.

## Resumen rápido

| # | Cambio | En pocas palabras |
|---|---|---|
| 1 | Claves alfanuméricas | Las claves ahora son tipo `TPX67-HNUYW-FCR5T-54WRY` en vez de solo números. |
| 2 | Tipos por duración | Las licencias ahora son de **6 meses**, **1 año** o **Indefinida**. Ya no se escriben fechas a mano: la fecha de vencimiento se calcula sola al vender. |
| 3 | Stock con claves individuales | Cada unidad en stock es una clave distinta. Cada cliente recibe su propia clave. |
| 4 | Compra desde la página pública | Los clientes pueden comprar desde la landing con su nombre de usuario y correo, y la venta aparece en el historial. |

---

## 0. Antes de empezar: actualización de la rama

- La rama anterior (`feat/auth-pos-ventas`) estaba atrasada respecto a `master` y `develop`. Se actualizó `master` y se creó esta rama nueva desde ahí.
- Al actualizar, git borró el archivo de la base de datos local (`licencias.db`), porque las versiones nuevas del proyecto ya no lo guardan en el repositorio. **Los datos se recuperaron completos** (2 empleados y 5 licencias).
- Desde ahora `licencias.db` está en `.gitignore`, así que no se vuelve a subir ni a borrar con git.

---

## 1. Claves alfanuméricas

**Antes:** `0430-4100-0089-7655` (solo números).
**Ahora:** `6AG35-MAUG8-M6YKR-D2J4J` (letras y números, 4 grupos de 5).

- No se usan caracteres que se confunden al leerlos o dictarlos: `0` y `O`, `1`, `I` y `L`.
- Las claves que ya existían siguen funcionando igual.

Archivo principal: `lib/license-key.ts`.

---

## 2. Tipos de licencia por duración

**Antes:** Permanente / Suscripción / Temporal, más una fecha de compra y una fecha de expiración escritas a mano.
**Ahora:** solo se elige la duración:

| Tipo | Significado |
|---|---|
| 6 meses | La clave vence 6 meses después de venderse. |
| 1 año | La clave vence 1 año después de venderse. |
| Indefinida | La clave nunca vence. |

**¿Por qué?** Si una licencia de 6 meses tenía una fecha de inicio fija, quien la compraba en el mes 5 solo recibía 1 mes. Ahora la vigencia empieza **el día de la venta**, para cada cliente.

**¿Qué pasó con las licencias que ya existían?** Se convirtieron automáticamente según sus fechas:

- Sin fecha de vencimiento → **Indefinida**
- Duraban hasta 6 meses → **6 meses**
- Duraban más de 6 meses → **1 año**

En el formulario de licencias ya no aparecen las fechas.

---

## 3. Stock con claves individuales

**Antes:** cada licencia tenía **una sola clave**. Si se vendían 10 unidades, los 10 clientes recibían la misma clave.
**Ahora:** cada unidad del stock es una clave distinta.

- **Stock** = cuántas claves quedan sin vender. Se calcula solo, no hay que escribirlo.
- Al vender, cada unidad se lleva **su propia clave** y su fecha de vencimiento.
- No se puede vender más de lo que hay. Si se agota, aparece «Agotado».
- Dos ventas al mismo tiempo nunca reciben la misma clave.
- Si se borra una licencia, las claves ya vendidas **se conservan** en el historial.
- La clave única que tenía cada licencia antes pasó a ser su primera unidad.

### Cómo se usa (administrador)

- **Crear licencia:** el formulario tiene el campo **«Unidades iniciales»**, que genera esa cantidad de claves.
- **Agregar más stock:** en el catálogo, botón **ver detalles (ojo)** → **«Agregar unidades»**.
- **Ver las claves:** en el mismo detalle aparece la lista de claves, ocultas por defecto, con su estado (disponible o vendida), la venta en la que salieron y su vencimiento.

### Qué cambió en cada pantalla

- **Catálogo:** nueva columna **Stock**.
- **POS:** cada licencia muestra su stock; no se puede agregar al carrito más de lo disponible y, al cobrar, se muestran las claves para entregarlas al cliente.
- **Historial de ventas:** el detalle de cada venta muestra las claves vendidas y cuándo vencen.

---

## 4. Compra desde la página pública (landing)

**Antes:** el botón «Simular compra» no guardaba nada.
**Ahora:** la compra es real dentro del sistema (el **pago sigue siendo simulado**, no se cobra nada).

1. El cliente elige una licencia y pulsa **«Comprar licencia»**.
2. Escribe su **nombre de usuario** y su **correo**.
3. Al confirmar, recibe **su clave** en pantalla, con un botón para copiarla y la fecha hasta la que es válida.
4. La venta queda en el **Historial de ventas** como **«Tienda web»**, con el nombre y el correo del cliente.

Detalles:

- Se compra **una unidad** por pedido.
- El nombre de usuario debe tener entre 3 y 30 caracteres (letras, números, punto, guion o guion bajo).
- Las licencias sin stock aparecen como **«Agotado»** y no se pueden comprar.
- Se quitaron los campos de tarjeta para que nadie escriba datos reales.
- Para evitar abusos, cada conexión (IP) puede hacer como máximo **5 compras cada 10 minutos**.
- La página pública **nunca** muestra claves, solo la del propio cliente después de comprar.
- Las ventas web solo las ve el administrador. Cada empleado sigue viendo solo sus propias ventas.

---

## Cambios en la base de datos

La base de datos **se actualiza sola** al arrancar el servidor, tanto en local como en Render. No hay que hacer nada a mano.

Para esto se creó un sistema de **migraciones** (`lib/migrations.ts`): cada cambio de estructura es un paso numerado que se aplica una sola vez.

| Versión | Qué hace |
|---|---|
| v1 | Cambia los tipos a duraciones y quita las fechas de compra y expiración. |
| v2 | Crea la tabla `license_keys` (una fila por clave) y pasa ahí las claves existentes. |
| v3 | Agrega a las ventas el canal (POS o web) y los datos del cliente. |

Regla para el equipo: **una migración ya publicada no se modifica**. Si hay que cambiar algo más, se agrega una migración nueva al final de la lista.

La documentación de las tablas está en `database.md`.

---

## Archivos nuevos y modificados

**Nuevos**

- `lib/license-key.ts`: genera las claves y calcula el vencimiento.
- `lib/migrations.ts`: actualiza la base de datos automáticamente.
- `lib/rate-limit.ts`: límite de compras por IP.
- `src/app/api/licenses/[id]/keys/route.ts`: ver y agregar claves (solo administradores).
- `src/app/api/public/purchase/route.ts`: compra desde la landing.

**Modificados**

- `lib/db.ts`: usa las migraciones y agrega un ayudante para transacciones.
- `src/service/license.service.ts`, `src/service/sale.service.ts`: lógica de stock, claves y ventas web.
- `src/type/license.type.ts`, `src/type/sale.type.ts`: tipos nuevos.
- `src/app/page.tsx`, `src/app/globals.css`: landing y compra.
- `src/app/admin/catalogo/page.tsx`, `src/app/admin/pos/page.tsx`, `src/app/admin/ventas/page.tsx`: pantallas del panel.
- `prisma/seed.ts`: datos de prueba con 3 unidades por licencia activa.
- `database.md`: documentación actualizada.

---

## Cómo se probó

- Pruebas de la API: crear licencias con stock, agregar unidades, ventas con y sin stock suficiente, compras web con datos válidos e inválidos, límite de compras y borrado de licencias con ventas.
- Pruebas en navegador de la landing, el catálogo, el POS y el historial, sin errores en la consola.
- La compilación de producción (`next build`) termina sin errores.
- Las migraciones se probaron sobre una copia de la base real y sobre una base vacía.

---

## Pendientes y cosas a tener en cuenta

- **El pago es simulado.** No hay pasarela de pago.
- **El límite de compras se guarda en memoria:** se reinicia si se reinicia el servidor.
- **Render:** `DATABASE_PATH` debe apuntar a un disco persistente; si no, los datos se pierden en cada despliegue.
- **Usuarios de prueba:** el sistema crea un administrador y un empleado con contraseñas conocidas cuando la base está vacía (ver `lib/db.ts`). Conviene cambiarlas en la versión publicada.
- **Error de lint anterior:** la página de login tiene un error de lint (`setState` dentro de `useEffect`) que ya existía antes de esta rama.
- **Recargas infinitas en desarrollo:** si la página se recarga sola sin parar, cierra todas las pestañas de `localhost:3000` y abre una nueva (o `Ctrl+Shift+R`). Este problema ya ocurría antes de esta rama.
