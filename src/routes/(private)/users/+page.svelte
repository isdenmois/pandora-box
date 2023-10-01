<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

{#if data.users.length > 0}
	<h3>Users:</h3>

	<ul>
		{#each data.users as user}
			<li>{user.username}</li>
		{/each}
	</ul>
{/if}
