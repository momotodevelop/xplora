interface Slug {
    current: string;
    _type: "slug";
}

export type TipoEnlace = "interno"|"externo"|"pagina";

export interface ChildItem {
    slug?: Slug;
    route: string;
    _type: "childItem";
    name: string;
    tipoEnlace: TipoEnlace;
    _key: string;
    page: {
        _ref: string;
        _type: "reference"
    };
    url: string;
}

export interface NavigationItem {
    openInNewTab?: boolean;
    slug: Slug;
    route?: string;
    url?: string;
    type: "navigationItem";
    name: string;
    page?: {
        _ref: string;
        _type: "reference"
    };
    tipoEnlace: TipoEnlace;
    children?: ChildItem[];
}

export interface NavigationData {
    _rev: string;
    _type: "navigation";
    name: string;
    description: string;
    slug: Slug;
    navigationItems: NavigationItem[];
    _id: string;
    _updatedAt: string;
    _createdAt: string;
}