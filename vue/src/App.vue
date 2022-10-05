<template>
  <div id="app" class="container" style="padding-top: 65px; overflow-x: clip;">

    <b-navbar :toggleable="false" type="white" variant="light">
      <div class="container">
        <b-navbar-brand href="/">Расписание ВятГУ</b-navbar-brand>
        <b-collapse id="nav-collapse" is-nav style="justify-content: right;">
          <b-navbar-nav class="ml-auto">
            <b-nav-item-dropdown right v-if="!login" id="loginmenu">
              <template #button-content>Войти</template>
              <b-dropdown-form style="min-width: 200px">
                <b-dropdown-header id="dropdown-header-label">
                  <center>Введите Ваши логин и пароль<br>от личного кабинета ВятГУ</center>
                </b-dropdown-header>
                <b-form-group label="Логин" label-for="dropdown-form-login" @submit.stop.prevent>
                  <b-form-input
                    id="dropdown-form-login"
                    size="sm"
                    placeholder="usrxxxxx"
                  ></b-form-input>
                </b-form-group>
                <b-form-group label="Пароль" label-for="dropdown-form-password">
                  <b-form-input
                    id="dropdown-form-password"
                    type="password"
                    size="sm"
                  ></b-form-input>
                </b-form-group>
                <b-form-checkbox class="mb-3" v-model="remember"> - запомнить меня</b-form-checkbox>
                <b-button variant="primary" size="sm" @click="saveSettings" block style="width: 100%">Войти</b-button>
              </b-dropdown-form>
            </b-nav-item-dropdown>
            <b-nav-item-dropdown right v-else>
              <template #button-content>{{login}}</template>
              <b-dropdown-item href="https://disk.yandex.ru/d/sN2Iaazo3XsBag">Андроид-приложение</b-dropdown-item>
              <b-dropdown-item href="#" @click="logout">Выйти</b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>
        </b-collapse>
      </div>
    </b-navbar>

    <center v-if="loading">
      <br><br>
      <b-spinner label=""></b-spinner>
      <h3>Загрузка расписания...</h3>
      <a href="https://new.vyatsu.ru/account/obr/rasp/">new.vyatsu.ru</a>
      <span style="font-size: 80%; color: rgb(90, 90, 90);"> | </span>
      <a href="https://rasp.markovrv.ru/">rasp.markovrv.ru</a><br>
      <img class="adsdesktop" src="./assets/qr-code.gif" width="148" height="148" border="0" title="Приложение для Андроид">
      <a href="https://disk.yandex.ru/d/sN2Iaazo3XsBag">Приложение для Андроид</a>
    </center>

    <b-modal id="straspwin" title="Расписание студентов" @ok="winStudHide" :ok-only="true">
      <b-overlay :show="winStud.loading" rounded="sm">
        <p v-html="winStud.rasp"></p>
        <div>
          <button v-for="(date, idd) in winStud.dates" :key="idd" type="button" class="btn btn-link" @click="getStRasp(winStud.group, date)">{{ date }}</button>
        </div>
      </b-overlay>
    </b-modal>

    <b-modal id="kabraspwin" :title="'Занятость аудиторий ' + ((winKab.kabs[winKab.current.kab]?.split('-')[0])?(winKab.kabs[winKab.current.kab]?.split('-')[0] + ' корпуса'):'')" @click="winKabHide" :ok-only="true">
      <b-overlay :show="winKab.loading" rounded="sm">
        <div class="row" v-if="!winKab.loading">
          <b-dropdown
          class="btn-group col-6" 
          id="kablist" 
          :text="winKab.kabs[winKab.current.kab]" 
          variant="primary" 
          @click="scrollKab(winKab.current.kab)"
          menu-class="w-100">
            <b-dropdown-item 
              :id="`kab_${idk}`" 
              @click="winKab.current.kab = idk" 
              v-for="(kab, idk) in winKab.kabs" 
              :key="idk" 
              :active="winKab.current.kab == idk"
            >{{kab}}</b-dropdown-item>
          </b-dropdown>
          <b-dropdown
          class="btn-group col-6" 
          id="datlist"
          :text="winKab.dates[winKab.current.cDay]" 
          variant="primary"
          menu-class="w-100"
          right >
            <b-dropdown-item
            :id="`dat_${idd}`" 
            @click="winKab.current.cDay = idd" 
            v-for="(date, idd) in winKab.dates" 
            :key="idd" 
            :active="winKab.current.cDay == idd"
            >{{date}}</b-dropdown-item>
          </b-dropdown>
          <div v-if="winKab.rasp.length * winKab.kabs.length * winKab.dates.length" style="margin-top:12px" class="col-12">
            <table class="b-table table table-bordered table-striped bv-docs-table">
              <tr v-for="(lsn, idl) in winKab.rasp[winKab.current.kab].data[winKab.current.cDay].lessons" :key="idl">
                <th scope="col" style="padding: 10px"><small>{{idl+1}}</small></th>
                <td><small>{{(lsn)?lsn:'Свободно'}}</small></td>
              </tr>
            </table>
          </div>
        </div>
        <div v-else><br><br><br><br><br><br><br><br><br></div>
      </b-overlay>
    </b-modal>

    <b-modal id="logwin" title="Журнал нагрузки" @click="winLogHide" :ok-only="true">
      <table class="table">
        <tr>
          <th scope="col">Дата</th>
          <th scope="col">Кол-во</th>
          <th scope="col">Кабинет</th>
        </tr>
        <tr v-for="(item, id) in winLog.log" :key="id" class="small">
          <th scope="row">{{item[0]}}</th>
          <td>{{item[1]}} ч.</td>
          <td>{{item[2]}}</td>
        </tr>
      </table>
    </b-modal>

    <b-modal id="loaderwin" title="Лог загрузки" @click="winLoaderHide" :ok-only="true">
      <div id="my-event" class="modal-body" style="height: 300px; overflow-y: scroll;background: black;color: white;font-family: monospace;font-weight: bold; margin: -16px;">
          <div v-for="(item, id) in messages" :key="id" class="small">
            > <span :style="'color: ' + item.color">{{item.message}}</span>
          </div>
          <span  class="small" v-if="messages.findIndex(m=>(m.message == 'Конец обработки')) == -1">> _ </span><br><br>
      </div>
    </b-modal>

    <div v-for="(day, idd) in days" :key="idd">

      <!-- День -->
      <a :name="idd" style="width: 0px; height: 0px; overflow: hidden; display: block; position: relative; top: -70px;">.</a>
      <b style="font-size: 120%;">{{day.day}}</b> 
      <a class="btn btn-link btn-sm" :id="'daytoissid_'+idd" style="display: block; float: right;" href="javascript://" @click="sendDayWork(idd, 'daytoissid_'+idd)">День в журнал</a>

      <div v-for="(lesson, idl) in day.lessons" :key="idl" class="lesson">

        <!-- Кнопки -->
        <div class="lessonmenu" :class="(lesson.showmenu)?'showbuttons':'closebuttons'">
          <b-button-group size="sm" class="shadow-sm" style="border: 1px solid #d3d4d5;">
            <b-button variant="light" title="меню" style="width: 30px; height: 34.5px; border-right: 2px solid #d3d4d5;" @click="closeMenus(lesson)">{{(lesson.showmenu)?'&raquo;':'&laquo;'}}</b-button> 
            <b-button variant="light" title="Загрузить занятость аудиторий" @click="getKab(day.day, lesson.kab);lesson.showmenu = false;"><img style="width: 24px;" src="./assets/home.svg"></b-button> 
            <b-button variant="light" title="Загрузить расписание группы студентов" @click="getStRasp(lesson.groups[0], dateFormat(day.day));lesson.showmenu = false;"><img style="width: 24px;" src="./assets/student.svg"></b-button> 
            <b-button variant="light" title="Отметить нагрузку в Журнале преподавателя" :id="`lessontoissid_${idd}_${idl}`" @click="sendOneWork(idd, idl, `lessontoissid_${idd}_${idl}`);lesson.showmenu = false;"><img style="width: 24px;" src="./assets/journal.svg"></b-button> 
          </b-button-group>
        </div>

        <!-- Название -->
        <div style="padding-right: 32px"><b>{{lesson.time}}</b> {{lesson.predm}}</div>

        <!-- Содержание -->
        <div style="padding-left: 6px;">
          <span style="font-size: 80%;">
            <span style="font-weight: bold;" v-html="lesson.kab"></span>
            {{lesson.type}} 
            {{lesson.groups.join(", ")}}
            <span @click="winLogShow(lesson.log)" :style="'color: '+ lesson.color +'; '+((lesson.log)?'text-decoration: underline; cursor: pointer;':'')" v-html="lesson.status"></span>
          </span>
        </div>

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

