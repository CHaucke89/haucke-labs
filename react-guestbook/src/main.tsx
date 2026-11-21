import { createRoot, type Root } from 'react-dom/client';
import css from './guestbook.css?inline';
import { Guestbook } from './Guestbook.tsx';

class GuestbookElement extends HTMLElement {
	private root: Root | null = null;

	connectedCallback() {
		const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
		const style = document.createElement('style');
		style.textContent = css;
		const container = document.createElement('div');
		shadow.replaceChildren(style, container);
		this.root = createRoot(container);
		this.root.render(<Guestbook />);
	}

	disconnectedCallback() {
		this.root?.unmount();
		this.root = null;
	}
}

if (!customElements.get('hl-react-guestbook')) {
	customElements.define('hl-react-guestbook', GuestbookElement);
}
