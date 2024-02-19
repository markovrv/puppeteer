const PATH = process.env.VUE_APP_PATH;
const times = ["8:20-9:50", "10:00-11:30", "11:45-13:15", "14:00-15:30", "15:45-17:15", "17:20-18:50", "18:55-20:25"]
class Lesson {
  constructor(time, predm = '', type = '', kab = '', groups = []){
      this.time = time
      this.predm = predm
      this.type = type
      this.kab = kab
      this.groups = groups
  }
}

function lesType(type) {
  if (type == 0) return 'Лекция'
  if (type == 1) return 'Практическое занятие'
  if (type == 2) return 'Лабораторная работа'
}
function dayconvert(day) {
  return day.split('.').reverse().join('-')
}
function timeconvert(time, step = 0) {
  var now = time.slice(0, -3)
  var id = times.findIndex(time => (time.indexOf(now) >= 0))
  return times[id + step]
}
function groupsConvert(str) {
  var groups = str.replaceAll(', 1', '. 1').replaceAll(', 2', '. 2').replaceAll(', 3', '. 3').replaceAll(', 4', '. 4').split(', ')
  groups.forEach((group, id) => {
    groups[id] = group.replace('. 1', ', 1').replace('. 2', ', 2').replace('. 3', ', 3').replace('. 4', ', 4')
  })
  return groups
}

export const issMixin = {
  data: () => {
    return {
      winLog: {
        log: []
      },
      winSync: {
        data: []
      },
      messages: [],
      issWorking: false,
    }
  },
    methods: {
      sendOneWork(idd, idl) {
        this.sendCommand([this.createData(idd, idl)], `lessontoissid_${idd}_${idl}`)
      },
      sendDayWork(idd) {
        var data = []
        var sender = 'daytoissid_'+idd
        var lessonsCount = this.filteredDays[idd].lessons.length
        var day = this.filteredDays[idd]
        for(let idl = 0; idl < lessonsCount; idl++) {
          var lesson = day.lessons[idl]
          if((lesson.predm!='' && (!lesson.copied || (lesson.copied && this.showCopies))) || this.raspSeartchMode) data.push(this.createData(idd, idl))
        }
        this.sendCommand(data, sender)
      },
      createData(idd, idl) {
        var lesTypes = ["Лекция", "Практическое занятие", "Лабораторная работа","","","","","","","Консультация","Экзамен","Зачет"]
        var date = new Date(this.filteredDays[idd].day).toLocaleDateString()
        var lesson = this.filteredDays[idd].lessons[idl]
        const times = ["8:20-9:50", "10:00-11:30", "11:45-13:15", "14:00-15:30", "15:45-17:15", "17:20-18:50", "18:55-20:25"]
        lesson.status = "Передача данных...";
        lesson.color = "";
        lesson.log = null;
        return {
          name: lesson.predm,
          date: date,
          time: times.indexOf(lesson.time)+1,
          groups: lesson.groups.sort().join(", ").replace(', подгруппа 1', ', 1 подгруппа').replace(', подгруппа 2', ', 2 подгруппа'),
          cat: lesTypes.indexOf(lesson.type),
          kab: lesson.kab.replace('<a href="', '').replace('" target="_blank">Занятие удаленно в Teams</a>', ''),
          count: 2,
          i: lesson.i, // номер работы в таблице исс, если известно
          id: [idd, idl],
          _id: lesson._id // номер занятия в БД (для установки галочки "Добавлено в ИСС")
        }
      },
      async sendCommand(data, sender) {
        var content = {
          data,
          auth: {
            login: this.login,
            passwordAES: this.passwordAES,
            semester: this.selectedSemester
          }
        }
        this.issWorking = true
        document.getElementById(sender).classList.add("disabled");
        this.axios({
          method: 'post',
          url: PATH + '/api/iss',
          timeout: 60000,
          data: content
        }).then(response => {
            response.data.forEach(item => {
              this.filteredDays[item.id[0]].lessons[item.id[1]].status = item.status
              this.filteredDays[item.id[0]].lessons[item.id[1]].color = item.color
              this.filteredDays[item.id[0]].lessons[item.id[1]].log = (item.log)?item.log:null
              this.filteredDays[item.id[0]].lessons[item.id[1]].in_iss = (item.color != "red")?1:0
              this.filteredDays[item.id[0]].lessons[item.id[1]].variants = (item.variants)?item.variants:undefined
              this.filteredDays[item.id[0]].lessons[item.id[1]].i = undefined
              this.issWorking = false
              document.getElementById(sender).classList.remove("disabled");
            });
          }).catch(()=>{
            document.getElementById(sender).classList.remove("disabled");
          })
      },
      async getIssWorks() {
        var content = {
          auth: {
            login: this.login,
            passwordAES: this.passwordAES,
            semester: this.selectedSemester
          }
        }
        this.issWorking = true
        this.axios({
          method: 'post',
          url: PATH + '/api/iss/worklist',
          timeout: 60000,
          data: content
        }).then(response => {
            this.winSync.data = response.data
            this.$bvModal.show('syncwin')
            this.issWorking = false
          }).catch(err => {
            console.log(err)
          })
      },
      async winSyncLessonClick(data) {
        var content = {
          auth: {
            login: this.login,
            passwordAES: this.passwordAES,
            semester: this.selectedSemester
          },
          data: {
            id: data.id
          }
        }
        this.issWorking = true
        this.axios({
          method: 'post',
          url: PATH + '/api/iss/worklist/lessons',
          timeout: 60000,
          data: content
        }).then(response => {
            var issLessons = []
            response.data.forEach(item => {
              var step = 0
              for(var i = item[1]; i>0; i-=2) {
                issLessons.push({
                  lesson: new Lesson(
                      timeconvert(item[0].split(' ')[1], step), 
                      data.name, 
                      lesType(data.cat), 
                      item[2], 
                      groupsConvert(data.groups)
                    ), 
                  day: dayconvert(item[0].split(' ')[0])
                })
                step++
              }
            })
            console.log(issLessons)
            this.issWorking = false
          }).catch(err => {
            console.log(err)
          })
      },
    }
}