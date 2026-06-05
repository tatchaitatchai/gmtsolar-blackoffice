import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type { SignInCredential, SignInResponse } from '@/@types/auth'

export async function apiSignIn(data: SignInCredential) {
    return ApiService.fetchDataWithAxios<SignInResponse>({
        url: endpointConfig.signIn,
        method: 'post',
        data,
    })
}

export async function apiSignOut() {
    return Promise.resolve()
}

export async function apiForgotPassword(_data: { email: string }) {
    return Promise.resolve()
}

export async function apiResetPassword(_data: { token: string; password: string }) {
    return Promise.resolve()
}
