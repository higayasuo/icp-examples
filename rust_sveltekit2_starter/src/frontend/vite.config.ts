import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export default defineConfig({
	plugins: [sveltekit()],
	envPrefix: ['DFX_', 'CANISTER_'],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
