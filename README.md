# 🚀 FinanPro - Plataforma Inteligente de Gestión Financiera

**FinanPro** es una aplicación web interactiva y accesible para la gestión de finanzas personales, seguimiento de ingresos/gastos, control de presupuestos, metas de ahorro y simuladores financieros.

---

## 🗄️ Configuración de la Base de Datos (Supabase - PostgreSQL)

Tu proyecto está configurado para integrarse directamente con **Supabase**, una base de datos PostgreSQL gratuita en la nube.

### Paso 1: Crear una cuenta y proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Haz clic en **"New Project"** (Nuevo Proyecto).
3. Ingresa un nombre para tu proyecto (ej. `finanpro-db`) y una contraseña segura para la base de datos.
4. Selecciona la región más cercana y haz clic en **"Create new project"**.

### Paso 2: Crear las Tablas (Ejecutar `schema.sql`)
1. En el panel izquierdo de Supabase, ve a la sección **SQL Editor** (icono con la etiqueta `SQL`).
2. Haz clic en **"New query"**.
3. Abre el archivo `schema.sql` de este proyecto, copia todo su contenido y pégalo en el editor de Supabase.
4. Haz clic en **"Run"** (o presiona `Ctrl + Enter`).
5. ¡Listo! Esto creará automáticamente las tablas `transactions`, `goals` y `budgets` con sus políticas de acceso.

### Paso 3: Conectar las llaves API a tu código
1. En el panel izquierdo de Supabase, ve a **Project Settings** ⚙️ -> **API**.
2. Copia los siguientes dos valores:
   - **Project URL** (ejemplo: `https://xyzcompany.supabase.co`)
   - **anon / public key** (una clave larga que empieza por `eyJhbG...`)
3. Abre el archivo `js/supabaseConfig.js` en tu editor y reemplaza los valores:
   ```javascript
   const SUPABASE_URL = 'https://tu-proyecto.supabase.co'; 
   const SUPABASE_ANON_KEY = 'tu-clave-anonima-publica';
   ```

*Nota: Si no configuras las llaves de Supabase, la aplicación funcionará de forma automática usando el almacenamiento local de tu navegador (`localStorage`).*

---

## 📤 Subir a GitHub y Publicar Online Gratis (GitHub Pages)

### 1. Comandos de Git (Terminal)
En la carpeta del proyecto, ejecuta:
```bash
git init
git add .
git commit -m "Integración de Supabase y estructura lista"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/gestion-financiera.git
git push -u origin main
```

### 2. Publicar la página web gratis
1. Ve a tu repositorio en GitHub.
2. Ve a **Settings** -> **Pages**.
3. En **Source**, selecciona `main` y la carpeta `/ (root)`.
4. Guarda los cambios. Tu sitio web estará disponible en:
   `https://tu-usuario.github.io/gestion-financiera/`
