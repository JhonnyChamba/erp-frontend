import { defineStore } from 'pinia'
import { listBranchesRequest, userCompanyRequest } from '@/services/auth.service'

export interface CompanySummary {
	id: number
	razon_social: string
	ruc: string
	nombre_comercial: string
	sri_environment?: string
}

export const useListCompanyUserStore = defineStore('listCompanyUser', {
	state: () => ({
		companies: [] as CompanySummary[],
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
				const response = await userCompanyRequest({
					page: params.page ?? this.page,
					limit: params.limit ?? this.limit,
				})

				const rawList = Array.isArray(response) ? response : (response?.data || [])
				this.companies = rawList.map((item: any) => {
					const comp = item.company || item
					return {
						id: comp.id,
						razon_social: comp.business_name || comp.razon_social || '',
						ruc: comp.ruc || '',
						nombre_comercial: comp.trade_name || comp.nombre_comercial || '',
						sri_environment: String(comp.sri_environment ?? comp.fiscal?.sri_environment ?? '1'),
					}
				})

				if (response?.meta) {
					this.total = response.meta.total ?? this.companies.length
					this.page = response.meta.page ?? this.page
					this.limit = response.meta.limit ?? this.limit
				} else {
					this.total = this.companies.length
				}

				return response
			} catch (err: any) {
				this.error = err.message || 'Error al cargar empresas'
				throw err
			} finally {
				this.loading = false
			}
		},

		async findOneCompanies(params: { page?: number, limit?: number }) {
			return this.fetchCompanies(params)
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
					onlyEnabled: true, // al entrar solo se ofrecen sucursales activas
					companyId: params.companyId,
					page: params.page ?? this.page,
					limit: params.limit ?? this.limit,
				})

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
