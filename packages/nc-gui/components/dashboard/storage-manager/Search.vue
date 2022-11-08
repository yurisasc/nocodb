<script setup lang="ts">
const searchQuery = ref<string>()

function search() {
  // TODO
}
</script>

<template>
  <div class="flex flex-row border-1 rounded-sm">
    <div ref="searchDropdown" class="flex items-center relative bg-gray-50 px-2 cursor-pointer border-r-1">
      <MdiMagnify class="text-grey" />
    </div>
    <a-input
      size="small"
      v-model:value="searchQuery"
      class="max-w-[200px]"
      placeholder="Search"
      :bordered="false"
      @press-enter="search"
    >
    </a-input>
  </div>
</template>
