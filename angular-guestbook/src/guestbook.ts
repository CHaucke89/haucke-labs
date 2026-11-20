import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	linkedSignal,
	signal,
	ViewEncapsulation
} from '@angular/core';
import { firstValueFrom, type Observable } from 'rxjs';
import { loginUrl, PROVIDER_IDS, PROVIDERS } from '../../src/lib/auth.ts';
import { formatDate } from '../../src/lib/github.ts';
import { MAX_MESSAGE, profileUrl, type GuestbookState } from '../../src/lib/guestbook.ts';

const API = '/api/guestbook';

type Status = { error: string } | { saved: true } | null;

@Component({
	selector: 'hl-guestbook',
	templateUrl: './guestbook.html',
	styleUrl: './guestbook.css',
	// Shadow DOM keeps the site's styles out; CSS custom properties still pass through, so the theme applies.
	encapsulation: ViewEncapsulation.ShadowDom,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class Guestbook {
	private readonly http = inject(HttpClient);

	protected readonly state = httpResource<GuestbookState>(() => API);
	// Same idea as Svelte's writable $derived: typing overrides it, and it resets when state changes.
	protected readonly draft = linkedSignal(() => this.state.value()?.mine?.message ?? '');
	protected readonly length = computed(() => [...this.draft()].length);
	protected readonly saving = signal(false);
	protected readonly status = signal<Status>(null);

	protected readonly max = MAX_MESSAGE;
	protected readonly providers = PROVIDERS;
	protected readonly providerIds = PROVIDER_IDS;
	protected readonly signInUrl = (id: keyof typeof PROVIDERS) => loginUrl(id, location.pathname);
	protected readonly profileUrl = profileUrl;
	protected readonly formatDate = formatDate;

	protected save(event: Event) {
		event.preventDefault();
		this.send(this.http.post<GuestbookState>(API, { message: this.draft() }), true);
	}

	protected remove() {
		this.send(this.http.delete<GuestbookState>(API), false);
	}

	private async send(request: Observable<GuestbookState>, showSaved: boolean) {
		this.saving.set(true);
		this.status.set(null);
		try {
			this.state.set(await firstValueFrom(request));
			if (showSaved) this.status.set({ saved: true });
		} catch (e) {
			const message = e instanceof HttpErrorResponse ? e.error?.error : null;
			this.status.set({ error: typeof message === 'string' ? message : 'Something went wrong. Try again.' });
		} finally {
			this.saving.set(false);
		}
	}
}
