import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

(window as any).global = window;

if (!window.crypto) {
  (window as any).crypto = (window as any).msCrypto || {};
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
