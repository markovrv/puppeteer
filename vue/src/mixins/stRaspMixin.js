const PATH = process.env.VUE_APP_PATH;

export const stRaspMixin = {
  data: () => {
    return {
      winStud: {
        rasp: "<br><br><br><br><br><br><br><br><br>",
        dates: [],
        loading: true,
        message: 'Пожалуйста, подождите...'
      },
    }
  },
    methods: {
      async getStRasp(group, date) {
        this.winStud.loading = true
        this.winStud.message = 'Пожалуйста, подождите...'
        this.$bvModal.show('straspwin')
        this.axios({
          method: 'post',
          url: PATH + '/api/stud',
          timeout: 60000,
          data: {
            groups: [group],
            date,
            auth: {login: this.login}
          }
        }).then(response => {
            this.winStud.rasp = response.data[0].rasp
            this.winStud.dates = response.data[0].dates
            this.winStud.group = response.data[0].group
            this.winStud.loading = false
        }).catch(console.log)
      },
      async getStRaspAll(lesson, dayid) {
        var groups = lesson.groups
        this.loading = true
        this.winStud.message = 'Пожалуйста, подождите...'
  
        var scrollToLesson = (id) => {
          setTimeout(() => { 
              window.location.href = "#"+id; 
            }, 300);
        }
  
        this.axios({
          method: 'post',
          url: PATH + '/api/stud',
          timeout: 30000,
          data: {
            groups,
            date: '',
            auth: {login: this.login}
          }
        }).then(response => {
            this.clipboard = lesson
            this.days.forEach((day) => {
              day.lessons.forEach(less=>{
                less.stkab = ''
                response.data.forEach(stgr=>{
                  var stday = stgr.content.find(d=>d.date == day.day)
                  if(stday){
                    var stles = stday.lessons.find(l=>l.time == less.time)
                    if (stles) {
                      less.stkab += `${stles.kab} `
                    }
                  }
                })
              })
            })
            scrollToLesson(dayid)
            this.loading = false
            this.raspSeartchMode = true
        }).catch(error=>{
          console.log(error)
          this.loading = false
        })
      },
    }
}