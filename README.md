# StockClaro — Sistema de inventarios en la nube

Web con cuentas de usuario reales, base de datos en la nube (Supabase) y hospedaje gratuito (Vercel).

Roles:
- **Administrador**: todo, incluyendo cambiar el rol de otras personas. La primera persona que se registre queda como admin automáticamente.
- **Editor**: puede agregar productos, registrar entradas/salidas, editar precios.
- **Solo lectura**: solo puede ver el inventario.

---

## Parte 1 — Crear la base de datos (Supabase) — 10 min

1. Ve a **https://supabase.com** y crea una cuenta gratuita.
2. Clic en **"New project"**. Ponle un nombre (ej. `stockclaro`), crea una contraseña de base de datos (guárdala) y elige la región más cercana a ti.
3. Espera 1-2 minutos a que el proyecto termine de crearse.
4. En el menú izquierdo, ve a **SQL Editor** → **New query**.
5. Abre el archivo `supabase-schema.sql` de esta carpeta, copia **todo** su contenido, pégalo en el editor y presiona **Run** (o Ctrl+Enter).
   - Debe decir "Success. No rows returned".
6. Ve a **Project Settings** (ícono de engranaje) → **API**.
   - Copia el **Project URL** (algo como `https://xxxxx.supabase.co`).
   - Copia la clave **anon public** (una clave larga).
   Los vas a necesitar en la Parte 2.
7. (Recomendado para tu equipo pequeño) Ve a **Authentication** → **Providers** → **Email** y desactiva **"Confirm email"**, así tus 2-5 usuarios pueden entrar de inmediato sin confirmar correo. Si lo dejas activado, cada persona deberá confirmar su cuenta desde su bandeja de entrada antes de iniciar sesión.

---

## Parte 2 — Configurar el proyecto en tu computadora — 10 min

Necesitas tener instalado **Node.js** (descárgalo de https://nodejs.org si no lo tienes, versión LTS).

1. Abre una terminal dentro de esta carpeta (`inventario-web`).
2. Copia el archivo de ejemplo de variables de entorno:
   ```
   cp .env.example .env
   ```
3. Abre `.env` con cualquier editor de texto y reemplaza los valores con los que copiaste en el paso 6 de la Parte 1:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-larga-aqui
   ```
4. Instala las dependencias:
   ```
   npm install
   ```
5. Prueba que todo funcione en tu computadora:
   ```
   npm run dev
   ```
   Abre el enlace que aparece (normalmente `http://localhost:5173`). Deberías ver la pantalla de inicio de sesión. Crea tu cuenta — quedarás como administrador automáticamente.

Si esto funciona, ¡ya tienes tu sistema corriendo! El siguiente paso es publicarlo en internet con su propia dirección.

---

## Parte 3 — Publicarlo en internet (Vercel) — 10-15 min

1. Sube esta carpeta a un repositorio de **GitHub** (crea una cuenta gratis en github.com si no tienes, crea un repositorio nuevo y sube estos archivos — puedes arrastrar y soltar los archivos desde la página de GitHub si no usas comandos de git).
2. Ve a **https://vercel.com**, crea una cuenta gratuita (puedes entrar directo con tu cuenta de GitHub).
3. Clic en **"Add New Project"** y elige el repositorio que acabas de subir.
4. Antes de darle a "Deploy", busca la sección **"Environment Variables"** (a veces aparece colapsada/cerrada — haz clic sobre el título para que se abra). Vas a ver dos casillas de texto: una dice **"Key"** (o "Name") y otra **"Value"**. Llénalas así, una fila a la vez, dando clic en **"Add"** después de cada una:
   - Key: `VITE_SUPABASE_URL` → Value: tu URL de Supabase (ej. `https://xxxxx.supabase.co`)
   - Key: `VITE_SUPABASE_ANON_KEY` → Value: tu clave anon completa
5. Clic en **Deploy**. En 1-2 minutos tendrás tu propia dirección web (algo como `stockclaro.vercel.app`) que puedes compartir con tu equipo.

   **¿No encuentras "Environment Variables" o ya le diste Deploy sin agregarlas?** No hay problema, se agregan después:
   1. Entra a tu proyecto dentro de Vercel → pestaña **"Settings"**.
   2. En el menú de la izquierda, clic en **"Environment Variables"**.
   3. Agrega ahí las dos variables (Name y Value), una por una, y guarda con **"Save"**.
   4. Ve a la pestaña **"Deployments"**, clic en los tres puntos `⋯` del último deploy y elige **"Redeploy"** para que tome los cambios.

Cada vez que quieras actualizar el sistema, subes los cambios a GitHub y Vercel lo vuelve a publicar automáticamente.

---

## Cómo dar acceso a tu equipo

1. Cada persona entra a tu dirección web y crea su propia cuenta (correo + contraseña) desde "Crear cuenta".
2. Por defecto, cualquier cuenta nueva (después de la primera) entra como **"Solo lectura"**.
3. Tú, como administrador, vas a **Configuración → Usuarios** y le cambias el rol a **Editor** a quien necesite modificar el inventario.

## Notas importantes

- Los datos son compartidos entre todos: todos ven el mismo inventario, en tiempo real.
- El plan gratuito de Supabase alcanza cómodamente para 2-5 usuarios y unos cuantos miles de productos/movimientos.
- Guarda bien la contraseña de la base de datos que creaste en el paso 2 de la Parte 1 — la necesitarás si algún día administras la base de datos directamente.
- Si algo no funciona, revisa primero que las dos variables en `.env` (o en Vercel) estén copiadas exactamente, sin espacios extra.
