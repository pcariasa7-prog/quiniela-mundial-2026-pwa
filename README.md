# Quiniela Mundial 2026 — PWA lista para Vercel

Esta carpeta contiene una app React + Vite preparada como PWA. Se puede abrir desde el navegador del celular y agregar a la pantalla de inicio como si fuera una app.

La app tiene dos formas de guardado:

1. **Modo local:** funciona sin configurar nada, pero cada celular guarda sus propios datos. No se sincroniza con otra persona.
2. **Modo compartido con Firebase:** recomendado. Es gratuito para un uso pequeño y permite que dos o más personas vean las mismas quinielas y resultados.

Importante: úsela como juego privado de predicciones, sin datos sensibles y sin apuestas de dinero.

---

## 1. Qué archivos puedes tocar y cuáles no

### Puedes editar

`src/firebaseConfig.js`

Aquí pegas la configuración de Firebase y cambias `USE_FIREBASE` de `false` a `true`.

`src/App.jsx`

Solo debes editar estas zonas:

```jsx
const GROUPS = {
  A: ["Equipo A1", "Equipo A2", "Equipo A3", "Equipo A4"],
  ...
};
```

Ahí cambias los nombres de los equipos.

```jsx
const FLAGS = {};
```

Ahí puedes poner banderas, por ejemplo:

```jsx
const FLAGS = {
  "Costa Rica": "🇨🇷",
  "Brasil": "🇧🇷",
  "Argentina": "🇦🇷"
};
```

```jsx
const ADMIN_PIN = "1234";
```

Ahí cambias el PIN de administrador.

```jsx
const R32_SEEDS = [
  ["1A","2C"], ["1C","2A"], ...
];
```

Ahí cambias los cruces si hace falta. Este punto depende del formato oficial final que quieras usar.

### No toques, a menos que sepas programar

No edites estos archivos:

- `src/main.jsx`
- `src/sharedStorage.js`
- `src/index.css`
- `public/service-worker.js`
- `public/manifest.webmanifest`
- `package.json`
- `index.html`

---

## 2. Instalar lo necesario en la computadora

Necesitas tener instalado Node.js.

1. Entra a la página oficial de Node.js.
2. Descarga la versión LTS.
3. Instálala con las opciones normales.
4. Reinicia la computadora si Windows lo pide.

Para confirmar que quedó instalado:

1. Abre la terminal o PowerShell.
2. Escribe:

```bash
node -v
```

Debe salir algo como `v20...` o superior.

Luego escribe:

```bash
npm -v
```

Debe salir un número de versión.

---

## 3. Abrir el proyecto en la computadora

1. Descomprime la carpeta `quiniela-mundial-2026-pwa`.
2. Entra a esa carpeta.
3. Da clic derecho dentro de la carpeta.
4. Elige “Abrir en Terminal” o “Open in Terminal”.
5. Ejecuta:

```bash
npm install
```

Eso instala React, Vite y Firebase.

Luego ejecuta:

```bash
npm run dev
```

La terminal mostrará una dirección parecida a:

```bash
http://localhost:5173/
```

Abre esa dirección en el navegador. Ahí puedes probar la app antes de subirla.

---

## 4. Configurar Firebase para sincronizar datos

Esto es lo que hace que la app funcione en dos celulares con la misma información.

### 4.1 Crear proyecto

1. Entra a Firebase Console.
2. Crea un proyecto nuevo.
3. Ponle un nombre como `quiniela-mundial-2026`.
4. Puedes desactivar Google Analytics si no lo necesitas.

### 4.2 Crear una app web

1. Dentro del proyecto, busca el ícono de web `</>`.
2. Crea una app web.
3. Ponle un nombre como `Quiniela Mundial 2026`.
4. Firebase te mostrará una configuración parecida a esta:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 4.3 Pegar la configuración en la app

Abre este archivo:

```txt
src/firebaseConfig.js
```

