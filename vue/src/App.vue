<template>
  <div id="app" class="container container-main">
    <my-nav-bar :login="login" :iss="issWorking" v-model="remember" @iss-click="winLoaderShow" @logout="logout" @save-settings="saveSettings"></my-nav-bar>
    <rasp-loading-show :loading="loading" :message="winStud.message"></rasp-loading-show>
    <st-rasp-win :win-stud="winStud" @get-st-rasp="({group, date})=>{getStRasp(group, date)}"></st-rasp-win>
    <kab-win :win-kab="winKab" @set-day="day=>{winKab.current.cDay = day}"  @set-kab="kab=>{winKab.current.kab = kab}" @change-kab="changeKab" @change-kab-cancel="changeKabCancel"></kab-win>
    <log-win :win-log="winLog"></log-win>
    <loader-win :messages="messages"></loader-win>

    <lesson-copy-block :clipboard="clipboard" :copy-count="copyCount" @exit="raspSeartchMode = false; clipboard = {}; loadData()" v-if="raspSeartchMode"></lesson-copy-block>

    <div v-for="(day, idd) in days" :key="idd" v-show="!loading">

      <day-name :id="idd" :name="day.day" @btn-click="sendDayWork(idd)"></day-name>
      <div v-for="(lesson, idl) in day.lessons" :key="idl" class="lesson" :class="((lesson.stkab)?'besy':((lesson.predm=='')?'free':''))" v-show="lesson.predm!='' || raspSeartchMode">

        <lesson-menu 
          v-if="!raspSeartchMode"
          :id="{idd, idl}" 
          :lesson="lesson" 
          @close="closeMenus(lesson)" 
          @kab-click="getKab(day.day, lesson.kab, lesson, idl); lesson.showmenu = false;"
          @strasp-click="getStRasp(lesson.groups[0], dateFormat(day.day)); lesson.showmenu = false;"
          @work-click="sendOneWork(idd, idl); lesson.showmenu = false;" 
          @copy-click="getStRaspAll(lesson, idd); lesson.showmenu = false; copyCount = 0;" 
        ></lesson-menu>

        <div class="stkab">{{(lesson.stkab[1] == 'a')?'Teams':lesson.stkab}}</div>

        <lesson-name :lesson="lesson" @click="()=>{}"></lesson-name>
        <lesson-content :lesson="lesson" @kab-click="getKab(day.day, lesson.kab, lesson, idl);" @set-win-log="log=>{winLog.log = log}" @del-copy="delCopiedLesson(lesson, day.day, idd, idl)"></lesson-content>
        
        <div v-if="lesson.predm=='' && lesson.stkab=='' && raspSeartchMode" style="width: fit-content; position: relative; margin: auto;height: 0;top: -11px;">
          <b-button variant="success"  size="sm"  @click="copyToLesson(lesson, day.day, idl)">
            Доставить здесь
          </b-button>
        </div>

      </div>
      <hr>
    </div>
  </div>
</template>

<script>

function today() {
  var today = new Date();
  var d = String(today.getDate()).padStart(2, '0');
  var m = String(today.getMonth() + 1).padStart(2, '0');
  var y = today.getYear() - 100;
  return `20${y}-${m}-${d}`
}

const PATH = process.env.VUE_APP_PATH;

import lessonName from './components/content/lessonName.vue'
import lessonContent from './components/content/lessonContent.vue'
import lessonMenu from './components/content/lessonMenu.vue'
import lessonCopyBlock from './components/content/lessonCopyBlock.vue'
import dayName from './components/content/dayName.vue'
import myNavBar from './components/interface/myNavBar.vue'
import raspLoadingShow from './components/interface/raspLoadingShow.vue'
import stRaspWin from './components/windows/stRaspWin.vue'
import kabWin from './components/windows/kabWin.vue'
import logWin from './components/windows/logWin.vue'
import loaderWin from './components/windows/loaderWin.vue'

