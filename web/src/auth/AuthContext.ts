import { createContext } from 'react'
import type {
    SignInCredential,
    AuthResult,
    User,
    OauthSignInCallbackPayload,
} from '@/@types/auth'

type Auth = {
    authenticated: boolean
    user: User
    signIn: (values: SignInCredential) => AuthResult
    signOut: () => void
    oAuthSignIn: (callback: (payload: OauthSignInCallbackPayload) => void) => void
}

const defaultFunctionPlaceHolder = async (): AuthResult => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    return { status: '', message: '' }
}

const AuthContext = createContext<Auth>({
    authenticated: false,
    user: {},
    signIn: async () => defaultFunctionPlaceHolder(),
    signOut: () => {},
    oAuthSignIn: (callback) => callback({ onSignIn: () => {}, redirect: () => {} }),
})

export default AuthContext
