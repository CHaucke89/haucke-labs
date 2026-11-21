import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: '../static/react-guestbook',
		emptyOutDir: true,
		rolldownOptions: {
			input: 'src/main.tsx',
			output: { entryFileNames: 'main.js', format: 'es' }
		}
	}
});
