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
        title="Расписание и замена кабинетов"
        @click="$emit('kab-click')"
        ><img style="width: 24px;" src="../../assets/home.svg"
      /></b-button>
      <b-button
        variant="light"
        title="Расписание группы студентов"
        @click="$emit('strasp-click')"
        ><img style="width: 24px;" src="../../assets/student.svg"
      /></b-button>
      <b-button disabled 
        variant="light"
        title="Копировать или перенести занятие - функция в разработке"
        :id="`copylessonid_${id.idd}_${id.idl}`"
        @click="$emit('copy-click')"
        ><img style="width: 24px;" src="../../assets/copy.svg"
      /></b-button>
      <b-button
        variant="light"
        title="Удалить занятие"
        :id="`lessondelid_${id.idd}_${id.idl}`"
        @click="delClick"
        ><img style="width: 24px;" src="../../assets/del.svg"
      /></b-button>
      <b-button
        variant="light"
        title="Записать занятие в Журнал преподавателя"
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
  },
  methods: {
    delClick() {
      if(confirm('Подтвердите удаление записи')) this.$emit('del-click')
    }
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
    right: -208px !important;
  }

  @media (max-width: 768px) {
  .lesson {
    margin-right: 0px !important;
  }
  .closebuttons {
    right: -219px !important;
  }
}
</style>
