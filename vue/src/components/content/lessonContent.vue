<template>
  <div style="padding-left: 6px;">
    <span style="font-size: 80%;">
      <span style="font-weight: bold;" v-html="lesson.kab + ' '"></span>
      <span style="font-weight: bold; text-decoration: line-through; color: red;" v-html="lesson.oldkab" v-if="lesson?.oldkab + ' '"></span>
      {{ lesson.type.slice(0,3) }} {{ lesson.groups.join(', ') }} 
      <!--span v-if="lesson.unsaved && !hideCopyLabel" style="color: red" @click="$emit('kab-click')"><u title="не назначен кабинет" style="color: #0d6efd; cursor: pointer;">не сохранённая</u></span-->
      <span v-if="lesson.in_iss == 1" @click="issCheckClick()" style="color: green" title="Занятие уже в журнале. Кликнуть для снятия отметки.">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16">
          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
        </svg>
      </span>
      <span v-if="true && !hideCopyLabel"
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
    },
    issCheckClick() {
      this.$emit('iss-check-click')
    }
  }
}
</script>
