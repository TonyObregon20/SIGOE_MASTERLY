# Masterly

Ecommerce y gestión interna con React/Vite y Express/Mongoose. Los paquetes frontend y backend se administran con workspaces de npm.

## Desarrollo local

1. Ejecuta `npm install` desde la raíz.
2. Copia `.env.example` a `.env` y completa `MONGODB_URI` y `JWT_SECRET` con valores privados. Si inicias desde el workspace del backend, configura también `backend/.env`.
3. Genera una clave JWT privada con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
4. Ejecuta `npm run dev` para la aplicación integrada, o `npm run dev:backend` y `npm run dev:frontend` en terminales separadas.

La conexión conserva la base `test`. No ejecutes el servidor si solo necesitas compilar sin acceso a MongoDB.

La recuperación inicial de administrador está desactivada por defecto. Si necesitas habilitarla temporalmente, configura ambas variables `BOOTSTRAP_ADMIN_*` con credenciales privadas y retíralas al terminar. La creación de usuarios exige una contraseña explícita.

## Correo de comprobantes

Para habilitar el envío, solicita al equipo la configuración por un canal privado y agrega `EMAIL_USER` y `EMAIL_PASSWORD` al `.env` que usa el backend. `EMAIL_FROM` es opcional. El servicio usa Gmail. Ejecuta `npm ci` desde la raíz para instalar Nodemailer y reinicia el backend después de configurar el correo.

## Antes de publicar

```sh
npm run build
npm run build --workspace=frontend
git diff --check
git status --short
git diff --cached --stat
```

Revisa los cambios antes de hacer commit. Los archivos `.env`, dependencias, compilaciones, certificados y carpetas de copias locales están ignorados. No uses `git add -f` para incluirlos. Conserva `package-lock.json`; este proyecto utiliza npm.

El control de secretos es una ayuda y no garantiza detectar toda información sensible. Examina también documentos, imágenes y datos de clientes antes de agregarlos.

**Historial anterior:** se detectaron credenciales de MongoDB y una clave JWT en commits previos. Quitarlas del código actual no las elimina del historial. Rota las credenciales expuestas en Atlas y la clave JWT del entorno desplegado antes de publicar. La clave JWT local fue renovada durante la limpieza; no se modificaron cuentas ni registros en MongoDB. Reescribir el historial requiere una operación separada y coordinada con los colaboradores.

La auditoría de dependencias durante esta limpieza reportó 11 alertas (2 moderadas, 6 altas y 3 críticas). No se actualizaron versiones: deben revisarse con `npm audit` y resolverse con pruebas de compatibilidad antes del despliegue.
