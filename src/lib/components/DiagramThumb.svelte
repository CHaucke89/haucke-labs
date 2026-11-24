<script lang="ts">
	import { edgeGeometry, nodeRect, type Diagram } from '#lib/diagrams.ts';

	let { diagram }: { diagram: Diagram } = $props();

	let byId = $derived(new Map(diagram.nodes.map((n) => [n.id, n])));
	let edges = $derived(diagram.edges.map((e) => ({ ...e, d: edgeGeometry(e, byId).d })));
</script>

<svg
	class="thumb"
	viewBox="-20 -20 {diagram.width + 40} {diagram.height + 40}"
	preserveAspectRatio="xMidYMid meet"
	aria-hidden="true"
>
	{#each diagram.groups as g (g.label)}
		<rect class="group" x={g.x} y={g.y} width={g.w} height={g.h} rx="14" />
	{/each}
	{#each edges as e, i (i)}
		<path class="edge" d={e.d} />
	{/each}
	{#each diagram.nodes as n (n.id)}
		{@const r = nodeRect(n)}
		<rect
			class="node {n.kind}"
			x={r.x}
			y={r.y}
			width={r.w}
			height={r.h}
			rx={n.kind === 'store' ? r.h / 2 : 10}
		/>
	{/each}
</svg>

<style>
	.thumb {
		display: block;
		width: 100%;
		height: 100%;
	}
	.group {
		fill: none;
		stroke: var(--border);
		stroke-width: 2;
		stroke-dasharray: 8 8;
	}
	.edge {
		fill: none;
		stroke: color-mix(in oklab, var(--muted) 70%, transparent);
		stroke-width: 3;
		stroke-dasharray: 10 8;
	}
	.node {
		stroke-width: 3;
		fill: var(--bg);
		stroke: color-mix(in oklab, var(--muted) 70%, transparent);
	}
	.node.mine {
		fill: color-mix(in oklab, var(--accent) 22%, var(--bg));
		stroke: var(--accent);
	}
	.node.store {
		fill: var(--store-soft);
		stroke: var(--store);
	}
	.node.external {
		stroke-dasharray: 10 6;
	}
</style>
