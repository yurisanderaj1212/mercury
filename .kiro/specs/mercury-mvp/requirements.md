# Documento de Requisitos — Mercury MVP

## Introducción

Mercury es una plataforma SaaS de análisis inteligente del mercado cubano. Agrega publicaciones de fuentes digitales dispersas (Facebook, Revolico) y las transforma en datos organizados que permiten a compradores y negocios tomar mejores decisiones de compra. El MVP está enfocado en La Habana y valida la hipótesis central: **"Los usuarios pueden encontrar mejores oportunidades de compra utilizando Mercury"**.

El MVP cubre seis capacidades: registro e identidad de usuario, búsqueda de productos, visualización de publicaciones, comparación de precios, guardado de favoritos y creación de alertas de precios. Un rol administrador gestiona la integridad de los datos.

---

## Glosario

- **System**: La plataforma Mercury en su conjunto (frontend + API + base de datos).
- **Auth_Service**: Módulo de autenticación basado en Supabase Auth / JWT.
- **User**: Persona registrada en la plataforma con rol PERSONAL, BUSINESS o SELLER.
- **Admin**: Usuario con rol ADMIN que gestiona datos y usuarios de la plataforma.
- **Search_Engine**: Módulo que procesa consultas de búsqueda sobre publicaciones y productos.
- **Price_Analyzer**: Módulo que calcula estadísticas de precio a partir de publicaciones.
- **Publication**: Registro de una oferta de venta capturada de una fuente externa (Facebook, Revolico).
- **Product**: Entidad canónica que agrupa publicaciones de un mismo bien o servicio.
- **Category**: Clasificación jerárquica que organiza productos en grupos temáticos.
- **Seller**: Perfil de vendedor asociado a una o más publicaciones.
- **Alert**: Regla configurada por un usuario que dispara una notificación cuando se cumple una condición de precio.
- **Favorite**: Relación persistida entre un usuario y una publicación o producto de su interés.
- **Price_History**: Serie temporal de precios observados para un producto.
- **Source**: Fuente de datos externa (Facebook, Revolico) de la que se extraen publicaciones.
- **Location**: Referencia geográfica; en el MVP se limita a municipios de La Habana.
- **JWT**: JSON Web Token usado como credencial de sesión.
- **PBT**: Property-Based Testing — técnica de prueba que verifica propiedades generales sobre datos generados aleatoriamente.

---

## Requisitos

### Requisito 1: Registro de Usuario

**User Story:** Como visitante, quiero registrarme con correo y contraseña, para poder acceder a las funcionalidades de Mercury.

#### Criterios de Aceptación

1. WHEN un visitante envía un correo electrónico válido y una contraseña de mínimo 8 caracteres, THE Auth_Service SHALL crear una cuenta de usuario con rol PERSONAL y devolver un JWT de sesión con tiempo de expiración de 24 horas.
2. WHEN un visitante intenta registrarse con un correo que ya existe en el sistema, THE Auth_Service SHALL rechazar la solicitud y devolver el código de error `EMAIL_ALREADY_EXISTS`.
3. WHEN un visitante envía un correo con formato inválido, THE Auth_Service SHALL rechazar la solicitud y devolver el código de error `INVALID_EMAIL_FORMAT`.
4. WHEN un visitante envía una contraseña de menos de 8 caracteres, THE Auth_Service SHALL rechazar la solicitud y devolver el código de error `PASSWORD_TOO_SHORT`.
5. THE Auth_Service SHALL almacenar contraseñas usando un algoritmo de hashing bcrypt con factor de costo mínimo 10; las contraseñas en texto plano no deben persistirse en ningún almacenamiento.

---

### Requisito 2: Autenticación de Usuario

**User Story:** Como usuario registrado, quiero iniciar sesión con mis credenciales, para acceder a mi cuenta y funcionalidades protegidas.

#### Criterios de Aceptación

1. WHEN un usuario envía un correo y contraseña correctos, THE Auth_Service SHALL devolver un JWT válido con el identificador de usuario y su rol, con expiración de 24 horas.
2. WHEN un usuario envía credenciales incorrectas, THE Auth_Service SHALL rechazar la solicitud con el código de error `INVALID_CREDENTIALS` sin revelar cuál de los dos campos es incorrecto.
3. WHILE un JWT es válido y no ha expirado, THE System SHALL aceptar dicho JWT como credencial de autorización en todas las rutas protegidas.
4. WHEN un JWT ha expirado, THE System SHALL rechazar la solicitud con el código de error `TOKEN_EXPIRED`.
5. THE Auth_Service SHALL emitir tokens con firma HMAC-SHA256 usando una clave secreta de mínimo 256 bits; dicha clave no debe estar embebida en el código fuente.

---

