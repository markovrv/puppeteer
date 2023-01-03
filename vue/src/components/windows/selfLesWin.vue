<template>
  <b-modal id="selfleswin" size="xl" title="Добавление занятия" @ok="winHide" :ok-only="true">
    <b-tabs content-class="mt-3">
      <b-tab title="Импорт из .xlsx" active>
        <xlsxImportVue :days="days" @export-lessons="exportLessons" />
      </b-tab>
      <b-tab title="Ручное добавление">
        <b-form-datepicker v-model="rec.day" locale="ru" class="mb-2"></b-form-datepicker>
        <b-form-select v-model="rec.lesson.time" :options="times" class="mb-2"></b-form-select>
        <b-form-input v-model="rec.lesson.predm" placeholder="Предмет" class="mb-2"></b-form-input>
        <b-form-select v-model="rec.lesson.type" :options="types" class="mb-2"></b-form-select>
        <b-form-input v-model="rec.lesson.kab" placeholder="Кабинет" class="mb-2"></b-form-input>
        <b-form-input v-model="rec.lesson.groups" placeholder="Группа" class="mb-2"></b-form-input>
        <b-button @click="addLessonBtnClick" variant="primary">Добавить занятие в расписание</b-button>
      </b-tab>
    </b-tabs>


  </b-modal>
</template>

<script>
import xlsxImportVue from '../content/xlsxImport.vue'

export default {
  name: 'selfLesWin',  
  components: {
    xlsxImportVue
  },
  props: [
    'days'
  ],
  data() {
    return {
      rec: {
        day: "",
        lesson: {
          time: "8:20-9:50",
          predm: "",
          type: "Лекция",
          kab: "",
          groups: ""
        },
      },
      types: [
        {value: "Лекция", text: "Лекция"},
        {value: "Практика", text: "Практика"},
        {value: "Лабораторная", text: "Лабораторная"},
        {value: "Другое", text: "Другое"}
      ],
      times: [
        {value: "8:20-9:50",   text: "1: 8:20-9:50"},
        {value: "10:00-11:30", text: "2: 10:00-11:30"},
        {value: "11:45-13:15", text: "3: 11:45-13:15"},
        {value: "14:00-15:30", text: "4: 14:00-15:30"},
        {value: "15:45-17:15", text: "5: 15:45-17:15"},
        {value: "17:20-18:50", text: "6: 17:20-18:50"},
        {value: "18:55-20:25", text: "7: 18:55-20:25"}
      ],
    }
  },
  methods: {
    winHide() {
      this.$bvModal.hide('selfleswin')
    },
    addLessonBtnClick() {
      this.$emit("lesson-add", this.rec)
    },
    exportLessons(lessons) {
      this.$emit("lesson-add-multi", lessons)
    }
  }
}
</script>

<style>
svg {
    width: auto !important;
    height: auto !important;
}
.custom-select {
    display: inline-block;
    width: 100%;
    height: calc(1.5em + 0.75rem + 2px);
    padding: 0.375rem 1.75rem 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #495057;
    vertical-align: middle;
    background: #fff url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3E%3Cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3E") right .75rem center/8px 10px no-repeat;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}
</style>

