import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import '@/assets/css/global.css'
import '@/assets/css/theme/index.css'
import request from "@/utils/request";
import SlideVerify from 'vue-monoplasty-slide-verify';
import '@/assets/css/iconfont/iconfont.css'

Vue.config.productionTip = false

Vue.prototype.$request = request
Vue.prototype.$baseUrl = process.env.VUE_APP_BASEURL

Vue.use(ElementUI, {size: "small"})
Vue.use(SlideVerify)

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
