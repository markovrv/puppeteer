<template>
  <div
    class="lessonmenu"
    :class="lesson.showmenu ? 'showbuttons' : 'closebuttons'"
  >
    <b-button-group
      size="sm"
      class="shadow-sm"
      style="border: 1px solid #d3d4d5;"
    >
      <b-button
        variant="light"
        title="меню"
        style="width: 30px; height: 34.5px; border-right: 2px solid #d3d4d5;"
        @click="$emit('close')"
        >{{ lesson.showmenu ? '&raquo;' : '&laquo;' }}</b-button
      >
      <b-button
        variant="light"
        title="Загрузить занятость аудиторий"
        @click="$emit('kab-click')"
        ><img style="width: 24px;" src="../../assets/home.svg"
      /></b-button>
      <b-button
        variant="light"
        title="Загрузить расписание группы студентов"
        @click="$emit('strasp-click')"
        ><img style="width: 24px;" src="../../assets/student.svg"
      /></b-button>
      <b-button
        variant="light"
        title="Отметить нагрузку в Журнале преподавателя"
        :id="`lessontoissid_${id.idd}_${id.idl}`"
        @click="$emit('work-click')"
        ><img style="width: 24px;" src="../../assets/journal.svg"
      /></b-button>
    </b-button-group>
  </div>
</template>

<script>
export default {
  name: 'lessonName',
  props: {
    lesson: Object,
    id: Object
  }
}
</script>

<style>
  .lessonmenu {
    position: relative;
    right: 0;
    top: 10px;
    margin: 0 0 0 auto;
    width: fit-content;
    height: 0;
  }

  .showbuttons {
    transition: 0.5s;
    right: 8px !important;
  }
  .closebuttons {
    transition: 0.5s;
    right: -126px !important;
  }

  @media (max-width: 768px) {
  .lesson {
    margin-right: 0px;
  }
  .closebuttons {
    right: -137px !important;
  }
}
</style>
