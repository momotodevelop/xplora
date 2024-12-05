export interface MenuItem {
    openInNewTab?: boolean;
    route?: string;
    url?: string;
    name: string;
    page?: string;
    tipoEnlace: TipoEnlace;
    children?: MenuItem[];
}

export type TipoEnlace = "interno"|"externo"|"pagina";