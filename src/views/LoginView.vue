<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()

const login = async () => {
	try {
		await authStore.login(email.value, password.value);
		const payload = authStore.tokenPayload
		console.log(payload);
		console.log(payload?.developer);

		if (payload?.developer || payload?.multi_company) {
			router.push('/ListCompany')
		} else {
			alert('Sin respuesta del backend')
			// router.push(`/Sales/${payload.user_id}`)
		}

	} catch (error) {
		console.log(error);
		alert('Credenciales incorrectas')
	}
}
</script>

<template>
	<div id="main-wrapper" class="p-0 bg-white auth-customizer-none">
		<div
			class="auth-login position-relative overflow-hidden d-flex align-items-center justify-content-center px-7 px-xxl-0 rounded-3 h-n20">
			<div class="auth-login-shape position-relative w-100">
				<div class="auth-login-wrapper card mb-0 container position-relative z-1 h-100 mh-n100" data-simplebar>
					<div class="card-body">
						<a class="">
							<img src="/controller/images/logos/logo-dark.svg" class="light-logo" alt="Logo-Dark" />
							<img src="/controller/images/logos/logo-light.svg" class="dark-logo" alt="Logo-light" />
						</a>
						<div class="row align-items-center justify-content-around pt-6 pb-5">
							<div class="col-lg-6 col-xl-5 d-none d-lg-block">
								<div class="text-center text-lg-start">
									<img src="/controller/images/backgrounds/login-security.png" alt="spike-img" class="img-fluid">
								</div>
							</div>
							<div class="col-lg-6 col-xl-5">
								<h2 class="mb-6 fs-8 fw-bolder">Bienvenido </h2>
								<form @submit.prevent="login">
									<div class="mb-7">
										<label class="form-label fw-bold">Nombre de usuario</label>
										<input v-model="email" type="email" class="form-control py-6">
									</div>

									<div class="mb-9">
										<label class="form-label fw-bold">Contraseña</label>
										<input v-model="password" type="password" class="form-control py-6">
									</div>

									<button type="submit" class="btn btn-primary w-100 mb-7 rounded-pill">
										Iniciar Sesión
									</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="dark-transparent sidebartoggler"></div>
	</div>
</template>