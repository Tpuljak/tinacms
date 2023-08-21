import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import React from 'react'

type Props = {
  children: React.ReactNode
}

type UserColor = {
  backgroundColor: {
    R: number
    G: number
    B: number
  }
  fontColor: string
}

type CursorState = {
  color: UserColor
  x: number
  y: number
  username: string
}

function createCursor(color: UserColor): HTMLDivElement {
  const rgbColor = `rgb(${color.backgroundColor.R}, ${color.backgroundColor.G}, ${color.backgroundColor.B})`
  const cursorDiv = window.document.createElement('div')
  cursorDiv.classList.add('cursor')

  cursorDiv.style.boxShadow = `0 0 0 1em ${rgbColor},0 1em 0 1em ${rgbColor},-2.5em 1.5em 0 .5em ${rgbColor},2.5em 1.5em 0 .5em ${rgbColor},-3em -3em 0 0 ${rgbColor},3em -3em 0 0 ${rgbColor},-2em -2em 0 0 ${rgbColor},2em -2em 0 0 ${rgbColor},-3em -1em 0 0 ${rgbColor},-2em -1em 0 0 ${rgbColor},2em -1em 0 0 ${rgbColor},3em -1em 0 0 ${rgbColor},-4em 0 0 0 ${rgbColor},-3em 0 0 0 ${rgbColor},3em 0 0 0 ${rgbColor},4em 0 0 0 ${rgbColor},-5em 1em 0 0 ${rgbColor},-4em 1em 0 0 ${rgbColor},4em 1em 0 0 ${rgbColor},5em 1em 0 0 ${rgbColor},-5em 2em 0 0 ${rgbColor},5em 2em 0 0 ${rgbColor},-5em 3em 0 0 ${rgbColor},-3em 3em 0 0 ${rgbColor},3em 3em 0 0 ${rgbColor},5em 3em 0 0 ${rgbColor},-2em 4em 0 0 ${rgbColor},-1em 4em 0 0 ${rgbColor},1em 4em 0 0 ${rgbColor},2em 4em 0 0 ${rgbColor}`
  cursorDiv.style.position = 'absolute'
  cursorDiv.style.width = '1em'
  cursorDiv.style.height = '1em'
  cursorDiv.style.background = rgbColor
  cursorDiv.style.zIndex = '10000'
  cursorDiv.style.pointerEvents = 'none'

  return cursorDiv
}

export function YjsProvider(props: Props) {
  const yDoc: Y.Doc = new Y.Doc()
  const provider = new WebsocketProvider(
    'ws://localhost:8989',
    'Y_SESSION',
    yDoc
  )
  const yChat: Y.Array<string> = yDoc.getArray('chat')

  function getRandomColor(): UserColor {
    const color = {
      R: Math.floor(((1 + Math.random()) * 256) / 2),
      G: Math.floor(((1 + Math.random()) * 256) / 2),
      B: Math.floor(((1 + Math.random()) * 256) / 2),
    }

    const luminance =
      (0.299 * color.R + 0.587 * color.G + 0.114 * color.B) / 255

    return {
      backgroundColor: color,
      fontColor: luminance > 0.5 ? 'black' : 'white',
    }
  }
  const color = getRandomColor()
  const cursors = new Map<number, HTMLDivElement>()

  const handleAwarenessUpdate = () => {
    provider.awareness.getStates().forEach((state, clientID) => {
      if (!state.cursor) {
        return
      }
      const cursor: CursorState = JSON.parse(state.cursor)
      if (clientID === provider.awareness.clientID) {
        return
      }

      let cursorDiv = cursors.get(clientID)
      if (!cursorDiv) {
        cursorDiv = createCursor(cursor.color)
        // cursorDiv.innerText = cursor.username
        window.document.body.appendChild(cursorDiv)
        cursors.set(clientID, cursorDiv)
      }

      cursorDiv.style.left = `${cursor.x}px`
      cursorDiv.style.top = `${cursor.y}px`
    })
  }

  const handleChatChanged = (event: Y.YArrayEvent<string>) => {
    for (const item of event.changes.delta) {
      if (item.insert !== undefined) {
        if (item.insert instanceof Array) {
          item.insert.forEach((message) => {
            console.log(message)
          })
        } else {
          console.log(item.insert)
        }
      }
    }
  }

  React.useEffect(() => {
    provider.connect()
    // provider.awareness.setLocalStateField('user', JSON.stringify({ name: 'Tina' + Math.random() }))
    provider.awareness.on('update', handleAwarenessUpdate)

    const handleCursorMove = (e: MouseEvent) => {
      provider.awareness.setLocalStateField(
        'cursor',
        JSON.stringify({ color, x: e.x, y: e.y, username: 'Mate' })
      )
    }

    window.document.addEventListener('mousemove', handleCursorMove)

    yChat.observe(handleChatChanged)

    return () => {
      provider.disconnect()
      window.document.removeEventListener('mousemove', handleCursorMove)
    }
  }, [])

  const contextValue = {
    yDoc,
    yChat,
  }

  return (
    <YjsContext.Provider value={contextValue}>
      {props.children}
    </YjsContext.Provider>
  )
}

export interface IYjsContext {
  yDoc: Y.Doc
  yChat: Y.Array<string>
}

export const YjsContext = React.createContext<IYjsContext | undefined>(
  undefined
)
