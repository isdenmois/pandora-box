<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	import { setLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
</script>

<h1>{m.hello_world({ name: data.user?.username })}</h1>
<p>
	If you use VSCode, install the <a
		href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension"
		target="_blank">Sherlock i18n extension</a
	> for a better i18n experience.
</p>

<p>User: {data.user?.username}</p>

<p>Role: {data.user?.role}</p>

<div>
	<button onclick={() => setLocale('en')}>en</button>
	<button onclick={() => setLocale('ru')}>ru</button>
</div>
