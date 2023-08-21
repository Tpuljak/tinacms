// eslint-disable-next-line @typescript-eslint/no-var-requires
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection
import * as http from 'http'
import Websocket from 'ws'
import { Socket as NetSocket } from 'net'

const wss = new Websocket.Server({ noServer: true })
const yWebsocketServer = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('okay')
})

wss.on('connection', setupWSConnection)

yWebsocketServer.on('upgrade', (request, socket: NetSocket, head) => {
  const handleAuth = (ws: Websocket) => {
    wss.emit('connection', ws, request)
  }
  wss.handleUpgrade(request, socket, head, handleAuth)
})

yWebsocketServer.listen({ host: '0.0.0.0', port: 8989 })
