<script lang="ts">
	import { backend } from '$lib/canisters';
	import '$lib/canisters';
	let name = 'Yasuo';
	let greet = '';

	const onclick = async () => {
		greet = await backend.greet(name);
		//greet = `Hello ${name}`;
	};
</script>

<form>
	<input type="text" class="border-2" bind:value={name} />
	{greet}<br />
	<button
		type="button"
		class="bg-blue-500 hover:bg-blue-700 text-white font-bold px-4 rounded"
		{onclick}>Greet</button
	>
</form>
