import { api } from './axios'

export interface UploadResponse {
  url: string
}

export async function uploadCompanyLogo(companyId: number, file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post<UploadResponse>(`/storage/company/${companyId}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function uploadBranchLogo(branchId: number, companyId: number, file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post<UploadResponse>(`/storage/branch/${branchId}/logo?companyId=${companyId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function uploadUserPhoto(userId: number, file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post<UploadResponse>(`/storage/user/${userId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

