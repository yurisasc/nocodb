<script setup lang="ts">
const { t } = useI18n()
const { isImportTypeCsv, IsImportTypeExcel, isImportTypeJson, importDataOnly, parserConfig } = useQuickImportStoreOrThrow()!
</script>

<template>
  <div class="mb-4">
    <a-divider />

    <!-- Advanced Settings -->
    <span class="prose-lg">{{ $t('title.advancedSettings') }}</span>

    <a-form-item class="!my-2" :label="t('msg.info.footMsg')">
      <a-input-number v-model:value="parserConfig.maxRowsToParse" :min="1" :max="50000" />
    </a-form-item>

    <a-form-item v-if="!importDataOnly" class="!my-2">
      <a-checkbox v-model:checked="parserConfig.autoSelectFieldTypes">
        <span class="caption">Auto-Select Field Types</span>
      </a-checkbox>
    </a-form-item>

    <a-form-item v-if="isImportTypeCsv || IsImportTypeExcel" class="!my-2">
      <a-checkbox v-model:checked="parserConfig.firstRowAsHeaders">
        <span class="caption">Use First Row as Headers</span>
      </a-checkbox>
    </a-form-item>

    <!-- Flatten nested -->
    <a-form-item v-if="isImportTypeJson" class="!my-2">
      <a-checkbox v-model:checked="parserConfig.normalizeNested">
        <span class="caption">{{ $t('labels.flattenNested') }}</span>
      </a-checkbox>
    </a-form-item>

    <!-- Import Data -->
    <a-form-item v-if="!importDataOnly" class="!my-2">
      <a-checkbox v-model:checked="parserConfig.shouldImportData">{{ $t('labels.importData') }}</a-checkbox>
    </a-form-item>
  </div>
</template>
