<template>
    <div class="lesson current">
      <div style="padding-right: 32px">
        <b>Копирование</b> {{ clipboard.predm }} <b>Скопировано {{copyCount}} занятий</b>
      </div>
      <lesson-content :lesson="clipboard" :hide-copy-label="true"></lesson-content>
      <div style="width: fit-content; position: relative; margin: 0 15px 0 auto;height: 0;top: -32px;">
        <b-button variant="warning"  size="sm" @click="$emit('exit')">
          Завершить 
        </b-button>
      </div>
    </div>
</template>

<script>
import lessonContent from './lessonContent.vue'

export default {
  name: 'lessonCopyBlock',
  components: {
    lessonContent
  },
  props: {
    clipboard: Object,
    copyCount: Number
  }
}
</script>
