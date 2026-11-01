import { error } from '@sveltejs/kit';
import { getProject, projects } from '#lib/projects.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => projects.map((p) => ({ slug: p.slug }));

export const load: PageLoad = ({ params }) => {
	const project = getProject(params.slug);
	if (!project) error(404, 'Project not found');
	const index = projects.indexOf(project);
	return { project, next: projects[(index + 1) % projects.length] };
};
