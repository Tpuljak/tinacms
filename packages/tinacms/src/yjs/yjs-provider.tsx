// CITYJS: Yjs provider
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import React, { useMemo } from 'react'

type Props = {
  children: React.ReactNode
}

export type UserColor = {
  backgroundColor: {
    R: number
    G: number
    B: number
  }
  fontColor: string
}

export type UserData = {
  username: string
  color: UserColor
}

type CursorState = {
  color: UserColor
  x: number
  y: number
  username: string
}

export function YjsProvider(props: Props) {
  const getUsername = () => {
    const username = window.localStorage.getItem('username')
    if (username) {
      return username
    }
    const prompt = window.prompt('Username')

    window.localStorage.setItem('username', prompt || '')

    return prompt
  }

  const username = getUsername()

  const yDoc: Y.Doc = new Y.Doc()
  const provider = new WebsocketProvider(
    'ws://localhost:8989',
    'Y_SESSION',
    yDoc
  )
  const yChat: Y.Array<string> = yDoc.getArray('chat')

  const color = getRandomColor()
  const cursors = new Map<number, HTMLDivElement>()

  // CITYJS1: Handle cursor update
  const handleAwarenessUpdate = (params: { removed: Array<number> }) => {
    params.removed.forEach((clientID) => {
      const cursorDiv = cursors.get(clientID)
      if (cursorDiv) {
        window.document.body.removeChild(cursorDiv)
        cursors.delete(clientID)
      }
    })

    function handleCursorUpdate(cursor: CursorState, clientID: number) {
      if (clientID === provider.awareness.clientID) {
        return
      }

      let cursorDiv = cursors.get(clientID)
      if (!cursorDiv) {
        cursorDiv = createCursor(cursor.color, cursor.username)
        window.document.body.appendChild(cursorDiv)
        cursors.set(clientID, cursorDiv)
      }

      cursorDiv.style.left = `${cursor.x}px`
      cursorDiv.style.top = `${cursor.y}px`
    }

    provider.awareness.getStates().forEach((state, clientID) => {
      if (state.cursor) {
        const cursor: CursorState = JSON.parse(state.cursor)
        handleCursorUpdate(cursor, clientID)
      }
    })
  }

  React.useEffect(() => {
    provider.connect()
    provider.awareness.setLocalStateField(
      'user',
      JSON.stringify({ username, color })
    )
    // Subscribe to awareness updates
    // ...
    provider.awareness.on('update', handleAwarenessUpdate)

    // @ts-ignore
    window.provider = provider
    // @ts-ignore
    window.yDoc = yDoc

    // CITYJS2: Handle cursor move
    const handleCursorMove = (e: MouseEvent) => {
      provider.awareness.setLocalStateField(
        'cursor',
        JSON.stringify({ color, x: e.x, y: e.y, username })
      )
    }

    window.document.addEventListener('mousemove', handleCursorMove)

    return () => {
      provider.awareness.destroy()
      provider.disconnect()
      // Remove event listeners from awareness and window
      // ...
      window.document.removeEventListener('mousemove', handleCursorMove)
      provider.awareness.off('update', handleAwarenessUpdate)
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      yDoc,
      yChat,
      username,
      provider,
    }),
    [yDoc, yChat, username]
  )

  return (
    <YjsContext.Provider value={contextValue}>
      {props.children}
    </YjsContext.Provider>
  )
}

export interface IYjsContext {
  yDoc: Y.Doc
  yChat: Y.Array<string>
  username: string
  provider: WebsocketProvider
}

export const YjsContext = React.createContext<IYjsContext | undefined>(
  undefined
)

function createCursor(color: UserColor, username: string): HTMLDivElement {
  const rgbColor = `rgb(${color.backgroundColor.R}, ${color.backgroundColor.G}, ${color.backgroundColor.B})`
  const cursorDiv = window.document.createElement('div')
  cursorDiv.classList.add('cursor')

  const spaceInvader = window.document.createElement('div')
  spaceInvader.classList.add('space-invader')
  cursorDiv.appendChild(spaceInvader)

  const usernameDiv = window.document.createElement('div')
  usernameDiv.classList.add('username')
  usernameDiv.innerText = username
  cursorDiv.appendChild(usernameDiv)

  spaceInvader.style.boxShadow = `0 0 0 1em ${rgbColor},0 1em 0 1em ${rgbColor},-2.5em 1.5em 0 .5em ${rgbColor},2.5em 1.5em 0 .5em ${rgbColor},-3em -3em 0 0 ${rgbColor},3em -3em 0 0 ${rgbColor},-2em -2em 0 0 ${rgbColor},2em -2em 0 0 ${rgbColor},-3em -1em 0 0 ${rgbColor},-2em -1em 0 0 ${rgbColor},2em -1em 0 0 ${rgbColor},3em -1em 0 0 ${rgbColor},-4em 0 0 0 ${rgbColor},-3em 0 0 0 ${rgbColor},3em 0 0 0 ${rgbColor},4em 0 0 0 ${rgbColor},-5em 1em 0 0 ${rgbColor},-4em 1em 0 0 ${rgbColor},4em 1em 0 0 ${rgbColor},5em 1em 0 0 ${rgbColor},-5em 2em 0 0 ${rgbColor},5em 2em 0 0 ${rgbColor},-5em 3em 0 0 ${rgbColor},-3em 3em 0 0 ${rgbColor},3em 3em 0 0 ${rgbColor},5em 3em 0 0 ${rgbColor},-2em 4em 0 0 ${rgbColor},-1em 4em 0 0 ${rgbColor},1em 4em 0 0 ${rgbColor},2em 4em 0 0 ${rgbColor}`
  spaceInvader.style.width = '1em'
  spaceInvader.style.height = '1em'
  spaceInvader.style.background = rgbColor
  spaceInvader.style.pointerEvents = 'none'
  spaceInvader.style.transform = 'scale(0.3)'
  spaceInvader.style.marginLeft = '-25px'
  spaceInvader.style.marginBottom = '15px'

  cursorDiv.style.width = '50px'
  cursorDiv.style.height = '50px'
  cursorDiv.style.position = 'absolute'
  cursorDiv.style.zIndex = '10000'

  usernameDiv.style.border = `2px solid ${rgbColor}`
  usernameDiv.style.borderRadius = '5px'
  usernameDiv.style.display = 'flex'
  usernameDiv.style.justifyContent = 'center'

  return cursorDiv
}

function getRandomColor(): UserColor {
  const color = {
    R: Math.floor(((1 + Math.random()) * 256) / 2),
    G: Math.floor(((1 + Math.random()) * 256) / 2),
    B: Math.floor(((1 + Math.random()) * 256) / 2),
  }

  const luminance = (0.299 * color.R + 0.587 * color.G + 0.114 * color.B) / 255

  return {
    backgroundColor: color,
    fontColor: luminance > 0.5 ? 'black' : 'white',
  }
}
