declare module 'virtual:readmes' {
	/** Each project's README, keyed by project slug; empty if the build couldn't fetch it. */
	const readmes: Record<string, string>;
	export default readmes;
}
