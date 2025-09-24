<script lang="ts">
  import { user$ } from '@/shared/lib'
</script>

<h1>Series</h1>

<p class="mt-8">User: {$user$?.username}</p>

<p>Role: {$user$?.role}</p>
