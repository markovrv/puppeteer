<template>
  <div id="app" class="container container-main">
    <my-nav-bar :login="login" :iss="issWorking" :show-copies="showCopies" v-model="remember" :login-error-message="loginErrorMessage" @show-copies-click="showCopiesClick" @iss-click="winLoaderShow" @logout="logout" @save-settings="saveSettings" @get-iss-works="getIssWorks" @add-self-lesson="()=>{this.$bvModal.show('selfleswin')}"></my-nav-bar>
    <rasp-loading-show :loading="loading" :message="winStud.message"></rasp-loading-show>
    <st-rasp-win :win-stud="winStud" @get-st-rasp="({group, date})=>{getStRasp(group, date)}"></st-rasp-win>
    <kab-win :win-kab="winKab" @set-day="day=>{winKab.current.cDay = day}"  @set-kab="kab=>{winKab.current.kab = kab}" @set-corp="corp=>{getKab(winKab.day, corp)}" @change-kab!="changeKab" @change-kab-cancel!="changeKabCancel"></kab-win>
    <log-win :win-log="winLog"></log-win>
    <sync-win :win-sync="winSync" @lesson-select="winSyncLessonClick"></sync-win>
    <self-les-win :days="days" @lesson-add="addSelfLesson" @lesson-add-multi="lessonAddMulti"></self-les-win>
    <loader-win :messages="messages"></loader-win>

    <lesson-copy-block :clipboard="clipboard" :copy-count="copyCount" @exit="raspSeartchMode = false; clipboard = {}; loadData()" v-if="raspSeartchMode"></lesson-copy-block>

    <div v-for="(day, idd) in days" :key="idd" v-show="!loading">

      <day-name :id="idd" :name="day.day" @btn-click="sendDayWork(idd)"></day-name>
      <div v-for="(lesson, idl) in day.lessons" :key="idl" class="lesson" :class="((lesson.stkab)?'besy':((lesson.predm=='')?'free':''))" v-show="(lesson.predm!='' && (!lesson.copied || (lesson.copied && showCopies))) || raspSeartchMode">

        <lesson-menu 
          v-if="!raspSeartchMode"
          :id="{idd, idl}" 
          :lesson="lesson" 
          @close="closeMenus(lesson)" 
          @kab-click="getKab(day.day, lesson.kab, lesson, idl); lesson.showmenu = false;"
          @strasp-click="getStRasp(lesson.groups[0], dateFormat(day.day)); lesson.showmenu = false;"
          @work-click="sendOneWork(idd, idl); lesson.showmenu = false;" 
          @copy-click!="getStRaspAll(lesson, idd); lesson.showmenu = false; copyCount = 0;" 
          @del-click="delLesson(lesson, day.day, idd, idl); lesson.showmenu = false;"
        ></lesson-menu>

        <div class="stkab">{{(lesson.stkab[1] == 'a')?'Teams':lesson.stkab}}</div>

        <lesson-name :lesson="lesson" @click="()=>{}"></lesson-name>
        <lesson-content :lesson="lesson" @kab-click="getKab(day.day, lesson.kab, lesson, idl);" @set-win-log="log=>{winLog.log = log}"></lesson-content>
        
        <div v-if="lesson.predm=='' && raspSeartchMode" style="width: fit-content; position: relative; margin: auto;height: 0;top: -11px;">
          <!-- <b-button title="??????????????????, ?????? ??????????????" variant="success"  size="sm"  @click!="copyToLesson(lesson, day.day, idl, true)">
            ???????????????????? ????????
          </b-button>&nbsp;
          <b-button title="????????????????????. ?????????????????????? ???????????????? ?????????????????? ?? ?? ????" variant="success"  size="sm"  @click!="copyToLesson(lesson, day.day, idl, false)">
            ?????????????????? ????????
          </b-button> -->
        </div>

      </div>
      <hr>
    </div>
  </div>
</template>

<script>

const PATH = process.env.VUE_APP_PATH;

import lessonName from './components/content/lessonName.vue'
import lessonContent from './components/content/lessonContent.vue'
import lessonMenu from './components/content/lessonMenu.vue'
import lessonCopyBlock from './components/content/lessonCopyBlock.vue'
import {lessonCopyMixin} from './mixins/lessonCopyMixin'
import {interfaceMixin} from './mixins/interfaceMixin'
import {issMixin} from './mixins/issMixin'
import {kabMixin} from './mixins/kabMixin'
import {stRaspMixin} from './mixins/stRaspMixin'
import dayName from './components/content/dayName.vue'
import myNavBar from './components/interface/myNavBar.vue'
import raspLoadingShow from './components/interface/raspLoadingShow.vue'
import stRaspWin from './components/windows/stRaspWin.vue'
import kabWin from './components/windows/kabWin.vue'
import logWin from './components/windows/logWin.vue'
import syncWin from './components/windows/syncWin.vue'
import loaderWin from './components/windows/loaderWin.vue'
import selfLesWin from './components/windows/selfLesWin.vue'

export default {
  name: 'App',
  mixins: [
    lessonCopyMixin,
    interfaceMixin,
    issMixin,
    kabMixin,
    stRaspMixin,
  ],
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
    syncWin,
    logWin,
    loaderWin,
    selfLesWin,
  },
  data: () => {
    return {
      days: [],
    }
  },
  methods: {
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
        var now = this.today()
        days.forEach((day, id) => {
            if (day.day == now)scrollToLesson(id)
          })
        this.days = days
      } else this.loading = true
      this.$pusher.unsubscribe(this.login)
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

          var now = this.today()
          response.data.forEach((day, id) => {
            day.lessons.forEach(l=>{
                l.status = ''
                l.showmenu = false
                if(!('copied' in l)) l.copied = false
                l.unsaved = false
                l.stkab = ''
              })
            if (!localStorage.dump && day.day == now) scrollToLesson(id)
          })

          localStorage.dump = JSON.stringify(response.data)

          this.days = response.data

        })
        .catch(({response}) => { 
          this.loading = false
          this.logout()
          this.loginErrorMessage = response.data.error
        })
    },
  },
  mounted() {
    this.loadData()
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
  max-height: 350px !important;
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
