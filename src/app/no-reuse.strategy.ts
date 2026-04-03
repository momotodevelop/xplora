import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';
export class NoReuseStrategy implements RouteReuseStrategy {
    shouldDetach(): boolean {
        return false;
    }
    store(): void {}
    shouldAttach(): boolean {
        return false;
    }
    retrieve(): DetachedRouteHandle | null {
        return null;
    }
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        // Siempre fuerza recreación del componente
        return false;
    }
}