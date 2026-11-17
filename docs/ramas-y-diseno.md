# Comparar el diseño entre ramas

`main` conserva la versión original. El rediseño y la limpieza están guardados en commits locales de `ricardohz`. No se hizo push ni merge.

## Guardar y comparar

Antes de cambiar de rama, revisa `git status`. Si tienes cambios nuevos, guárdalos con un commit en `ricardohz` o con `git stash push -u`. Los archivos nuevos también necesitan guardarse. Git puede llevar cambios sin commit de una rama a otra cuando no hay conflicto.

```sh
git switch main
npm run dev:frontend
```

Detén el servidor antes de cambiar otra vez y vuelve a iniciarlo para evitar módulos o estilos anteriores en memoria:

```sh
git switch ricardohz
npm run dev:frontend
```

Usa las mismas variables locales privadas para iniciar el backend, si lo necesitas. Este rediseño se verificó sin conectar a MongoDB. `.env` y las dependencias no pertenecen a una rama porque Git los ignora.

`git restore .` descarta cambios de archivos rastreados según el commit o índice de la rama actual. No crea una copia de seguridad y normalmente no se puede deshacer si nunca hiciste commit o stash.

## Cuando apruebes el diseño

Con los cambios de `ricardohz` guardados y el árbol de trabajo limpio:

```sh
git switch main
git merge ricardohz
npm run build
```

Revisa el resultado y después publica tú los cambios. Antes de publicar, sigue las advertencias sobre credenciales históricas y dependencias del README.

## Estilos

- `frontend/src/index.css`: carga Tailwind, fuentes, colores del tema y estilos base.
- `frontend/src/components/shop/ShopUI.jsx`: controles compartidos con Tailwind (botones, campos, modal, contenedores).
- `frontend/src/components/shop/ShopEditorial.jsx`: secciones visuales reutilizables.
- Las vistas y tarjetas definen su distribución, tipografía y adaptación móvil con utilidades Tailwind en su JSX.
- No existe una hoja global `shop.css`, ni selectores globales que sobrescriban las utilidades del administrador.
