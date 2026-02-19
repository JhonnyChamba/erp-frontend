import { defineStore } from 'pinia'
import { listBranchesRequest, userCompanyRequest } from '@/services/auth.service'

export const useListCompanyUserStore = defineStore('listCompanyUser', {
	state: () => ({
		companies: [] as Array<{
			id: number
			razon_social: string
			ruc: string
			nombre_comercial: string
		}>,
		total: 0,
		page: 1,
		limit: 10,
		loading: false,
		error: null as string | null,
	}),

	actions: {
		async fetchCompanies(params: {
			page?: number
			limit?: number
		}) {
			this.loading = true
			this.error = null
			try {
				const data = await userCompanyRequest({
					page: params.page ?? this.page,
					limit: params.limit ?? this.limit,
				})
				this.companies = data
				return data   // <-- aquí devuelves los datos
			} catch (err: any) {
				this.error = err.message || 'Error al cargar empresas'
				throw err    // opcional, para propagar error si quieres
			} finally {
				this.loading = false
			}
		}
	}
})

export const useBranchStore = defineStore('branch', {
	state: () => ({
		branches: [] as Array<{
			id: number
			code: string
			name: string
			address: string
		}>,
		total: 0,
		page: 1,
		limit: 10,
		loading: false,
		error: null as string | null,
	}),

	actions: {
		async fetchBranches(params: {
			companyId: number
			page?: number
			limit?: number
		}) {
			this.loading = true
			this.error = null

			try {
				const response = await listBranchesRequest({
					companyId: params.companyId,
					page: params.page ?? this.page,
					limit: params.limit ?? this.limit,
				})

				console.log(response);

				this.branches = response.data
				this.total = response.meta.total
				this.page = response.meta.page
				this.limit = response.meta.limit

				return response
			} catch (err: any) {
				this.error = err.message || 'Error al cargar sucursales'
				throw err
			} finally {
				this.loading = false
			}
		}

	}
})