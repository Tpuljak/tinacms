// CITYJS: useYjs hook
import { useContext } from 'react'
import { YjsContext } from '../yjs/yjs-provider'

export function useYjs() {
  const context = useContext(YjsContext)

  if (!context) {
    throw new Error('useYjs must be used within a YjsProvider')
  }

  return context
}
