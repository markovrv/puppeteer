const PATH = process.env.VUE_APP_PATH;

export const kabMixin = {
  data: () => {
    return {
      winKab: {
        kabs: [],
        dates: [],
        types: [],
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
    }
  },
  methods: {
    async getKab(day, kab, lesson = null, idl = null) {
      if (kab.length > 10) return null
      var strdate = new Date(day).toLocaleDateString()
      var cDay = strdate.replaceAll('.', '')
      this.winKab.loading = true
      if(lesson) this.winKab.lesson = lesson
      if(idl)    this.winKab.idl = idl
      this.winKab.current.kab = -1
      this.winKab.day = day
      this.$bvModal.show('kabraspwin')

      var setResp = response => {
          this.winKab.corps  = response.data.corps
          this.winKab.kabs  = response.data.kabs
          this.winKab.dates = response.data.dates
          this.winKab.rasp  = response.data.rasp
          this.winKab.types  = response.data.types
          this.winKab.current.kab = response.data.kabs.findIndex(el=>(el == kab))
          if (this.winKab.current.kab < 0 ) this.winKab.current.kab = 0
          this.winKab.current.cDay = response.data.dates.findIndex(el=>(el.split(" ")[1] == strdate.replace('.20', '.')))
          if (this.winKab.current.cDay < 0 ) this.winKab.current.cDay = 0
          this.winKab.loading = false
          setTimeout(()=>{
            document.querySelector('div[id="corplist"] button').addEventListener('click', ()=>{
              var corp = document.querySelector('div[id="corplist"] button').textContent
              setTimeout(()=>{
                document.querySelector('div[id="corplist"] ul').scrollTop = document.getElementById(`corp_${corp}`).offsetTop-150;
              }, 100);
            })
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

      var archiveId = 'dump_'+kab.split('-')[0]+'_'+cDay;
      if(sessionStorage[archiveId]) 
      {
        setResp({data: JSON.parse(sessionStorage[archiveId])})
      }
      else this.axios.post(PATH + '/api/kab',{date: cDay, kab: kab.split('-')[0]}).then( resp => {
        sessionStorage[archiveId] = JSON.stringify(resp.data)
        setResp(resp)
      })
    },
  }
}