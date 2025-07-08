import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, retry, switchMap } from 'rxjs/operators';
import { WpPost, WpMedia, PostQueryParams, PostListItem, PostDetail, PostSimpleCard, PostDetailCategory } from '../types/wordpress.types';

@Injectable({
  providedIn: 'root'
})
export class WordpressService {
  /** URL base del API REST de WordPress (v2). */
  private readonly API_BASE = 'https://xplora.services/wp-json/wp/v2';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los posts de WordPress en formato crudo (sin mapear a otra interfaz).
   * Se pueden especificar parámetros de consulta para filtrar resultados.
   * Soporta búsqueda por texto (`search`) y columnas específicas de búsqueda (`search_columns`), entre otros.
   * @param params Parámetros opcionales de consulta para filtrar los posts.
   * @returns Observable con un arreglo de objetos WpPost tal como los entrega la API.
   */
  getPostsRaw(params?: PostQueryParams): Observable<WpPost[]> {
    let httpParams = new HttpParams();
    if (params) {
      // Agregar parámetros estándar de consulta si fueron proporcionados
      if (params.search) {
        httpParams = httpParams.set('search', params.search);
      }
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.per_page) {
        httpParams = httpParams.set('per_page', params.per_page.toString());
      }
      if (params.categories) {
        // Si se proporcionan varias categorías, unirlas por comas
        const categories = Array.isArray(params.categories) ? params.categories.join(',') : params.categories.toString();
        httpParams = httpParams.set('categories', categories);
      }
      if (params.tags) {
        const tags = Array.isArray(params.tags) ? params.tags.join(',') : params.tags.toString();
        httpParams = httpParams.set('tags', tags);
      }
      if (params.author) {
        httpParams = httpParams.set('author', params.author.toString());
      }
      if (params.slug) {
        httpParams = httpParams.set('slug', params.slug);
      }
      if (params.search_columns && params.search_columns.length) {
        // Agregar cada columna de búsqueda como parámetro separado (search_columns[])
        params.search_columns.forEach(col => {
          httpParams = httpParams.append('search_columns[]', col);
        });
      }
    }
    // Realizar la petición GET a /posts con los parámetros construidos
    return this.http.get<WpPost[]>(`${this.API_BASE}/posts`, { params: httpParams });
  }

  /**
   * Obtiene un post específico por su ID.
   * @param id ID numérico del post a recuperar.
   * @returns Observable con el objeto WpPost correspondiente.
   */
  getPostById(id: number): Observable<WpPost> {
    return this.http.get<WpPost>(`${this.API_BASE}/posts/${id}`).pipe(retry(10));
  }

  /**
   * Obtiene un post específico por su slug (identificador único de URL).
   * Internamente, realiza una petición a `/posts?slug=...`, que devuelve un arreglo (normalmente de un solo elemento).
   * Este método retorna el primer elemento del arreglo si existe un slug coincidente, o null si no se encontró.
   * @param slug Slug del post a recuperar.
   * @returns Observable con el objeto WpPost correspondiente o null si no se encontró.
   */
  getPostBySlug(slug: string): Observable<WpPost | null> {
    const params = new HttpParams().set('slug', slug);
    return this.http.get<WpPost[]>(`${this.API_BASE}/posts`, { params }).pipe(retry(10))
      .pipe(
        map(posts => posts.length > 0 ? posts[0] : null)
      );
  }

  /**
   * Obtiene los detalles de un media (archivo adjunto) por su ID.
   * Útil para obtener información de imágenes, por ejemplo la imagen destacada de un post.
   * @param id ID del media (attachment) a consultar.
   * @returns Observable con el objeto WpMedia que contiene los detalles del archivo.
   */
  getMediaById(id: number): Observable<WpMedia> {
    return this.http.get<WpMedia>(`${this.API_BASE}/media/${id}`).pipe(retry(10));
  }

  /**
   * Obtiene la URL directa de un archivo de media dado su ID.
   * Se puede especificar un tamaño para obtener la URL de una versión particular de la imagen (thumbnail, medium, large, etc.).
   * Si el tamaño especificado no existe, retorna la URL de la imagen original.
   * @param mediaId ID del elemento de media (imagen, adjunto, etc.).
   * @param size Tamaño deseado de la imagen (por defecto 'full' para el tamaño original).
   * @returns Observable con la URL de la imagen en el tamaño especificado (o la original si no existe ese tamaño).
   */
  getMediaUrl(mediaId: number, size: string = 'full'): Observable<string> {
    return this.getMediaById(mediaId).pipe(
      map(media => {
        if (!media) {
          return '';
        }
        // Si no hay tamaños específicos o se solicita 'full', devolver la URL original
        if (!media.media_details || !media.media_details.sizes || size === 'full') {
          return media.source_url;
        }
        // Devolver la URL del tamaño solicitado si existe, si no, la URL original
        const sizeInfo = media.media_details.sizes[size];
        return sizeInfo ? sizeInfo.source_url : media.source_url;
      })
    );
  }

  /**
   * Obtiene un post mapeado para vista detallada.
   * Primero recupera el post por ID y luego (si tiene imagen destacada) obtiene los datos del media para incluir la URL de la imagen.
   * Devuelve los datos estructurados según la interfaz PostDetail para facilitar su uso en la vista.
   * @param id ID del post a obtener en detalle.
   * @returns Observable con un objeto PostDetail que contiene la información del post lista para usar en la vista detallada.
   */
  getPostDetail(id: number): Observable<PostDetail> {
    return this.getPostById(id).pipe(
      switchMap(post => {
        const media$ = post.featured_media ? this.getMediaById(post.featured_media) : of(null);
        const categories$ = this.getCategoryObjects(post.categories);
  
        return forkJoin([media$, categories$]).pipe(
          map(([media, categoryObjects]) => ({
            id: post.id,
            slug: post.slug,
            title: post.title.rendered,
            content: post.content.rendered,
            excerpt: post.excerpt.rendered,
            date: post.date,
            author: post.author,
            categories: categoryObjects,
            tags: post.tags,
            featuredMediaUrl: media?.source_url
          }))
        );
      })
    );
  }
  

  getCategoryObjects(categoryIds: number[]): Observable<PostDetailCategory[]> {
    if (!categoryIds.length) return of([]);
  
    const params = new HttpParams().set('include', categoryIds.join(','));
    return this.http.get<any[]>(`${this.API_BASE}/categories`, { params }).pipe(retry(10)).pipe(
      map(cats => cats.map(cat => ({ id: cat.id, name: cat.name })))
    );
  }
  

  /**
   * Obtiene una lista de posts con campos resumidos para mostrar en listados.
   * Cada post se mapea a PostListItem e incluye título, extracto, fecha y la URL de la imagen destacada.
   * Este método utiliza internamente getPostsRaw() y luego obtiene las imágenes destacadas de cada post para incluir sus URLs.
   * @param params Parámetros opcionales para filtrar los posts (ej: categoría, búsqueda, etc.).
   * @returns Observable con un arreglo de PostListItem listos para mostrar en una lista.
   */
  getPostsList(params?: PostQueryParams): Observable<PostListItem[]> {
    return this.getPostsRaw(params).pipe(
      switchMap(posts => {
        if (!posts || posts.length === 0) {
          return of([] as PostListItem[]);
        }
        // Obtener todos los IDs de imágenes destacadas de los posts (si los tienen)
        const mediaIds = posts
          .filter(post => post.featured_media)
          .map(post => post.featured_media);
        // Eliminar IDs duplicados para evitar llamadas redundantes
        const uniqueMediaIds = Array.from(new Set(mediaIds));
        // Preparar las peticiones para cada media
        const mediaRequests = uniqueMediaIds.map(id => this.getMediaById(id));
        // Ejecutar todas las peticiones de media en paralelo
        return forkJoin(mediaRequests).pipe(
          map(mediaArray => {
            // Crear un mapa de ID de media a URL para acceso rápido
            const mediaUrlMap: { [id: number]: string } = {};
            mediaArray.forEach(mediaItem => {
              if (mediaItem) {
                mediaUrlMap[mediaItem.id] = mediaItem.source_url;
              }
            });
            // Mapear cada post a un PostListItem, incluyendo la URL de la imagen destacada si existe
            return posts.map(post => {
              return {
                id: post.id,
                slug: post.slug,
                title: post.title.rendered,
                excerpt: post.excerpt.rendered,
                date: post.date,
                categories: post.categories,
                tags: post.tags,
                featuredMediaUrl: post.featured_media ? mediaUrlMap[post.featured_media] : undefined
              } as PostListItem;
            });
          })
        );
      })
    );
  }

  /**
   * Obtiene un conjunto de posts en formato de tarjeta simple para mostrar con información mínima.
   * Recupera posts usando getPostsRaw() y los mapea a PostSimpleCard.
   * Cada tarjeta incluye solo ID, slug, título, extracto y opcionalmente la URL de la imagen destacada.
   * @param params Parámetros opcionales para filtrar posts.
   * @returns Observable con un arreglo de PostSimpleCard.
   */
  getSimplePostCards(params?: PostQueryParams): Observable<PostSimpleCard[]> {
    return this.getPostsRaw(params).pipe(
      switchMap(posts => {
        if (!posts || posts.length === 0) {
          return of([] as PostSimpleCard[]);
        }
        // Preparar un observable de tarjeta por cada post (incluyendo la carga de imagen si aplica)
        const cardObservables: Observable<PostSimpleCard>[] = posts.map(post => {
          if (post.featured_media) {
            // Si hay imagen destacada, obtener su URL y luego armar la tarjeta
            return this.getMediaUrl(post.featured_media).pipe(
              map(url => ({
                id: post.id,
                slug: post.slug,
                date: post.date,
                title: post.title.rendered,
                excerpt: post.excerpt.rendered,
                featuredMediaUrl: url
              } as PostSimpleCard))
            );
          } else {
            // Si no hay imagen destacada, retornar la tarjeta directamente
            return of({
              id: post.id,
              slug: post.slug,
              title: post.title.rendered,
              excerpt: post.excerpt.rendered,
              featuredMediaUrl: undefined
            } as PostSimpleCard);
          }
        });
        // Esperar a que todos los observables de tarjetas terminen y recopilar los resultados
        return forkJoin(cardObservables);
      })
    );
  }
}
