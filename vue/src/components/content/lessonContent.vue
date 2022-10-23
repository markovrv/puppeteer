<template>
  <div style="padding-left: 6px;">
    <span style="font-size: 80%;">
      <span style="font-weight: bold;" v-html="lesson.kab + ' '"></span>
      <span style="font-weight: bold; text-decoration: line-through; color: red;" v-html="lesson.oldkab" v-if="lesson?.oldkab + ' '"></span>
      {{ lesson.type.slice(0,3) }} {{ lesson.groups.join(', ') }} 
      <span v-if="lesson.unsaved && !hideCopyLabel" style="color: red" @click="$emit('kab-click')"><u title="не назначен кабинет" style="color: #0d6efd; cursor: pointer;">не сохранённая</u></span>
      <span v-if="lesson.copied && !hideCopyLabel" style="color: green"> копия </span>
      <span v-if="!hideCopyLabel"
        @click="winLogShow(lesson.log)"
        :style="'color: ' + ((lesson.color == 'blue')?'#0d6efd':lesson.color) + '; ' + (lesson.log ? 'text-decoration: underline; cursor: pointer;' : '')"
        v-html="lesson.status"
      ></span>
    </span>
  </div>
</template>

<script>
export default {
  name: 'lessonContent',
  props: {
    lesson: Object,
    hideCopyLabel: {
      default: false,
      type: Boolean
    }
  },
  methods: {
    winLogShow (log) {
      if (log) {
        this.$emit('set-win-log', log)
        this.$bvModal.show('logwin')
      }
    }
  }
}
</script>
