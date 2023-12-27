<template>
  <div class="container-fluid">
    <div class="mt-3">
      <h3>Загрузка расписания колледжа ВятГУ</h3>
      <label>Файл <code>.xlsx</code> с расписанием:</label>
      <input @change="fileChanged" type="file" accept=".xlsx" class="form-control" />
      <b-alert :show="lessons.length == 0" variant="warning" style="margin-top:16px">Перед загрузкой файла требуется отменить объединение всех ячеек. Парсер не умеет работать с объединенными ячейками.</b-alert>
      <label>Текущий год:</label>
      <input v-model="currentYear" type="number" class="form-control" />
      <label>Преподаватель:</label>
      <input v-model="teather" type="search" class="form-control" />
      <div id="table_to_parse" v-html="html" v-show="false" /> 
    </div>
    <div class="card mt-3" v-if="lessons.length > 0">
      <b-table :items="lessonsFiltered" :fields="fields" select-mode="multi"
        responsive="sm" ref="selectableTable" selectable @row-selected="onRowSelected">
        <template #cell(selected)="{ rowSelected }">
          <template v-if="rowSelected">
            <span aria-hidden="true">&check;</span>
          </template>
          <template v-else>
            <span aria-hidden="true">&nbsp;</span>
          </template>
        </template>
      </b-table>
      <p>&nbsp;
        &nbsp;<b-button size="sm" @click="selectAllRows">Выбрать все</b-button>
        &nbsp;<b-button size="sm" @click="clearSelected">Снять выбор</b-button>
        &nbsp;<b-button v-if="selected.length > 0" variant="primary" @click="exportLessons">Добавить <b-badge variant="light" style="background-color: white;color: black;">{{ selected.length }}</b-badge> занятий в расписание</b-button>
      </p>
    </div>
  </div>
</template>

<script>
import { read, utils } from 'xlsx';

export default {
  name: 'xlsImport',
  props: [
    'days'
  ],
  computed: {
    lessonsFiltered() {
      return this.lessons.filter(les => (les.teather.indexOf(this.teather) != -1))
    }
  },
  data() {
    return {
      html: "",
      teather: "Марков",
      currentYear: "",
      lessons: [],
      fields: [
        {
          key: "selected",
          label: "✓"
        },
        {
          key: "day",
          label: "День"
        },
        {
          key: "time",
          label: "Пара"
        },
        {
          key: "predm",
          label: "Предмет"
        },
        {
          key: "type",
          label: "Тип"
        },
        {
          key: "groups",
          label: "Группы"
        },
        {
          key: "teather",
          label: "Преподаватель"
        },
        {
          key: "kab",
          label: "Кабинет"
        },
      ],
      selected: []
    }
  },
  methods: {
    onRowSelected(items) {
      this.selected = items
    },
    selectAllRows() {
      this.$refs.selectableTable.selectAllRows()
    },
    clearSelected() {
      this.$refs.selectableTable.clearSelected()
    },
    fileChanged({ target }) {
      let file = target.files[0]
      if (file.type != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        console.log("Unknown File Format: " + file.type);
        return null;
      }
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onload = () => {
        this.parseXlsx(reader.result);
      }
    },
    async parseXlsx(f) {
      // время пар
      const times = ["8:20-9:50", "10:00-11:30", "11:45-13:15", "14:00-15:30", "15:45-17:15", "17:20-18:50", "18:55-20:25"]
      // исключить из обработки следующие столбцы (заголовки строк + шаблонные данные)
      const headers = [20, 21, 34, 35, 48, 49, 62, 63, 76, 77, 90, 91, 92, 93, 94, 95, 96, 97, 110, 111, 124, 125, 138, 139, 152, 153, 166, 167, 180, 181, 194, 195, 208, 209]
      // читаем файл с расписанием
      const wb = read(f);
      this.html = utils.sheet_to_html(wb.Sheets[wb.SheetNames[0]])

      // парсим таблицу с расписанием
      setTimeout(() => {
        let table = window.document.querySelector("#table_to_parse")
        let trs = table.querySelectorAll("tr")
        var maxGrIndex = 0

        // получаем группы
        var groups = [];
        let grnames = trs[23].querySelectorAll('td')
        grnames.forEach((el, key) => {
          if (key > 7 && key != 92 && el.textContent != '') {
            let grs = el.textContent.replaceAll('Группа', '').trim().replace(/\s+/g, ',').split(',')
            if (grs.length > 0 && grs[0] != '') {
              groups.push({ grs, key })
              maxGrIndex = key
            }
          }
        })

        // получаем занятия
        this.lessons = []
        var tdcnt = trs.length
        var current = {
          day: '',
          lesson: 0
        }
        for (let i = 25; i < tdcnt; i++) {
          let tds = trs[i].querySelectorAll("td")

          // определяем дату и время
          if (tds[6].textContent != '') {
            let dataArr = tds[6].textContent.split(" ")
            let day = dataArr[dataArr.length - 1].trim().split(".")
            let d = `${this.currentYear}-${day[1]}-${day[0]}`
            current.day = d
            current.lesson = 0
          } else {
            current.lesson++
          }

          // парсим занятия
          let j = 8;
          while (j <= maxGrIndex) {
            if (headers.indexOf(j) == -1) {
              if (tds[j].textContent != '') {
                var lesson = {
                  day: current.day,
                  time: times[current.lesson],
                  predm: tds[j].textContent,
                  groups: groups.find(gr => (gr.key == j))?.grs,
                  type: tds[j + 1].textContent,
                  teather: tds[j + 2].textContent,
                  kab: tds[j + 3].textContent,
                }
                var findedLesson = this.lessons.find(les => (les.day == lesson.day && les.time == lesson.time && les.kab == lesson.kab))
                if (!findedLesson) {
                  lesson._rowVariant = this.lessonInDaysStatus(lesson)
                  this.lessons.push(lesson)
                }
                else findedLesson.groups = Array.prototype.concat(findedLesson.groups, lesson.groups)
              }
              j += 3
            }
            j++
          }

        }

        this.html = ""

      }, 300);
    },
    lessonInDaysStatus(lesson){
      var day = this.days.find(d=>(d.day == lesson.day))
      if (!day) return 'warning' // рассматриваемое занятие не занесено в БД (свободно или еще не загружено)
      var les = day.lessons.find(l=>(l.time == lesson.time))
      if (!les) return 'warning' // рассматриваемое занятие не занесено в БД (свободно или еще не загружено)
      if (les.predm == '') return '' // рассматриваемое занятие свободно
      if (les.predm != lesson.predm) return 'danger' // рассматриваемое занятие уже занято
      return 'success' // рассматриваемое занятие уже добавлено
    },
    exportLessons() {
      this.$emit('export-lessons', this.selected)
    }
  },
  mounted() {
    this.currentYear = new Date().getFullYear()
  }
}
</script>
