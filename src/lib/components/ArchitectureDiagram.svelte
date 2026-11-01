<script lang="ts">
	import { NODE_H, NODE_W, type Diagram, type DiagramEdge, type DiagramNode } from '#lib/diagrams.ts';

	let { diagram, id }: { diagram: Diagram; id: string } = $props();

	let active = $state<string | null>(null);
	let pinned = $state<string | null>(null);

	const rect = (n: DiagramNode) => ({ x: n.x, y: n.y, w: n.w ?? NODE_W, h: n.h ?? NODE_H });
	let byId = $derived(new Map(diagram.nodes.map((n) => [n.id, n])));
	let current = $derived(active ?? pinned);
	let currentNode = $derived(current ? byId.get(current) : undefined);

	type Geo = { d: string; lx: number; ly: number; anchor: 'start' | 'middle' | 'end' };

	function geometry(e: DiagramEdge): Geo {
		const a = rect(byId.get(e.from)!);
		const b = rect(byId.get(e.to)!);
		if (e.points) {
			const d = 'M' + e.points.map(([x, y]) => `${x} ${y}`).join(' L');
			const mid = e.labelAt ?? e.points[Math.floor(e.points.length / 2)];
			return { d, lx: mid[0], ly: mid[1], anchor: 'middle' };
		}
		const xOverlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
		const yOverlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
		if (xOverlap > 0 && yOverlap <= 0) {
			const x = e.at ?? (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2;
			const [y1, y2] = a.y < b.y ? [a.y + a.h, b.y] : [a.y, b.y + b.h];
			const ly = (y1 + y2) / 2 + 4;
			return e.labelLeft
				? { d: `M${x} ${y1} L${x} ${y2}`, lx: x - 6, ly, anchor: 'end' }
				: { d: `M${x} ${y1} L${x} ${y2}`, lx: x + 6, ly, anchor: 'start' };
		}
		if (yOverlap > 0) {
			const y = e.at ?? (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2;
			const [x1, x2] = a.x < b.x ? [a.x + a.w, b.x] : [a.x, b.x + b.w];
			return { d: `M${x1} ${y} L${x2} ${y}`, lx: (x1 + x2) / 2, ly: y - 7, anchor: 'middle' };
		}
		const right = b.x > a.x;
		const x1 = right ? a.x + a.w : a.x;
		const y1 = a.y + a.h / 2;
		const x2 = b.x + b.w / 2;
		const y2 = b.y > a.y ? b.y : b.y + b.h;
		return { d: `M${x1} ${y1} L${x2} ${y1} L${x2} ${y2}`, lx: (x1 + x2) / 2, ly: y1 - 7, anchor: 'middle' };
	}

	let edges = $derived(diagram.edges.map((e) => ({ ...e, geo: geometry(e) })));

	const linked = (e: DiagramEdge) => current !== null && (e.from === current || e.to === current);
	const neighbor = (nid: string) =>
		current !== null &&
		diagram.edges.some(
			(e) => (e.from === current && e.to === nid) || (e.to === current && e.from === nid)
		);

	function toggle(nid: string) {
		pinned = pinned === nid ? null : nid;
	}

	function onKey(event: KeyboardEvent, nid: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle(nid);
		} else if (event.key === 'Escape') {
			pinned = null;
		}
	}

	const textWidth = (s: string) => s.length * 6.4 + 10;
</script>

<figure class="diagram">
	<figcaption>
		<span class="title">{diagram.title}</span>
		<span class="caption">{diagram.caption}</span>
	</figcaption>

	<div class="scroll">
		<svg
			viewBox="0 0 {diagram.width} {diagram.height}"
			class:focused={current !== null}
			role="group"
			aria-label="{diagram.title}. Select a component to read what it does."
		>
			<defs>
				<marker
					id="{id}-arrow"
					viewBox="0 0 10 10"
					refX="9"
					refY="5"
					markerWidth="7"
					markerHeight="7"
					orient="auto-start-reverse"
				>
					<path d="M0 0 L10 5 L0 10 z" class="arrowhead" />
				</marker>
			</defs>

			{#each diagram.groups as g (g.label)}
				<g class="group">
					<rect x={g.x} y={g.y} width={g.w} height={g.h} rx="12" />
					<text x={g.x + 14} y={g.labelBottom ? g.y + g.h - 12 : g.y + 22}>{g.label}</text>
				</g>
			{/each}

			{#each edges as e, i (i)}
				<g class="edge" class:lit={linked(e)} class:dashed={e.dashed}>
					<path
						d={e.geo.d}
						marker-end="url(#{id}-arrow)"
						marker-start={e.both ? `url(#${id}-arrow)` : undefined}
					/>
					{#if e.label}
						<rect
							class="label-bg"
							x={e.geo.anchor === 'middle'
								? e.geo.lx - textWidth(e.label) / 2
								: e.geo.anchor === 'end'
									? e.geo.lx - textWidth(e.label) + 3
									: e.geo.lx - 3}
							y={e.geo.ly - 12}
							width={textWidth(e.label)}
							height="16"
							rx="4"
						/>
						<text x={e.geo.lx} y={e.geo.ly} text-anchor={e.geo.anchor}>{e.label}</text>
					{/if}
				</g>
			{/each}

			{#each diagram.nodes as n (n.id)}
				{@const r = rect(n)}
				<g
					class="node {n.kind}"
					class:active={current === n.id}
					class:near={neighbor(n.id)}
					class:pinned={pinned === n.id}
					role="button"
					tabindex="0"
					aria-pressed={pinned === n.id}
					aria-label="{n.label}{n.sub ? `, ${n.sub}` : ''}"
					onmouseenter={() => (active = n.id)}
					onmouseleave={() => (active = null)}
					onfocus={() => (active = n.id)}
					onblur={() => (active = null)}
					onclick={() => toggle(n.id)}
					onkeydown={(ev) => onKey(ev, n.id)}
				>
					<rect x={r.x} y={r.y} width={r.w} height={r.h} rx="8" />
					<text class="label" x={r.x + r.w / 2} y={r.y + r.h / 2 - (n.sub ? 3 : -5)}
						>{n.label}</text
					>
					{#if n.sub}
						<text class="sub" x={r.x + r.w / 2} y={r.y + r.h / 2 + 15}>{n.sub}</text>
					{/if}
				</g>
			{/each}
		</svg>
	</div>

	<div class="detail" aria-live="polite">
		{#if currentNode}
			<p><strong>{currentNode.label}.</strong> {currentNode.detail}</p>
		{:else}
			<p class="hint">Hover over or tap a component to see what it does.</p>
		{/if}
	</div>

	<ul class="legend" aria-label="Legend">
		<li><span class="swatch mine"></span>My code</li>
		<li><span class="swatch upstream"></span>Upstream or third-party</li>
		<li><span class="swatch store"></span>Data or channel</li>
		<li><span class="swatch external"></span>Outside the system</li>
	</ul>
</figure>

<style>
	.diagram {
		margin: 0;
		padding: 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		--d-mine: var(--accent);
		--d-mine-fill: var(--accent-soft);
		--d-upstream: var(--muted);
		--d-store: var(--store);
		--d-store-fill: var(--store-soft);
		--d-external: #8b949e;
	}
	figcaption {
		display: grid;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}
	.title {
		font-weight: 700;
	}
	.caption {
		color: var(--muted);
		font-size: 0.925rem;
	}
	.scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	svg {
		display: block;
		width: 100%;
		min-width: 640px;
		height: auto;
		font-family: var(--sans);
	}
	.group rect {
		fill: none;
		stroke: var(--border);
		stroke-dasharray: 4 4;
	}
	.group text {
		fill: var(--muted);
		font-size: 12px;
		font-family: var(--mono);
	}
	.edge path {
		fill: none;
		stroke: var(--muted);
		stroke-width: 1.5;
		transition: opacity 0.15s, stroke 0.15s;
	}
	.edge.dashed path {
		stroke-dasharray: 5 4;
	}
	.arrowhead {
		fill: var(--muted);
	}
	.edge text {
		fill: var(--muted);
		font-size: 11px;
		font-family: var(--mono);
	}
	.label-bg {
		fill: var(--surface);
	}
	.focused .edge {
		opacity: 0.25;
	}
	.focused .edge.lit {
		opacity: 1;
	}
	.edge.lit path {
		stroke: var(--accent);
		stroke-width: 2;
	}
	.edge.lit text {
		fill: var(--text);
	}
	.node {
		cursor: pointer;
		outline: none;
		transition: opacity 0.15s;
	}
	.node rect {
		stroke-width: 1.5;
		transition: stroke-width 0.15s;
	}
	.node.mine rect {
		fill: var(--d-mine-fill);
		stroke: var(--d-mine);
	}
	.node.upstream rect {
		fill: var(--bg);
		stroke: var(--d-upstream);
	}
	.node.store rect {
		fill: var(--d-store-fill);
		stroke: var(--d-store);
	}
	.node.external rect {
		fill: var(--bg);
		stroke: var(--d-external);
		stroke-dasharray: 5 3;
	}
	.node .label {
		fill: var(--text);
		font-size: 14px;
		font-weight: 600;
		text-anchor: middle;
	}
	.node .sub {
		fill: var(--muted);
		font-size: 11.5px;
		font-family: var(--mono);
		text-anchor: middle;
	}
	.focused .node {
		opacity: 0.4;
	}
	.focused .node.active,
	.focused .node.near,
	.focused .node.pinned {
		opacity: 1;
	}
	.node.active rect,
	.node.pinned rect {
		stroke-width: 3;
	}
	.node:focus-visible rect {
		stroke: var(--text);
		stroke-width: 3;
	}
	.detail {
		min-height: 4.5rem;
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		background: var(--bg);
		border: 1px solid var(--border);
	}
	.detail p {
		margin: 0;
	}
	.hint {
		color: var(--muted);
	}
	.legend {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.swatch {
		width: 14px;
		height: 10px;
		border-radius: 3px;
		border: 1.5px solid;
	}
	.swatch.mine {
		border-color: var(--d-mine);
		background: var(--d-mine-fill);
	}
	.swatch.upstream {
		border-color: var(--d-upstream);
	}
	.swatch.store {
		border-color: var(--d-store);
		background: var(--d-store-fill);
	}
	.swatch.external {
		border-color: var(--d-external);
		border-style: dashed;
	}
	@media (prefers-reduced-motion: reduce) {
		.edge path,
		.node,
		.node rect {
			transition: none;
		}
	}
</style>
