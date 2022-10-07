<template>
  <div id="app" class="container container-main">
    <my-nav-bar :login="login" v-model="remember" @logout="logout" @save-settings="saveSettings"></my-nav-bar>
    <rasp-loading-show :loading="loading"></rasp-loading-show>
    <st-rasp-win :win-stud="winStud" @get-st-rasp="({group, date})=>{getStRasp(group, date)}"></st-rasp-win>
    <kab-win :win-kab="winKab" @set-day="day=>{winKab.current.cDay = day}" @set-kab="kab=>{winKab.current.kab = kab}"></kab-win>
    <log-win :win-log="winLog"></log-win>
    <loader-win :messages="messages"></loader-win>

    <div v-for="(day, idd) in days" :key="idd">

      <day-name :id="idd" :name="day.day" @btn-click="sendDayWork(idd)"></day-name>
      <div v-for="(lesson, idl) in day.lessons" :key="idl" class="lesson" v-show="lesson.predm!=''">

        <lesson-menu 
          :id="{idd, idl}" 
          :lesson="lesson" 
          @close="closeMenus(lesson)" 
          @kab-click="getKab(day.day, lesson.kab); lesson.showmenu = false;"
          @strasp-click="getStRasp(lesson.groups[0], dateFormat(day.day)); lesson.showmenu = false;"
          @work-click="sendOneWork(idd, idl); lesson.showmenu = false;" 
        ></lesson-menu>

        <lesson-name :lesson="lesson"></lesson-name>
        <lesson-content :lesson="lesson" @set-win-log="log=>{winLog.log = log}"></lesson-content>

      </div>
      <hr>
    </div>

  </div>
</template>

<script>

function today() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yy = today.getYear() - 100;

  return dd + '.' + mm + '.' + yy;
}

// const PATH = "http://localhost:3333";
const PATH = "";

import lessonName from './components/content/lessonName.vue'
import lessonContent from './components/content/lessonContent.vue'
import lessonMenu from './components/content/lessonMenu.vue'
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
        }
      },
      messages: [],
      remember: false
    }
  },
  methods: {
    closeMenus(lesson = {showmenu: false}) {
      var state = lesson.showmenu
      if(this.lastmenu) this.lastmenu.showmenu = false
      lesson.showmenu = !state
      this.lastmenu = lesson
    },
    async saveSettings() {

      this.axios.post(PATH + '/api/encrypt/', {
        text: document.getElementById('dropdown-form-password').value
      })
        .then(response => {
          this.login = document.getElementById('dropdown-form-login').value
          this.passwordAES = JSON.stringify(response.data)
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
    logout() {
      this.$pusher.unsubscribe(this.login)
      this.login = ''
      this.passwordAES = ''
      localStorage.login = ''
      localStorage.passwordAES = ''
      localStorage.dump = ''
      localStorage.remember = ''
      
      setTimeout(() => { 
        this.loadData()
      }, 300);
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

      if(localStorage.dump) {
        var days = JSON.parse(localStorage.dump)
        var now = today()
        days.forEach((day, id) => {
            if (day.day.indexOf(now) >= 0){
              setTimeout(() => { 
                window.location.href = "#"+id; 
              }, 300);
            }
          })
        this.days = days
      } else this.loading = true

      var channel = this.$pusher.subscribe(this.login);
      channel.bind('my-event', data=>{
        this.messages.push(data);
        var objDiv = document.getElementById("my-event");
        objDiv.scrollTop = objDiv?.scrollHeight + 100;
      });

      this.axios.post(PATH + '/api/rasp', {
        login: this.login,
        passwordAES: this.passwordAES
      })
        .then(response => {
          this.loading = false

          var now = today()
          response.data.forEach((day, id) => {
            day.lessons.forEach(l=>{l.showmenu = false})
            if (!localStorage.dump && day.day.indexOf(now) >= 0)
              setTimeout(() => { 
                window.location.href = "#"+id; 
              }, 300);
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
        this.messages = []
        this.$bvModal.show('loaderwin')

    },
    createData(idd, idl) {
      var lesTypes = ["Лекция", "Практическое занятие", "Лабораторная работа","","","","","","","Консультация","Экзамен","Зачет"]
      var day = this.days[idd].day
      var lesson = this.days[idd].lessons[idl]
      const times = ["8:20-9:50", "10:00-11:30", "11:45-13:15", "14:00-15:30", "15:45-17:15", "17:20-18:50", "18:55-20:25"]
      lesson.status = "Передача данных...";
      lesson.color = "";
      lesson.log = null;
      return {
        name: lesson.predm,
        date: (day.split(' ')[1]).replace('.22', '.2022'),
        time: times.indexOf(lesson.time)+1,
        groups: lesson.groups.sort().join(", ").replace(',подгруппа1', ', 1 подгруппа').replace(',подгруппа2', ', 2 подгруппа'),
        cat: lesTypes.indexOf(lesson.type),
        kab: lesson.kab.replace('<a href="', '').replace('" target="_blank">Занятие удаленно в Teams</a>', ''),
        count: 2,
        id: [idd, idl]
      }
    },
    dateFormat(date) {
      var datArr = date.split(" ")
      return `${datArr[1].slice(0,-3)} ${datArr[0]}`
    },
    async getStRasp(group, date) {
      // console.log("Запрос расписания ", group);
      this.winStud.loading = true
      this.$bvModal.show('straspwin')
      this.axios({
        method: 'post',
        url: PATH + '/api/stud',
        timeout: 20000,
        data: {
          group,
          date
        }
      }).then(response => {
          // console.log(response.data)
          this.winStud.rasp = response.data.rasp
          this.winStud.dates = response.data.dates
          this.winStud.group = response.data.group
          this.winStud.loading = false
      }).catch(console.log)
    },
    async sendCommand(data, sender) {
      var content = {
        data,
        auth: {
          login: this.login,
          passwordAES: this.passwordAES
        }
      }

      this.winLoaderShow()
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
            
            document.getElementById(sender).classList.remove("disabled");
          });
        }).catch(()=>{
          document.getElementById(sender).classList.remove("disabled");
        })
    },
    async getKab(day, kab) {
      if (kab.length > 10) return null
      var cDay = (day.split(' ')[1]).replace('.22', '2022').replace('.', '')
      this.winKab.loading = true
      this.$bvModal.show('kabraspwin')
      this.axios.get(`https://e.markovrv.ru/api/v2/kabs.php?day=${cDay}&corp=${kab.split('-')[0]}`)
        .then(response => {
          this.winKab.kabs  = response.data.kabs
          this.winKab.dates = response.data.dates
          this.winKab.rasp  = response.data.rasp
          this.winKab.current.kab  = response.data.kabs.findIndex(el=>(el == kab))
          this.winKab.current.cDay = response.data.dates.findIndex(el=>(el.split(" ")[1] == day.split(" ")[1]))
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
        })
    },
  },
  mounted() {
    this.loadData()
    localStorage.password = '' // затираем пароль от прошлой версии программы
  }
}
</script>

<style>

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
  border-radius: 8px;
  transition: 0.5s;
}

.lesson:hover {
  background: rgba(0,0,0,.05);
}

</style>
