---
trigger: "glob:src/**/*.{vue,ts}"
description: "Estándares y restricciones obligatorias para el desarrollo en Vue 3 Spike Admin UI"
---

# Reglas de Frontend Vue 3 - Deskounta ERP

1. Todo CRUD debe usar la clase `.crud-page` y estructurarse según `STYLE_GUIDE.md`.
2. Ocultar los KPIs, filtros y tabla cuando el formulario de creación/edición esté activo (`v-show="!isFormOpen"`).
3. Todo formulario de creación o edición de entidades debe usar `.form-page` / `.form-page-card` con el botón "Volver al Listado" en la cabecera. Nunca usar modales emergentes oscuros con backdrop para entidades.
4. Las tablas deben tener Sticky Header (`top: 0; z-index: 15;`) y contenedor con `min-height: 400px; padding-bottom: 6rem;`.
5. Los dropdowns de la tabla deben usar obligatoriamente `data-bs-popper-config='{"strategy":"fixed"}'`.
6. Usar exclusivamente `<AppSelect2>` para selectores relacionales con búsqueda.
7. Usar exclusivamente `toast` de `@/utils/toastr` para alertas y mensajes de éxito/error.
8. Mantener compatibilidad total con Modo Oscuro y Modo Claro.
9. Verificar que `npm run type-check` compile con 0 errores de TypeScript.