export default {
  name: 'App',
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
    closeMenus(lesson) {
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
        this.messages.push(JSON.parse(JSON.stringify(data)));
        var objDiv = document.getElementById("my-event");
        objDiv.scrollTop = objDiv.scrollHeight + 100;
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
    sendOneWork(idd, idl, sender) {
      this.sendCommand([this.createData(idd, idl)], sender)
    },
    sendDayWork(idd, sender) {
      var data = []
      var lessonsCount = this.days[idd].lessons.length
      for(let idl = 0; idl < lessonsCount; idl++) {
        data.push(this.createData(idd, idl))
      }
      this.sendCommand(data, sender)
    },
    winLogShow(log){
      if(log){
        this.winLog.log = log;
        this.$bvModal.show('logwin')

      }
    },
    winLoaderShow(){
        if(window.winLoaderTimer) clearTimeout(window.winLoaderTimer);
        this.messages = []
        this.$bvModal.show('loaderwin')

    },
    winLogHide(){
        this.winLog.log = [];
        this.$bvModal.hide('logwin')

    },
    winLoaderHide(){
        this.messages = [];
        this.$bvModal.hide('loaderwin')

    },
    winKabHide(){
        this.$bvModal.hide('kabraspwin')
    },
    winStudHide(){
        this.$bvModal.hide('straspwin')
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
      console.log("Запрос расписания ", group);
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
          console.log(response.data)
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

svg {
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.navbar {
  margin: 0px 0px 16px!important;
  position: fixed!important;
  top: 0px!important;
  left: 0px!important;
  width: 100%!important;
  z-index: 1000!important;
  backdrop-filter: blur(1rem)!important;
  box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 5%), inset 0 -1px 0 rgb(0 0 0 / 15%)!important;
  background-color: rgba(255,255,255,0.75)!important;
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

.lessonmenu {
  position: relative;
  right: 0;
  top: 10px;
  margin: 0 0 0 auto;
  width: fit-content;
  height: 0;
}

.adsdesktop {
  display: block;
}

.dropdown-menu-right {
  right: 0;
}

.showbuttons {
  transition: 0.5s;
  right: 8px !important;
}
.closebuttons {
  transition: 0.5s;
  right: -126px !important;
}

@media (max-width: 768px) {
  .adsdesktop {
    display: none;
  }
  .lesson {
    margin-right: 0px;
  }
  .closebuttons {
    right: -137px !important;
  }
}
</style>