Cambia esto:

```js
export const USE_FIREBASE = false;
```

por esto:

```js
export const USE_FIREBASE = true;
```

Luego reemplaza los textos `PEGA_AQUI...` por los datos reales de Firebase.

Ejemplo de estructura final:

```js
export const USE_FIREBASE = true;

export const FIREBASE_CONFIG = {
  apiKey: "tu-api-key-real",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

No copies este ejemplo literal. Usa los datos de tu propio Firebase.

### 4.4 Crear Firestore Database

1. En Firebase, entra a **Firestore Database**.
2. Crea una base de datos.
3. Elige modo de prueba o producción. Si eliges producción, luego pega las reglas de abajo.
4. Usa una región cercana o la predeterminada.

### 4.5 Reglas de Firestore

En Firestore, entra a **Rules** y pega esto:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /quiniela_mundial_2026/{docId} {
      allow read, write: if true;
    }
  }
}
```

Luego presiona **Publish**.

Estas reglas son simples y permiten que la app guarde datos sin login. Para una quiniela privada entre pocas personas está bien, pero no sirve para información sensible.

---

## 5. Probar que Firebase funciona

Después de configurar Firebase:

```bash
npm run dev
```

Prueba esto:

1. Entra con un nombre, por ejemplo `César`.
2. Llena algunos marcadores.
3. Abre la misma URL en otro navegador o ventana incógnita.
4. Entra con otro nombre.
5. Presiona “Sincronizar”.
6. Deben aparecer los datos compartidos.

Si no se sincroniza, revisa tres cosas:

1. Que `USE_FIREBASE` esté en `true`.
2. Que los datos de `firebaseConfig.js` estén bien pegados.
3. Que las reglas de Firestore estén publicadas.

---

## 6. Subir a GitHub

1. Crea una cuenta en GitHub si no tienes.
2. Crea un repositorio nuevo.
3. Sube todos los archivos de esta carpeta.

Puedes hacerlo desde GitHub Desktop si no quieres usar comandos.

No subas solo `src/App.jsx`. Debes subir toda la carpeta del proyecto.

---

## 7. Subir a Vercel

1. Crea una cuenta en Vercel.
2. Conecta tu cuenta de GitHub.
3. Elige el repositorio de la quiniela.
4. Vercel detectará Vite automáticamente.
5. Presiona Deploy.

La configuración debería quedar así automáticamente:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Cuando termine, Vercel te dará una URL pública.

---

## 8. Instalarla en el celular

### Android / Chrome

1. Abre la URL de Vercel.
2. Toca los tres puntos del navegador.
3. Elige “Agregar a pantalla principal” o “Instalar app”.
4. Abre la app desde el ícono.

### iPhone / Safari

1. Abre la URL de Vercel en Safari.
2. Toca el botón de compartir.
3. Elige “Agregar a pantalla de inicio”.
4. Abre la app desde el ícono.

---

## 9. Cómo usar la app

1. Cada persona entra con su nombre.
2. En “Mi quiniela”, llena sus predicciones.
3. En “Admin”, la persona encargada pone los resultados reales.
4. El marcador calcula puntos automáticamente.
5. El botón “Sincronizar” fuerza la actualización manual.
6. La app también intenta sincronizar cada 15 segundos.

PIN inicial de administrador:

```txt
1234
```

Cámbialo en `src/App.jsx`.

---

## 10. Advertencias importantes

La app todavía usa equipos de ejemplo. Debes reemplazarlos por los equipos reales.

El formato de cruces de ronda de 32 está puesto como base editable. Revísalo cuando tengas claro el formato que vas a usar.

El PIN de administrador no es seguridad real fuerte. Sirve para evitar que alguien toque resultados por accidente, no para proteger una app pública grande.

Las reglas de Firebase permiten escritura pública en esa colección. Para un uso pequeño y privado está bien. No compartas el link con personas que no deberían editar o ver la quiniela.

