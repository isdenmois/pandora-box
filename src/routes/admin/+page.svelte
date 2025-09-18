<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<h1>Admin panel, baby!</h1>

<h3>Register a user</h3>

<form method="post" action="?/register" use:enhance>
	<label>
		Username
		<input name="username" />
	</label>
	<label>
		Password
		<input type="password" name="password" />
	</label>

	<button type="submit">Register</button>
</form>

<p style="color: red">{form?.message ?? ''}</p>
