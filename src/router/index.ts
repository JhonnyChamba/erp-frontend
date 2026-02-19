import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ListCompany from '@/views/ListCompany.vue';

const routes = [
    { path: '/', component: LoginView },
    { path: '/ListCompany', component: ListCompany }
]
const router = createRouter({ history: createWebHistory(), routes });

export default router