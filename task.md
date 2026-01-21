#9 Implementar filtros de búsqueda avanzados
Avatar de repositorio
rinafcode/teachLink_web
Descripción general
Mejore la funcionalidad de búsqueda con opciones de filtrado avanzadas para los cursos, incluido el nivel de dificultad, la duración, el tema y el instructor.

Fondo
Los usuarios necesitan capacidades de búsqueda más granulares para encontrar cursos que coincidan con sus requisitos específicos y objetivos de aprendizaje.

Presupuesto
Componentes a crear:
Barra lateral de filtros con múltiples categorías de filtros
RangeSlider para filtrado de duración y precio
Selección múltiple para selección de temas
SearchResultsSorter para ordenar resultados
Tareas:
Implementar la gestión del estado del filtro
Crear sincronización de parámetros de URL para obtener resultados filtrados que se puedan compartir
Añadir la funcionalidad de filtros claros
Implementar un diseño responsivo para filtros en dispositivos móviles
Archivos afectados:
src/components/search/FilterSidebar.tsx (nuevo)
src/components/search/SearchFilters.tsx (nuevo)
src/components/ui/RangeSlider.tsx (nuevo)
src/components/ui/MultiSelect.tsx (nuevo)
src/hooks/useSearchFilters.tsx (nuevo)
src/pages/Search.tsx (actualización)
Etiquetas: interfaz, búsqueda, filtros, componentes de interfaz de usuario, prioridad media
Criterios de aceptación
Los filtros se aplican instantáneamente a medida que los usuarios seleccionan opciones.
Los parámetros de URL reflejan el estado actual del filtro
La experiencia móvil conserva todas las capacidades de filtrado
El botón Borrar filtros restablece todas las selecciones
El estado del filtro persiste durante la navegación dentro de los resultados de búsqueda
Enlace de Figma

🙌 Pautas de contribución:

Se requiere tarea antes de enviar la PR
Plazo: 24 a 48 horas
La descripción de la PR debe incluir: Cerrar #9
Únete al grupo
de Telegram Destaca el repositorio⭐
Para obtener más contexto, consulta el README del proyecto aquí 🚀.

*Es importante que se use lucide icons para iconos y no otra libreria de iconos.