import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { createDefaultFormValues } from '@/utils/schema-form'
import { exampleInputToFormValues } from '@/utils/restore-playground-form'
import type { ModelExample } from '@/types'
import type { InputSchema, SchemaFormValues } from '@/types/schema'

interface UsePlaygroundExamplesOptions {
  examples: ComputedRef<ModelExample[]>
  inputSchema: Ref<InputSchema | null>
  formValues: Ref<SchemaFormValues>
  resetGeneration: () => void
}

function resolveInitialExampleId(
  examples: ModelExample[],
  queryExample: unknown,
): string | null {
  if (typeof queryExample === 'string' && queryExample) {
    const matched = examples.find((item) => item.id === queryExample)
    if (matched) return matched.id
  }

  return examples[0]?.id ?? null
}

export function usePlaygroundExamples(options: UsePlaygroundExamplesOptions) {
  const route = useRoute()
  const selectedExampleId = ref<string | null>(null)

  const selectedExample = computed(
    () => options.examples.value.find((item) => item.id === selectedExampleId.value) ?? null,
  )

  function applyExample(example: ModelExample) {
    if (!options.inputSchema.value) {
      selectedExampleId.value = example.id
      return
    }

    options.resetGeneration()
    options.formValues.value = exampleInputToFormValues(
      example.input,
      options.inputSchema.value,
    )
    selectedExampleId.value = example.id
  }

  function selectExample(exampleId: string) {
    const example = options.examples.value.find((item) => item.id === exampleId)
    if (!example) return
    applyExample(example)
  }

  function syncExamplesFromModel() {
    const examples = options.examples.value
    if (!examples.length) {
      selectedExampleId.value = null
      if (options.inputSchema.value) {
        options.formValues.value = createDefaultFormValues(options.inputSchema.value)
      }
      return
    }

    const nextId = resolveInitialExampleId(examples, route.query.example)
    const nextExample = examples.find((item) => item.id === nextId) ?? examples[0]
    if (!nextExample) return

    if (options.inputSchema.value) {
      applyExample(nextExample)
      return
    }

    selectedExampleId.value = nextExample.id
  }

  watch(
    () => options.examples.value.map((item) => item.id).join('\0'),
    () => {
      syncExamplesFromModel()
    },
    { immediate: true },
  )

  watch(
    () => options.inputSchema.value,
    (schema) => {
      if (!schema || !selectedExampleId.value) return

      const example = options.examples.value.find((item) => item.id === selectedExampleId.value)
      if (!example) return

      options.formValues.value = exampleInputToFormValues(example.input, schema)
    },
  )

  return {
    selectedExampleId,
    selectedExample,
    selectExample,
  }
}
