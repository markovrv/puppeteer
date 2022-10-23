const PATH = process.env.VUE_APP_PATH;

export const issMixin = {
  data: () => {
    return {
      winLog: {
        log: []
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
        var lessonsCount = this.days[idd].lessons.length
        var day = this.days[idd]
        for(let idl = 0; idl < lessonsCount; idl++) {
          var lesson = day.lessons[idl]
          if((lesson.predm!='' && (!lesson.copied || (lesson.copied && this.showCopies))) || this.raspSeartchMode) data.push(this.createData(idd, idl))
        }
        this.sendCommand(data, sender)
      },
      createData(idd, idl) {
        var lesTypes = ["Лекция", "Практическое занятие", "Лабораторная работа","","","","","","","Консультация","Экзамен","Зачет"]
        var date = new Date(this.days[idd].day).toLocaleDateString()
        var lesson = this.days[idd].lessons[idl]
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
          id: [idd, idl]
        }
      },
      async sendCommand(data, sender) {
        var content = {
          data,
          auth: {
            login: this.login,
            passwordAES: this.passwordAES
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
              this.days[item.id[0]].lessons[item.id[1]].status = item.status
              this.days[item.id[0]].lessons[item.id[1]].color = item.color
              this.days[item.id[0]].lessons[item.id[1]].log = (item.log)?item.log:null
              this.issWorking = false
              document.getElementById(sender).classList.remove("disabled");
            });
          }).catch(()=>{
            document.getElementById(sender).classList.remove("disabled");
          })
      },
    }
}