import { provideServerRendering, withRoutes } from '@angular/ssr';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { appBaseConfig } from './app.config.shared';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideNoopAnimations(), provideServerRendering(withRoutes(serverRoutes))]
};

export const config = mergeApplicationConfig(appBaseConfig, serverConfig);