### Requisito 3: Gestión de Perfil de Usuario

**User Story:** Como usuario registrado, quiero ver y actualizar mi información de perfil, para mantener mis datos actualizados.

#### Criterios de Aceptación

1. WHEN un usuario autenticado solicita su perfil, THE System SHALL devolver nombre, correo, rol, fecha de registro y municipio de La Habana asociado a la cuenta.
2. WHEN un usuario autenticado envía una actualización de perfil con nombre y/o municipio válidos, THE System SHALL persistir los cambios y devolver el perfil actualizado.
3. IF un usuario no autenticado intenta acceder o modificar cualquier perfil, THEN THE System SHALL rechazar la solicitud con el código de error `UNAUTHORIZED`.
4. THE System SHALL impedir que un usuario modifique el correo o el rol a través del endpoint de perfil; dichos campos solo son modificables por un Admin.

---

### Requisito 4: Gestión de Categorías y Productos

**User Story:** Como usuario, quiero explorar productos organizados por categorías, para encontrar rápidamente lo que busco.

#### Criterios de Aceptación

1. THE System SHALL mantener un catálogo de categorías jerárquicas con al menos un nivel de subcategoría; cada categoría tendrá nombre único y descripción.
2. WHEN un usuario solicita la lista de categorías raíz, THE System SHALL devolverlas ordenadas alfabéticamente en menos de 500 ms.
3. WHEN un usuario solicita los productos de una categoría, THE System SHALL devolver los productos activos de esa categoría con su nombre, imagen representativa, precio promedio y número de publicaciones asociadas.
4. WHEN un usuario solicita los productos de una categoría sin publicaciones activas, THE System SHALL devolver una lista vacía y el código HTTP 200.
5. THE System SHALL asociar cada producto a exactamente una categoría hoja del árbol de categorías; no se permite asociar un producto a una categoría que tenga subcategorías.

---

### Requisito 5: Gestión de Publicaciones

**User Story:** Como usuario, quiero ver publicaciones de productos con su información completa, para evaluar opciones de compra.

#### Criterios de Aceptación

1. THE System SHALL almacenar cada publicación con los campos: identificador único, título, descripción, precio, moneda (CUP/USD/MLC), imágenes, fecha de publicación, fuente (Facebook/Revolico), enlace original, vendedor, municipio de La Habana y estado (ACTIVE/INACTIVE/EXPIRED).
2. WHEN un usuario solicita el detalle de una publicación activa, THE System SHALL devolverla con todos sus campos en menos de 300 ms.
3. IF una publicación tiene estado INACTIVE o EXPIRED, THEN THE System SHALL excluirla de los resultados de búsqueda y listados públicos.
4. THE System SHALL mantener una marca de tiempo `updated_at` que se actualiza en cada modificación de una publicación; dicho valor nunca puede ser anterior a `created_at`.
5. WHEN el sistema detecta que una publicación tiene más de 30 días desde su fecha de publicación sin actualización, THE System SHALL cambiar su estado a EXPIRED automáticamente.

---

### Requisito 6: Motor de Búsqueda

**User Story:** Como usuario, quiero buscar productos por nombre o descripción, para encontrar lo que necesito de forma rápida.

#### Criterios de Aceptación

1. WHEN un usuario envía una consulta de búsqueda con al menos 2 caracteres, THE Search_Engine SHALL devolver publicaciones activas cuyo título o descripción contenga la consulta (búsqueda insensible a mayúsculas/minúsculas) en menos de 800 ms.
2. WHEN un usuario aplica un filtro de categoría a la búsqueda, THE Search_Engine SHALL devolver únicamente publicaciones activas que pertenezcan a dicha categoría.
3. WHEN un usuario aplica un filtro de rango de precio (precio_min, precio_max) con ambos valores positivos y precio_min ≤ precio_max, THE Search_Engine SHALL devolver únicamente publicaciones cuyo precio esté dentro del rango inclusivo.
4. WHEN un usuario aplica un filtro de municipio, THE Search_Engine SHALL devolver únicamente publicaciones activas de ese municipio.
5. WHEN la búsqueda no produce resultados, THE Search_Engine SHALL devolver una lista vacía y el código HTTP 200, sin errores.
6. THE Search_Engine SHALL devolver resultados paginados con tamaño de página configurable entre 10 y 50 elementos; la respuesta incluirá el total de resultados, la página actual y el número total de páginas.
7. WHEN un usuario envía una consulta de búsqueda con menos de 2 caracteres, THE Search_Engine SHALL rechazar la solicitud con el código de error `QUERY_TOO_SHORT`.

---

### Requisito 7: Comparación de Precios

**User Story:** Como usuario, quiero ver el precio promedio, mínimo y máximo de un producto, para identificar oportunidades de compra.

