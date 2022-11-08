<script setup lang="ts"></script>

<template>
  <div class="my-4">
    <!-- New Folder -->
    <a-button v-e="['c:stoage:folder']" class="nc-new-folder-menu-btn nc-toolbar-btn">
      <div class="flex items-center gap-1">
        <MdiFolderOutline />
        <span class="text-capitalize !text-sm font-weight-normal">{{ $t('activity.storageManager.newFolder') }}</span>
      </div>
    </a-button>

    <!-- Upload File -->
    <a-button v-e="['c:storage:upload']" class="nc-upload-folder-menu-btn nc-toolbar-btn">
      <div class="flex items-center gap-1">
        <MdiUploadOutline />
        <span class="text-capitalize !text-sm font-weight-normal">{{ $t('activity.storageManager.uploadFile') }}</span>
      </div>
    </a-button>

    <!-- Sort By -->
    <a-button v-e="['c:storage:sortBy']" class="nc-sort-by-menu-btn nc-toolbar-btn">
      <div class="flex items-center gap-1">
        <MdiSort />
        <span class="text-capitalize !text-sm font-weight-normal">{{ $t('activity.storageManager.sortBy') }}</span>
        <MdiMenuDown class="text-grey" />
      </div>
    </a-button>

    <!-- Refresh -->
    <a-button v-e="['c:storage:refresh']" class="nc-refresh-menu-btn nc-toolbar-btn">
      <div class="flex items-center gap-1">
        <MdiRefresh />
        <span class="text-capitalize !text-sm font-weight-normal">{{ $t('activity.storageManager.refresh') }}</span>
      </div>
    </a-button>

    <!-- Download (when selected) -->
    <a-button v-e="['c:storage:download']" class="nc-download-menu-btn nc-toolbar-btn">
      <div class="flex items-center gap-1">
        <MdiDownload />
        <span class="text-capitalize !text-sm font-weight-normal">{{ $t('activity.storageManager.download') }}</span>
      </div>
    </a-button>

    <!-- Delete (when selected) -->
    <a-button v-e="['c:storage:delete']" class="nc-delete-menu-btn nc-toolbar-btn">
      <div class="flex items-center gap-1">
        <MdiDeleteOutline />
        <span class="text-capitalize !text-sm font-weight-normal">{{ $t('activity.storageManager.delete') }}</span>
      </div>
    </a-button>
  </div>
</template>
