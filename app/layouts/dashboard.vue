<template>
  <div class="min-h-screen bg-slate-50">
    <div class="flex">
      <AppSidebar />

      <main class="min-h-screen flex-1 pl-64">
        <AppTopbar />

        <div class="p-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>