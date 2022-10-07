<template>
  <div style="padding-left: 6px;">
    <span style="font-size: 80%;">
      <span style="font-weight: bold;" v-html="lesson.kab"></span>
      {{ lesson.type }}
      {{ lesson.groups.join(', ') }}
      <span
        @click="winLogShow(lesson.log)"
        :style="
          'color: ' +
            lesson.color +
            '; ' +
            (lesson.log ? 'text-decoration: underline; cursor: pointer;' : '')
        "
        v-html="lesson.status"
      ></span>
    </span>
  </div>
</template>

<script>
export default {
  name: 'lessonContent',
  props: {
    lesson: Object
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
