<template>
  <!-- Название -->
  <div style="padding-right: 32px">
    <b>{{ lesson.time }}</b> {{ lesson.predm }}
  </div>
</template>

<script>
export default {
  name: 'lessonName',
  props: {
    lesson: Object
  }
}
</script>
