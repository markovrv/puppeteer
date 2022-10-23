const PATH = process.env.VUE_APP_PATH;

export const interfaceMixin = {
  data: () => {
    return {
      login: "",
      passwordAES: "",
      loading: false,
      remember: false,
      showCopies: false,
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
        this.axios.post(PATH + '/api/lk/login/', {
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
        this.axios.post(PATH + '/api/lk/logout/', {
          login: this.login,
          passwordAES: this.passwordAES,
        })
        .then(cleardata)
        .catch(e=>{
          console.log(e)
          cleardata()
        })
      },
      winLoaderShow(){
        this.$bvModal.show('loaderwin')
      },
      dateFormat(date) {
        var d = date.split('-')
        return `${d[2]}.${d[1]}`
      },
      today() {
        var today = new Date();
        var d = String(today.getDate()).padStart(2, '0');
        var m = String(today.getMonth() + 1).padStart(2, '0');
        var y = today.getYear() - 100;
        return `20${y}-${m}-${d}`
      },
      showCopiesClick(val) {
        this.showCopies = val
        if (val) localStorage.showCopies = 'true'
        else localStorage.showCopies = 'false'
      }
    },
    mounted() {
      if(localStorage.showCopies == 'true') this.showCopies = true
      else this.showCopies = false
    }
}