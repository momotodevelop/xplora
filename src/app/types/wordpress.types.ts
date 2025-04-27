// Interfaces para los datos de la API REST de WordPress

/**
 * Interfaz común para campos de WordPress que contienen HTML renderizado y un indicador de protección.
 */
export interface RenderedHtml {
    /** Contenido HTML renderizado proporcionado por WordPress. */
    rendered: string;
    /** Indica si el contenido está protegido con contraseña (opcional). */
    protected?: boolean;
  }
  
  /**
   * Interfaz que representa un Post de WordPress tal como lo devuelve la API REST.
   * Incluye todos los campos estándar y campos meta personalizados según el JSON proporcionado.
   */
  export interface WpPost {
    id: number;
    date: string;
    date_gmt: string;
    guid: RenderedHtml;
    modified: string;
    modified_gmt: string;
    slug: string;
    status: string;
    type: string;
    link: string;
    title: RenderedHtml;
    content: RenderedHtml;
    excerpt: RenderedHtml;
    author: number;
    featured_media: number;
    comment_status: string;
    ping_status: string;
    sticky: boolean;
    template: string;
    format: string;
    /** Campos meta (custom fields) del post con sus llaves y valores. */
    meta: { [key: string]: any };
    /** IDs de categorías asignadas al post. */
    categories: number[];
    /** IDs de etiquetas (tags) asignadas al post. */
    tags: number[];
    /** Lista de clases CSS del post (si la proporciona el tema o plugins). */
    class_list?: string[];
    /** Avisos o banderas de SEO (por ejemplo, de un plugin SEO como AIOSEO). */
    aioseo_notices?: any[];
    /** Enlaces a recursos relacionados (self, collection, author, etc.) proporcionados por la API. */
    _links: WpPostLinks;
  }
  
  /**
   * Interfaz para la estructura _links dentro de WpPost, que contiene referencias a otros endpoints REST.
   */
  export interface WpPostLinks {
    self: Array<{ href: string }>;
    collection: Array<{ href: string }>;
    about: Array<{ href: string }>;
    author: Array<{ embeddable: boolean; href: string }>;
    replies: Array<{ embeddable: boolean; href: string }>;
    "version-history": Array<{ count: number; href: string }>;
    "predecessor-version"?: Array<{ id: number; href: string }>;
    "wp:featuredmedia"?: Array<{ embeddable: boolean; href: string }>;
    "wp:attachment": Array<{ href: string }>;
    "wp:term": Array<{ taxonomy: string; embeddable: boolean; href: string }>;
    curies: Array<{ name: string; href: string; templated: boolean }>;
  }
  
  /**
   * Interfaz que representa un elemento de Media (adjunto) de WordPress según la API REST.
   * Usada principalmente para imágenes destacadas u otros archivos multimedia.
   */
  export interface WpMedia {
    id: number;
    date: string;
    date_gmt: string;
    slug: string;
    status: string;
    type: string;  // normalmente "attachment"
    link: string;
    title: RenderedHtml;
    author: number;
    comment_status: string;
    ping_status: string;
    /** Texto alternativo de la imagen (atributo alt). */
    alt_text: string;
    /** Tipo general de medio (ejemplo: "image", "video"). */
    media_type: string;
    /** Tipo MIME del archivo (ejemplo: "image/jpeg"). */
    mime_type: string;
    /** Pie de foto (caption) del medio. */
    caption: RenderedHtml;
    /** Descripción del medio (contenido del adjunto). */
    description: RenderedHtml;
    /** Detalles del archivo de media (dimensiones, tamaños disponibles, metadatos de imagen). */
    media_details: {
      width?: number;
      height?: number;
      file?: string;
      sizes?: {
        [size: string]: {
          file: string;
          width: number;
          height: number;
          mime_type: string;
          source_url: string;
        };
      };
      image_meta?: { [metaKey: string]: any };
    };
    /** ID del post padre al que está adjunto este media (por ejemplo, el post que tiene esta imagen destacada). */
    post: number;
    /** URL directa al archivo original del medio. */
    source_url: string;
    _links?: any;
  }
  
  /**
   * Parámetros para consultar posts a través de la API de WordPress.
   * Cada campo corresponde a un parámetro de query aceptado por el endpoint de posts.
   */
  export interface PostQueryParams {
    /** Texto de búsqueda (búsqueda libre en el título, contenido, etc., según configuración). */
    search?: string;
    /**
     * Columnas en las que se debe aplicar la búsqueda. WordPress permite restringir 
     * la búsqueda a campos específicos.
     * Ejemplo: ['title', 'excerpt'] para buscar solo en el título y el extracto del post.
     * (Se enviará como múltiples parámetros `search_columns[]` en la URL).
     */
    search_columns?: string[];
    /** Número de página de resultados (paginación). */
    page?: number;
    /** Cantidad de posts por página. */
    per_page?: number;
    /** ID(s) de categoría para filtrar posts. Puede ser un número o un arreglo de números. */
    categories?: number | number[];
    /** ID(s) de etiqueta (tag) para filtrar posts. Puede ser un número o un arreglo de números. */
    tags?: number | number[];
    /** ID de autor para filtrar posts por autor. */
    author?: number;
    /** Slug del post (para obtener un post específico por su slug). */
    slug?: string;
}
/**
   * Datos resumidos de un post para mostrar en listados.
   * Incluye solo los campos principales necesarios para la vista de lista.
   */
export interface PostListItem {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    categories: number[];
    tags: number[];
    /** URL de la imagen destacada del post (si tiene). */
    featuredMediaUrl?: string;
} 
/**
* Datos detallados de un post para mostrar en vista individual.
* Combina la información del post con la URL de la imagen destacada.
*/
export interface PostDetail {
    id: number;
    slug: string;
    title: string;
    content: string;
    excerpt: string;
    date: string;
    /** ID del autor (se puede usar para obtener detalles del autor si es necesario). */
    author: number;
    categories: PostDetailCategory[];
    tags: number[];
    /** URL de la imagen destacada del post (si tiene). */
    featuredMediaUrl?: string;
}
/**
 * Representa una categoría de un post en su forma detallada.
 * Esta interfaz se utiliza dentro de PostDetail para mostrar tanto el ID como el nombre legible de la categoría.
 */
export interface PostDetailCategory {
    id: number;
    name: string;
} 
/**
   * Datos mínimos de un post para mostrar como tarjeta simple.
   * Útil para grids o carruseles de posts con información reducida (título e imagen, por ejemplo).
*/
export interface PostSimpleCard {
    id: number;
    slug: string;
    date: string;
    title: string;
    /** Pequeño extracto o resumen del contenido. */
    excerpt: string;
    /** URL de la imagen destacada (si existe) para la tarjeta. */
    featuredMediaUrl?: string;
}  