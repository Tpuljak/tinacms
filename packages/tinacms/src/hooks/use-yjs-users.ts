// CITYJS: useYjsUsers hook
import { useCallback, useEffect, useState } from 'react'
import { UserColor } from '../yjs/yjs-provider'
import { useYjs } from './use-yjs'

export type YjsUserData = {
  username: string
  color: UserColor
}

export function useYjsUsers() {
  const [users, setUsers] = useState<Map<number, YjsUserData>>(new Map())

  const handleAwarenessUpdate = useCallback(
    (params: { removed: Array<number>; updated: Array<number> }) => {
      params.removed.forEach((clientID) => {
        setUsers((users) => {
          users.delete(clientID)
          return new Map(users)
        })
      })

      const handleUserUpdate = (user: YjsUserData, clientID: number) => {
        if (clientID === provider.awareness.clientID) {
          return
        }

        setUsers((users) => {
          users.set(clientID, user)
          return new Map(users)
        })
      }

      provider.awareness.getStates().forEach((state, clientID) => {
        if (!state.user) {
          return
        }

        const user: YjsUserData = JSON.parse(state.user)
        handleUserUpdate(user, clientID)
      })
    },
    [users]
  )

  const { provider } = useYjs()

  useEffect(() => {
    provider.awareness.on('update', handleAwarenessUpdate)

    return () => {
      provider.awareness.off('update', handleAwarenessUpdate)
    }
  }, [])

  return users
}
