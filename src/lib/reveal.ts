import type { Attachment } from 'svelte/attachments';

/** Fades an element in as it scrolls into view. Elements already on screen are left alone. */
export function reveal(delayMs = 0): Attachment<HTMLElement> {
	return (node) => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (node.getBoundingClientRect().top < innerHeight) return;

		node.style.setProperty('--reveal-delay', `${delayMs}ms`);
		node.classList.add('reveal');
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				node.classList.add('shown');
				observer.disconnect();
			},
			{ rootMargin: '0px 0px -10% 0px' }
		);
		observer.observe(node);
		return () => observer.disconnect();
	};
}