export default {
  name: 'App',
  components: {
    lessonName,
    lessonContent,
    lessonMenu,
    lessonCopyBlock,
    dayName,
    myNavBar,
    raspLoadingShow,
    stRaspWin,
    kabWin,
    logWin,
    loaderWin,
  },
  data: () => {
    return {
      days: [],
      login: "",
      passwordAES: "",
      loading: false,
      winStud: {
        rasp: "<br><br><br><br><br><br><br><br><br>",
        dates: [],
        loading: true,
        message: 'Пожалуйста, подождите...'
      },
      winLog: {
        log: []
      },
      winKab: {
        kabs: [],
        dates: [],
        loading: true,
        rasp: [],
        current: {
          kab: 0,
          cDay: 0,
        },
        lesson: {},
        idl: 0,
        day: ''
      },
      messages: [],
      issWorking: false,
      remember: false,
      raspSeartchMode: false,
      clipboard: {},
      copyCount: 0
    }
  },
  methods: {
    copyToLesson(to, day, idl){
      to.groups = this.clipboard.groups
      this.copyCount++;
      if (this.clipboard.kab[0] == "<") to.kab = this.clipboard.kab
      else {
        to.kab = prompt('Введите номер корпуса', this.clipboard.kab.split('-')[0])+'-___'
        if(to.kab) to.kab = this.clipboard.kab.split('-')[0]+'-___'
      }
      to.predm = this.clipboard.predm
      to.type = this.clipboard.type
      to.copied = true
      to.unsaved = true
      if (to.kab[0] == "<") {
        to.unsaved = false
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
        copied: l.copied
      }
      this.axios.post(PATH + '/api/changekab', {
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
      this.axios.post(PATH + '/api/changekab/cancel', {
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
    async delCopiedLesson(lesson, day, idd, idl){
      this.axios.post(PATH + '/api/copy/del', {
        login: this.login,
        passwordAES: this.passwordAES,
        lesson,
        day,
      }).then(()=>{
        this.days[idd].lessons[idl].predm = '';
        this.days[idd].lessons[idl].type = '';
        this.days[idd].lessons[idl].groups = [];
        this.days[idd].lessons[idl].kab = '';
        this.days[idd].lessons[idl].copied = false;
        this.days[idd].lessons[idl].unsaved = false;
        this.copyCount--;
        localStorage.dump = JSON.stringify(this.days)
      }).catch ((e)=>{console.log(e?.message)})
    },
    closeMenus(lesson = {showmenu: false}) {
      var state = lesson.showmenu
      if(this.lastmenu) this.lastmenu.showmenu = false
      lesson.showmenu = !state
      this.lastmenu = lesson
    },
    async saveSettings() {
      this.axios.post(PATH + '/api/login/', {
        text: document.getElementById('dropdown-form-password').value,
        login: document.getElementById('dropdown-form-login').value
      })
        .then(response => {
          this.login = document.getElementById('dropdown-form-login').value
          this.passwordAES = response.data.encrypted_json_str
          document.querySelector('li[id="loginmenu"] ul').classList.remove('show')

          if (this.remember){
            localStorage.login = this.login
            localStorage.passwordAES = this.passwordAES
            localStorage.dump = ''
            localStorage.remember = "true"
          } else {
            localStorage.login = ''
            localStorage.passwordAES = ''
            localStorage.dump = ''
            localStorage.remember = ''

          }
          this.loadData()
        })
    },
    async logout() {
      var cleardata = () => {
        this.$pusher.unsubscribe(this.login)
        this.login = ''
        this.passwordAES = ''
        this.remember = false
        localStorage.login = ''
        localStorage.passwordAES = ''
        localStorage.dump = ''
        localStorage.remember = ''
        setTimeout(() => { 
          this.loadData()
        }, 300);
      }
      this.axios.post(PATH + '/api/logout/', {
        login: this.login,
        passwordAES: this.passwordAES,
      })
      .then(cleardata)
      .catch(e=>{
        console.log(e)
        cleardata()
      })
    },
    async loadData() {

      if (localStorage.remember == "true"){
        this.login = localStorage.login;
        this.passwordAES = localStorage.passwordAES;
        this.remember = true;
      }

      this.days = []
      if (!this.login) {
        document.querySelector('li[id="loginmenu"] ul').classList.add('show')
        return 0
      }

      var scrollToLesson = (id) => {
        setTimeout(() => { 
            window.location.href = "#"+id; 
          }, 300);
      }

      if(localStorage.dump) {
        var days = JSON.parse(localStorage.dump)
        var now = today()
        days.forEach((day, id) => {
            if (day.day == now)scrollToLesson(id)
          })
        this.days = days
      } else this.loading = true

      var channel = this.$pusher.subscribe(this.login);
      channel.bind('my-event', data=>{
        this.messages.push(data);
        this.winStud.message = data.message
        var objDiv = document.getElementById("my-event");
        if(objDiv) objDiv.scrollTop = objDiv?.scrollHeight + 100;
      });

      this.axios.post(PATH + '/api/rasp', {
        login: this.login,
        passwordAES: this.passwordAES
      })
        .then(response => {
          this.loading = false

          var now = today()
          response.data.forEach((day, id) => {
            day.lessons.forEach(l=>{
                l.showmenu = false
                l.copied = ('copied' in l)?l.copied:false
                l.unsaved = false
                l.stkab = ''
              })
            if (!localStorage.dump && day.day == now) scrollToLesson(id)
          })

          localStorage.dump = JSON.stringify(response.data)

          this.days = response.data

        })
    },
    sendOneWork(idd, idl) {
      this.sendCommand([this.createData(idd, idl)], `lessontoissid_${idd}_${idl}`)
    },
    sendDayWork(idd) {
      var data = []
      var sender = 'daytoissid_'+idd
      var lessonsCount = this.days[idd].lessons.length
      for(let idl = 0; idl < lessonsCount; idl++) {
        if(this.days[idd].lessons[idl].predm!='') data.push(this.createData(idd, idl))
      }
      this.sendCommand(data, sender)
    },
    winLoaderShow(){
        this.$bvModal.show('loaderwin')
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
        groups: lesson.groups.sort().join(", ").replace(',подгруппа1', ', 1 подгруппа').replace(',подгруппа2', ', 2 подгруппа'),
        cat: lesTypes.indexOf(lesson.type),
        kab: lesson.kab.replace('<a href="', '').replace('" target="_blank">Занятие удаленно в Teams</a>', ''),
        count: 2,
        id: [idd, idl]
      }
    },
    dateFormat(date) {
      var d = date.split('-')
      return `${d[2]}.${d[1]}`
    },
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
    async getKab(day, kab, lesson, idl) {
      if (kab.length > 10) return null
      var strdate = new Date(day).toLocaleDateString()
      var cDay = strdate.replaceAll('.', '')
      this.winKab.loading = true
      this.winKab.lesson = lesson
      this.winKab.idl = idl
      this.winKab.day = day
      this.$bvModal.show('kabraspwin')

      var setResp = response => {
          this.winKab.kabs  = response.data.kabs
          this.winKab.dates = response.data.dates
          this.winKab.rasp  = response.data.rasp
          this.winKab.current.kab  = response.data.kabs.findIndex(el=>(el == kab))
          if (this.winKab.current.kab < 0 ) this.winKab.current.kab = 0
          this.winKab.current.cDay = response.data.dates.findIndex(el=>(el.split(" ")[1] == strdate.replace('.20', '.')))
          if (this.winKab.current.cDay < 0 ) this.winKab.current.cDay = 0
          this.winKab.loading = false
          setTimeout(()=>{
            document.querySelector('div[id="kablist"] button').addEventListener('click', ()=>{
              var kab = document.querySelector('div[id="kablist"] button').textContent
              var kid =this.winKab.kabs.findIndex(k=>(k==kab))
              setTimeout(()=>{
                document.querySelector('div[id="kablist"] ul').scrollTop = document.getElementById(`kab_${kid}`).offsetTop-150;
              }, 100);
            })
            document.querySelector('div[id="datlist"] button').addEventListener('click', ()=>{
              var dat = document.querySelector('div[id="datlist"] button').textContent
              var did =this.winKab.dates.findIndex(d=>(d==dat))
              setTimeout(()=>{
                document.querySelector('div[id="datlist"] ul').scrollTop = document.getElementById(`dat_${did}`).offsetTop-150;
              }, 100);
            })
          },100)
        }

      if(sessionStorage['dump_'+kab.split('-')[0]+'_'+cDay]) setResp({data: JSON.parse(sessionStorage['dump_'+kab.split('-')[0]+'_'+cDay])})
      else this.axios.get(`https://e.markovrv.ru/api/v2/kabs.php?day=${cDay}&corp=${kab.split('-')[0]}`).then( resp => {
        sessionStorage['dump_'+kab.split('-')[0]+'_'+cDay] = JSON.stringify(resp.data)
        setResp(resp)
      })
    },
  },
  mounted() {
    this.loadData()
    localStorage.password = '' // затираем пароль от прошлой версии программы
    window.dump = {}
  }
}
</script>

<style>

.stkab {
    position: relative;
    width: fit-content;
    margin: 0 0 0 auto;
    height: 0;
    font-size: small;
    color: red;
    padding: 0px;
}

.dropdown-menu {
  max-height: 300px !important;
  overflow-y: auto !important;
}

.container {
  max-width: 700px !important;
}

.container-main {
  padding-top: 65px !important; 
  overflow-x: clip !important;
}

svg {
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.close {
    float: right;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    color: #000;
    text-shadow: 0 1px 0 #fff;
    opacity: .5;
    background-color: transparent;
    border: 0;
    cursor: pointer;
    padding: 1rem;
    margin: -1rem -1rem -1rem auto;
    font-family: inherit;

}

.lesson {
  padding-left: 6px; 
  padding-bottom: 12px; 
  margin-right: -11px;
  clear: both;
  border-radius: 0px;
  transition: 0.5s;
  min-height: 60px;
  margin-top: -2px;
}

.besy {
  border: 2px solid red !important;
  background-color: #ed143d2e !important;
}

.free {
  border: 2px solid green !important;
  background-color: #14ed4a2e !important;
}

.current {
  border: 2px solid rgb(119, 128, 0) !important;
  background-color: #ede9142e !important;

  position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: #fff3cd !important;
    z-index: 100;
}

.lesson:hover {
  background: rgba(0,0,0,.05);
}

</style>
