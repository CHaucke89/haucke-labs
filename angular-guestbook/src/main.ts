import { provideHttpClient, withFetch } from '@angular/common/http';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { Guestbook } from './guestbook';

// No zone.js: Angular 21+ is zoneless by default, and signals tell it what to re-render.
const app = await createApplication({ providers: [provideHttpClient(withFetch())] });

if (!customElements.get('hl-guestbook')) {
	customElements.define('hl-guestbook', createCustomElement(Guestbook, { injector: app.injector }));
}
