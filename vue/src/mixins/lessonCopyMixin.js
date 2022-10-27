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
            if(!lesson.copied) this.days[idd].lessons[idl].deleted = true;
            this.days[idd].lessons[idl].predm = '';
            this.days[idd].lessons[idl].type = '';
            this.days[idd].lessons[idl].groups = [];
            this.days[idd].lessons[idl].kab = '';
            this.days[idd].lessons[idl].copied = false;
            this.days[idd].lessons[idl].unsaved = false;
            this.days[idd].lessons[idl].message = '';
            if(this.raspSeartchMode)this.copyCount--;
            localStorage.dump = JSON.stringify(this.days)
          }).catch ((e)=>{console.log(e?.message)})
        },
    }
}