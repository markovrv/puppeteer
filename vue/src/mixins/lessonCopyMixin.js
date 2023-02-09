const PATH = process.env.VUE_APP_PATH;

export const lessonCopyMixin = {
  data: () => {
    return {
      raspSeartchMode: false,
      clipboard: {},
      copyCount: 0
    }
  },
    methods: {
        copyToLesson(to, day, idl, copy){
          to.groups = this.clipboard.groups
          this.copyCount++;
          if (this.clipboard.kab[0] == "<") to.kab = this.clipboard.kab
          else {
            to.kab = this.clipboard.kab.split('-')[0]+'-___'
          }
          to.predm = this.clipboard.predm
          to.type = this.clipboard.type
          to.copied = true
          to.realcopy = copy
          to.unsaved = true
          if (to.kab[0] == "<") {
            this.winKab.day = day
            this.winKab.lesson = to
            this.changeKab(to.kab)
          }
          else this.getKab(day, to.kab, to, idl);
        },
        async lessonAddMulti(lessons){
          this.axios.post(PATH + '/api/db/self/lesson/multi', {
            login: this.login,
            passwordAES: this.passwordAES,
            lessons
          }).then(()=>{
            this.loadData()
            this.$bvModal.msgBoxOk('Выбранные занятия успешно добавлены', {
              title: 'Подтверждение',
              size: 'sm',
              buttonSize: 'sm',
              okVariant: 'success',
              headerClass: 'p-2 border-bottom-0',
              footerClass: 'p-2 border-top-0',
              centered: true
            })
          }).catch ((e)=>{console.log(e?.message)})
        },
        async addSelfLesson(rec){
          var data = {
            groups: [rec.lesson.groups], 
            kab: rec.lesson.kab, 
            predm: rec.lesson.predm, 
            type: rec.lesson.type, 
            time: rec.lesson.time
          }
          this.axios.post(PATH + '/api/db/self/lesson', {
            login: this.login,
            passwordAES: this.passwordAES,
            lesson: data,
            day: rec.day,
          }).then(()=>{
            this.loadData()
            this.$bvModal.msgBoxOk('Занятие успешно добавлено', {
              title: 'Подтверждение',
              size: 'sm',
              buttonSize: 'sm',
              okVariant: 'success',
              headerClass: 'p-2 border-bottom-0',
              footerClass: 'p-2 border-top-0',
              centered: true
            })
          }).catch ((e)=>{console.log(e?.message)})
        },
        async changeKab(kab){
          var l = this.winKab.lesson
          var data = {
            groups: l.groups, 
            kab: l.kab, 
            predm: l.predm, 
            type: l.type, 
            time: l.time, 
            copied: l.copied,
            realcopy: l.realcopy
          }
          this.axios.post(PATH + '/api/db/changekab', {
            login: this.login,
            passwordAES: this.passwordAES,
            lesson: data,
            newkab: kab,
            day: this.winKab.day,
          }).then(()=>{
            if(!this.winKab.lesson.copied) this.winKab.lesson.oldkab = this.winKab.lesson.kab;
            this.winKab.lesson.kab = kab;
            this.winKab.lesson.unsaved = false;
            localStorage.dump = JSON.stringify(this.days)
          }).catch ((e)=>{console.log(e?.message)})
        },
        async changeKabCancel(){
          this.axios.post(PATH + '/api/db/changekab/cancel', {
            login: this.login,
            passwordAES: this.passwordAES,
            lesson: this.winKab.lesson,
            day: this.winKab.day,
          }).then(()=>{
            this.winKab.lesson.kab = this.winKab.lesson.oldkab; 
            delete this.winKab.lesson.oldkab;
            localStorage.dump = JSON.stringify(this.days)
          }).catch ((e)=>{console.log(e?.message)})
        },
        async delLesson(lesson, day, idd, idl){
          var url = '/api/db/del'
          this.axios.post(PATH + url, {
            login: this.login,
            passwordAES: this.passwordAES,
            lesson,
            day,
          }).then(()=>{
            if(!lesson.copied) this.filteredDays[idd].lessons[idl].deleted = true;
            this.filteredDays[idd].lessons[idl].predm = '';
            this.filteredDays[idd].lessons[idl].type = '';
            this.filteredDays[idd].lessons[idl].groups = [];
            this.filteredDays[idd].lessons[idl].kab = '';
            this.filteredDays[idd].lessons[idl].copied = false;
            this.filteredDays[idd].lessons[idl].unsaved = false;
            this.filteredDays[idd].lessons[idl].message = '';
            if(this.raspSeartchMode)this.copyCount--;
            localStorage.dump = JSON.stringify(this.days)
          }).catch ((e)=>{console.log(e?.message)})
        },
    }
}