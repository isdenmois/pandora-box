<script lang="ts">
  import { applyAction, deserialize, enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import type { LayoutData } from './$types'
  import { Alert, Dropdown, DropdownItem, Navbar, NavBrand, NavHamburger, NavUl, NavLi, Badge } from 'flowbite-svelte'
  import { ChevronDownOutline } from 'flowbite-svelte-icons'

  export let data: LayoutData

  const logout = async () => {
    const response = await fetch('/?/logout', { method: 'POST', body: new FormData() })
    const result = deserialize(await response.text())

    if (result.type === 'success') {
      await invalidateAll()
    }

    applyAction(result)
  }
</script>

<Navbar let:hidden let:toggle>
  <NavBrand href="/">
    <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Pandora</span>
  </NavBrand>
  <NavHamburger on:click={toggle} />
  <NavUl {hidden}>
    <NavLi href="/">Home</NavLi>
    <NavLi href="/series">Series</NavLi>
    <NavLi href="/movies">Movies</NavLi>
    <NavLi href="/users">Users</NavLi>
    <NavLi class="cursor-pointer">
      <Badge>{data.username}</Badge><ChevronDownOutline class="w-3 h-3 ml-2 text-primary-800 dark:text-white inline" />
    </NavLi>
    <Dropdown class="w-44 z-20">
      <DropdownItem href="/">Dashboard</DropdownItem>
      <DropdownItem href="/settings">Settings</DropdownItem>
      <DropdownItem on:click={logout} slot="footer">Sign out</DropdownItem>
    </Dropdown>
  </NavUl>
</Navbar>

<Alert>
  Hello, <span class="font-medium">{data.username}!</span>!
</Alert>

<slot />
