import { createContext, useContext, useReducer, useEffect } from 'react'
import createPersistedState from 'use-persisted-state'

const AuthDispatchContext = createContext()
const AuthStateContext = createContext()

const usePersistedAuthState = createPersistedState('forum-auth')

const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
const LOGOUT = 'LOGOUT'

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
}

function reducer(state, { payload, type }) {
  switch (type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        ...payload,
        isAuthenticated: true,
      }
    // case UPDATE_USER:
    //   return {
    //     ...state,
    //     user: {
    //       ...state.user,
    //       ...payload,
    //     },
    //   };
    case LOGOUT:
      return initialState

    default:
      throw new Error(`Unhandled action type ${type}`)
  }
}

function AuthProvider({ children }) {
  const [savedAuthState, saveAuthState] = usePersistedAuthState(
    JSON.stringify(initialState)
  )
  const [state, dispatch] = useReducer(reducer, JSON.parse(savedAuthState))

  useEffect(() => {
    saveAuthState(state)
  }, [state, saveAuthState])

  const login = async ({ email, password, save_last_seen }) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const json = await res.json()

    if (!res.ok) throw new Error(json?.message)

    const { token, ...user } = json

    dispatch({ type: LOGIN_SUCCESS, payload: { token, user, save_last_seen } })
  }

  const register = async ({ name, email, password, save_last_seen }) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const json = await res.json()

    if (!res.ok) throw new Error(json?.message)

    const { token, ...user } = json

    dispatch({ type: LOGIN_SUCCESS, payload: { token, user, save_last_seen } })
  }

  const logout = () => dispatch({ type: LOGOUT })

  return (
    <>
      <AuthDispatchContext.Provider value={{ login, register, logout }}>
        <AuthStateContext.Provider value={state}>
          {children}
        </AuthStateContext.Provider>
      </AuthDispatchContext.Provider>
    </>
  )
}

function useAuthDispatch() {
  const context = useContext(AuthDispatchContext)

  if (context === undefined)
    throw new Error('useAuthDispatch must be used within an AuthProvider')

  return context
}

function useAuthState() {
  const context = useContext(AuthStateContext)

  if (context === undefined)
    throw new Error('useAuthState must be used within an AuthProvider')

  return context
}

export { AuthProvider, useAuthDispatch, useAuthState }
