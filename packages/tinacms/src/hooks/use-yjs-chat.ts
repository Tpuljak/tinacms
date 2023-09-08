// CITYJS: useYjsChat hook
import { useEffect, useState } from 'react'
import { useYjs } from './use-yjs'
import * as Y from 'yjs'
import { UserData } from '../yjs/yjs-provider'

export type YjsChatData = {
  userData: UserData
  message: string
  clientID: number
}

export function useYjsChat() {
  const { yChat, provider } = useYjs()
  const [messages, setMessages] = useState<Array<YjsChatData>>([])

  const handleChatChanged = (event: Y.YArrayEvent<string>) => {
    for (const item of event.changes.delta) {
      if (item.insert !== undefined) {
        if (item.insert instanceof Array) {
          item.insert.forEach((message) => {
            const data: YjsChatData = JSON.parse(message)
            setMessages((messages) => [...messages, data])
          })
        } else {
          const data: YjsChatData = JSON.parse(item.insert)
          setMessages((messages) => [...messages, data])
        }
      } else if (item.delete !== undefined) {
        setMessages((messages) => {
          messages.splice(0, item.delete)
          return [...messages]
        })
      }
    }
  }

  useEffect(() => {
    yChat.map((message) => {
      const data: YjsChatData = JSON.parse(message)
      setMessages((messages) => [...messages, data])
    })

    yChat.observe(handleChatChanged)

    return () => {
      yChat.unobserve(handleChatChanged)
    }
  }, [yChat])

  return {
    messages,
    sendMessage: (message: string) => {
      if (!message) {
        return
      }
      const userData = JSON.parse(provider.awareness.getLocalState().user)
      yChat.push([
        JSON.stringify({
          userData,
          message,
          clientID: provider.awareness.clientID,
        }),
      ])
    },
    clearMessages: () => {
      yChat.delete(0, yChat.length)
      setMessages([])
    },
  }
}
