import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'process.env.CANISTER_ID_BACKEND': JSON.stringify(process.env.CANISTER_ID_BACKEND),
		'process.env.DFX_NETWORK': JSON.stringify(process.env.DFX_NETWORK),
		global: 'window'
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
