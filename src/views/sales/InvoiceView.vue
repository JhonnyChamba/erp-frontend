<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const authStore = useAuthStore()

const currentSubModule = computed(() => {
  const menu = authStore.accessInfo?.menu || []
  for (const mod of menu) {
    for (const sub of mod.children || []) {
      if (sub.url === route.fullPath || sub.url === route.path) {
        return {
          moduleCode: mod.code,
          moduleName: mod.description,
          ...sub,
        }
      }
    }
  }
  return {
    moduleCode: 'MOD-001',
    moduleName: 'Módulo Operativo',
    code: 'SUB-001',
    description: route.name ? String(route.name).toUpperCase() : 'Facturación',
    icon: 'solar:document-text-line-duotone',
    url: route.fullPath,
  }
})
</script>

<template>
  <div class="card rounded-4 border-0 shadow-sm p-4 bg-dark text-white">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 pb-3 border-bottom border-secondary-subtle">
      <div class="d-flex align-items-center gap-3">
        <span class="p-3 bg-primary-subtle text-primary rounded-3 d-inline-flex">
          <iconify-icon :icon="currentSubModule.icon" class="fs-6"></iconify-icon>
        </span>
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
              {{ currentSubModule.moduleCode }} · {{ currentSubModule.moduleName }}
            </span>
            <span class="badge bg-info-subtle text-info border border-info-subtle font-monospace">
              {{ currentSubModule.code }}
            </span>
          </div>
          <h4 class="fw-bold text-white mb-0">{{ currentSubModule.description }}</h4>
        </div>
      </div>

      <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
        <iconify-icon icon="solar:shield-check-bold" class="me-1 align-middle"></iconify-icon>
        Acceso Verificado ({{ authStore.accessInfo?.roleName || 'Autorizado' }})
      </span>
    </div>

    <div class="card-body px-0 pt-4 pb-2">
      <p class="text-secondary mb-0">
        Vista operativa del submódulo <strong>{{ currentSubModule.description }}</strong> (<code class="text-info">{{ currentSubModule.url }}</code>) habilitado para esta empresa.
      </p>
    </div>
  </div>
</template>