#### Criterios de Aceptación

1. WHEN un usuario solicita las estadísticas de precio de un producto, THE Price_Analyzer SHALL calcular y devolver: precio mínimo, precio máximo, precio promedio y número de publicaciones activas consideradas; todos los valores en la misma moneda solicitada.
2. THE Price_Analyzer SHALL excluir del cálculo de estadísticas las publicaciones con estado INACTIVE o EXPIRED.
3. WHEN un usuario solicita el historial de precios de un producto con un rango de fechas válido, THE Price_Analyzer SHALL devolver la serie temporal de precios promedio diarios dentro de ese rango.
4. IF un producto no tiene publicaciones activas, THEN THE Price_Analyzer SHALL devolver un objeto de estadísticas con todos los campos numéricos en `null` y el número de publicaciones en 0.
5. THE Price_Analyzer SHALL registrar en Price_History el precio de cada publicación en el momento en que es ingresada o actualizada; un registro de Price_History una vez creado no puede ser modificado ni eliminado.

---

### Requisito 8: Favoritos

**User Story:** Como usuario registrado, quiero guardar publicaciones como favoritas, para acceder a ellas rápidamente más adelante.

#### Criterios de Aceptación

1. WHEN un usuario autenticado marca una publicación como favorita, THE System SHALL crear la relación Favorite entre el usuario y la publicación, sin duplicados.
2. WHEN un usuario autenticado intenta marcar como favorita una publicación que ya está en sus favoritos, THE System SHALL ignorar la solicitud y devolver el código HTTP 200 sin error (idempotencia).
3. WHEN un usuario autenticado elimina una publicación de sus favoritos, THE System SHALL eliminar la relación Favorite y devolver el código HTTP 200.
4. WHEN un usuario autenticado solicita su lista de favoritos, THE System SHALL devolverla ordenada por fecha de adición descendente, con paginación de 20 elementos por página.
5. IF un usuario no autenticado intenta acceder o modificar favoritos, THEN THE System SHALL rechazar la solicitud con el código de error `UNAUTHORIZED`.

---

### Requisito 9: Sistema de Alertas

**User Story:** Como usuario registrado, quiero crear alertas de precio para un producto, para ser notificado cuando el precio baje de un umbral.

#### Criterios de Aceptación

1. WHEN un usuario autenticado crea una alerta con un producto y un precio umbral positivo, THE System SHALL persistir la alerta con estado ACTIVE y asociarla al usuario.
2. WHEN el Price_Analyzer detecta que el precio mínimo activo de un producto es menor o igual al precio umbral de una alerta ACTIVE, THE System SHALL marcar la alerta como TRIGGERED y registrar la fecha y precio que la activó.
3. THE System SHALL verificar las condiciones de todas las alertas ACTIVE una vez cada 60 minutos.
4. WHEN una alerta cambia a estado TRIGGERED, THE System SHALL crear una notificación en la bandeja del usuario con el nombre del producto, el precio umbral configurado y el precio mínimo actual encontrado.
5. WHEN un usuario autenticado elimina una alerta, THE System SHALL cambiar su estado a DELETED; los datos históricos de la alerta se conservan.
6. THE System SHALL limitar a 20 el número de alertas ACTIVE simultáneas por usuario con plan PERSONAL; un usuario que intente crear una alerta adicional recibirá el código de error `ALERT_LIMIT_REACHED`.

---

### Requisito 10: Panel Administrativo

**User Story:** Como administrador, quiero gestionar usuarios, publicaciones y categorías desde un panel centralizado, para mantener la integridad de la plataforma.

#### Criterios de Aceptación

1. WHILE un usuario tiene rol ADMIN, THE System SHALL conceder acceso a los endpoints de administración en `/api/v1/admin/`.
2. WHEN un Admin solicita la lista de usuarios, THE System SHALL devolver usuarios paginados con nombre, correo, rol, fecha de registro y estado de cuenta (ACTIVE/SUSPENDED).
3. WHEN un Admin cambia el estado de una cuenta de usuario a SUSPENDED, THE System SHALL invalidar todos los JWT activos de ese usuario y rechazar futuros intentos de autenticación con el código de error `ACCOUNT_SUSPENDED`.
4. WHEN un Admin modifica los metadatos de una publicación (título, descripción, estado), THE System SHALL persistir los cambios, registrar en Logs el identificador del Admin, la acción realizada y la marca de tiempo.
5. WHEN un Admin crea o modifica una categoría, THE System SHALL validar que el nombre sea único entre categorías del mismo nivel jerárquico; si existe duplicado, devolver el código de error `CATEGORY_NAME_DUPLICATE`.
6. IF un usuario sin rol ADMIN intenta acceder a cualquier endpoint de `/api/v1/admin/`, THEN THE System SHALL rechazar la solicitud con el código de error `FORBIDDEN`.

