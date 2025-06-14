<!-- App.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userInfo = ref([])
const authToken = ref('')
const configPassword = ref('')
const mainPassword = ref('')

// 自动登录检查
onMounted(() => {
  const storedToken = localStorage.getItem('authToken')
  const storedConfigPwd = localStorage.getItem('configPassword')
  const storedMainPwd = localStorage.getItem('mainPassword')

  if (storedToken && storedConfigPwd && storedMainPwd) {
    console.log("自动登录中...")
    handleLoginSuccess({
      token: storedToken,
      configPassword: storedConfigPwd,
      mainPassword: storedMainPwd
    }, true)
    router.push('/main') // 自动跳转到主页
  }
})

const fetchData = async (token) => {
  try {
    const response = await fetch('http://localhost:3000/api/data', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        configPassword: configPassword.value,
        mainPassword: mainPassword.value
      })
    })
    const data = await response.json()
    data.success ? userInfo.value = data.data : handleLogout()
  } catch (error) {
    alert("网络错误")
    handleLogout()
  }
}

const handleLoginSuccess = (credentials, isAutoLogin = false) => {
  authToken.value = credentials.token
  configPassword.value = credentials.configPassword
  mainPassword.value = credentials.mainPassword

  if (!isAutoLogin) {
    localStorage.setItem('authToken', credentials.token)
    localStorage.setItem('configPassword', credentials.configPassword)
    localStorage.setItem('mainPassword', credentials.mainPassword)
    router.push('/main') // 手动登录后跳转
  }
}

const handleLogout = () => {
  localStorage.clear()
  router.push('/') // 登出后返回登录页
}
</script>

<template>
  <router-view 
    v-slot="{ Component }"
    :auth-token="authToken"
    :config-password="configPassword"
    :main-password="mainPassword"
    @logout="handleLogout"
  >
    <component 
      :is="Component" 
      :password-data="userInfo" 
      @login-success="handleLoginSuccess" 
    />
  </router-view>
</template>

<style>
body { margin: 0; padding: 0; box-sizing: border-box; }
</style>
