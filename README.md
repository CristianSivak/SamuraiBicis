# Samurai Bicis – Panel administrador

Este proyecto usa **React (Vite)** con soporte para Tailwind, Firebase y un panel de administración para gestionar productos. Se añadieron dos nuevas entidades –_tipos de clientes_ y _tipos de producto_– además de la lógica de precios con descuento.

## Requisitos previos

- Node.js 20+
- Cuenta de Firebase con un proyecto configurado

## Instalación

```bash
npm install
npm run dev
```

## Variables de entorno Firebase

Crear un archivo `.env.local` basado en los valores del proyecto de Firebase:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_RECAPTCHA_SITE_KEY=
```

El resto de la configuración (`projectId`, `storageBucket`) está fija en `src/firebase.ts`; si trabajás con otro proyecto actualizalos ahí.

## Tests

Se agregaron pruebas unitarias para:

- Helper de precios con descuento.
- Validaciones del formulario de tipos de clientes.

Ejecutar:

```bash
npm test
```

## Reglas de seguridad de Firestore

El archivo `firestore.rules` incluye restricciones para los nuevos módulos:

- Solo administradores (`request.auth.token.role == 'admin'`) pueden escribir en `customerTypes`, `productTypes` y `products`.
- Lectura pública de `productTypes` activos y no borrados.
- Lectura pública de `customerTypes` activos (para exponer únicamente nombre, descuento y estado).

Para desplegar las reglas:

```bash
firebase deploy --only firestore:rules
```

## Semillas sugeridas

Podés crear colecciones de ejemplo ejecutando el siguiente script en un entorno con las credenciales de Firebase inicializadas (por ejemplo usando `node` + `firebase-admin`), o simplemente copiar los documentos manualmente desde la consola:

```js
// customerTypes
[
  { nombre: 'Minorista', descuentoPorcentaje: 0, activo: true },
  { nombre: 'Mayorista', descuentoPorcentaje: 15, activo: true },
  { nombre: 'Premium', descuentoPorcentaje: 25, activo: true },
].forEach(async (payload) => {
  await db.collection('customerTypes').add({
    ...payload,
    nombreLower: payload.nombre.toLowerCase(),
    isDeleted: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
})

// productTypes
['Accesorios', 'Indumentaria', 'Bicicletas'].forEach(async (nombre) => {
  await db.collection('productTypes').add({
    nombre,
    nombreLower: nombre.toLowerCase(),
    activo: true,
    isDeleted: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
})
```

## Funcionalidades principales

- CRUD completo de Tipos de clientes y Tipos de producto.
- Formularios con `react-hook-form` + validaciones `zod` (implementación local).
- Selección obligatoria del tipo de producto al crear/editar un producto.
- Cálculo dinámico de precios con descuento según el tipo de cliente asociado al usuario.
- Reglas de Firestore reforzadas para las nuevas colecciones.