---

### Requisito 11: Integridad y Consistencia del Modelo de Datos

**User Story:** Como desarrollador, quiero que el modelo de datos sea consistente e íntegro, para evitar estados inválidos que afecten la experiencia del usuario.

#### Criterios de Aceptación

1. THE System SHALL garantizar que cada publicación esté asociada a exactamente un Seller y a exactamente una Source; no se permiten publicaciones huérfanas.
2. THE System SHALL garantizar que `price_history.recorded_at` sea siempre mayor o igual a `publications.created_at` de la publicación asociada.
3. THE System SHALL garantizar que eliminar un Product no elimine en cascada sus publicaciones; en su lugar, las publicaciones quedarán en estado INACTIVE.
4. THE System SHALL garantizar que el campo `price` de una publicación sea un número decimal positivo con precisión de hasta 2 decimales; valores negativos o nulos no deben persistirse.
5. FOR ALL operaciones de escritura sobre entidades críticas (Users, Publications, Products, Alerts), THE System SHALL ejecutarlas dentro de transacciones de base de datos que garanticen atomicidad.

---

### Requisito 12: API REST Versionada

**User Story:** Como desarrollador del frontend, quiero una API REST versionada y consistente, para poder integrar el frontend con el backend de forma predecible.

#### Criterios de Aceptación

1. THE System SHALL exponer todos los endpoints bajo el prefijo `/api/v1/`.
2. THE System SHALL devolver respuestas en formato JSON con estructura uniforme: `{ data, error, meta }` donde `error` es `null` en respuestas exitosas y `data` es `null` en respuestas de error.
3. WHEN el System recibe una solicitud a un endpoint inexistente, THE System SHALL devolver el código HTTP 404 con el código de error `ENDPOINT_NOT_FOUND` en el campo `error`.
4. THE System SHALL incluir en cada respuesta el encabezado `Content-Type: application/json; charset=utf-8`.
5. THE System SHALL validar que todos los parámetros de entrada cumplan el esquema definido; IF un parámetro obligatorio está ausente o tiene tipo incorrecto, THEN THE System SHALL devolver el código HTTP 400 con el código de error `VALIDATION_ERROR` y la lista de campos inválidos.

---

## Propiedades de Corrección para Property-Based Testing

Las siguientes propiedades están diseñadas para validarse mediante PBT (por ejemplo, con `fast-check` en TypeScript).

### P1 — Idempotencia de Favoritos (Requisito 8.2)
Para todo usuario `u` y publicación `p` activa, ejecutar `addFavorite(u, p)` una o múltiples veces debe producir exactamente una entrada en `favorites` para el par `(u, p)`. Formalmente: `count(favorites where user=u and publication=p) == 1` independientemente del número de llamadas.

### P2 — Invariante de Precios en Price_History (Requisitos 5.4 y 7.5)
Para todo registro en `price_history`, su campo `recorded_at` debe ser mayor o igual al campo `created_at` de la publicación asociada. Esta propiedad debe mantenerse para cualquier secuencia de inserciones de publicaciones con timestamps aleatorios válidos.

### P3 — Consistencia de Estadísticas de Precio (Requisito 7.1)
Para cualquier conjunto no vacío de publicaciones activas de un producto, `price_min ≤ price_avg ≤ price_max`. Además, `price_min` debe corresponder al precio mínimo real del conjunto y `price_max` al máximo real.

### P4 — Completitud y Cobertura de la Búsqueda (Requisito 6.1)
Para cualquier publicación activa `p` con título que contenga la cadena `q` (longitud ≥ 2), la búsqueda por `q` debe incluir `p` en alguna página de resultados. No se permiten falsos negativos en búsquedas por substring exacto.

### P5 — Paginación sin pérdida ni duplicados (Requisito 6.6)
Para cualquier búsqueda que retorne N resultados con tamaño de página P, al recorrer todas las páginas (de 1 a ceil(N/P)), la unión de todos los resultados debe contener exactamente los mismos N elementos sin duplicados y sin omisiones.

### P6 — Tokens JWT no reutilizables tras expiración (Requisito 2.4)
Para cualquier JWT válido emitido con tiempo de expiración `exp`, al intentar usarlo en una solicitud en un instante `t > exp`, el sistema siempre debe rechazarlo con `TOKEN_EXPIRED`, independientemente del contenido del token.

### P7 — Integridad del árbol de categorías (Requisito 4.5)
Para cualquier secuencia válida de operaciones de creación de categorías y asociación de productos, ningún producto puede quedar asociado a una categoría que tenga categorías hijas. La propiedad debe mantenerse tras cualquier operación de reestructuración del árbol.
