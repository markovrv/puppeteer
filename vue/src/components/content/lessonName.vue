<template>
  <!-- Название -->
  <div style="padding-right: 32px" @click="$emit('click')">
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
