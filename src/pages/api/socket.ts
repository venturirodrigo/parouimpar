import { Server as NetServer } from 'http';
import { Socket } from 'net';
import { Server as ServerIO } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';

interface CustomNextApiRequest extends NextApiRequest {
  socket: Socket & {
    server: NetServer & {
      io?: ServerIO;
    };
  };
}

interface GameRoom {
  players: { id: string; number?: number }[];
  gameState: 'waiting' | 'playing' | 'finished';
}

const rooms = new Map<string, GameRoom>();

export default function SocketHandler(req: CustomNextApiRequest, res: NextApiResponse) {
  if (!req.socket.server.io) {
    const io = new ServerIO(req.socket.server);

    io.on('connection', (socket) => {
      socket.on('joinGame', (roomId: string) => {
        socket.join(roomId);
        
        if (!rooms.has(roomId)) {
          rooms.set(roomId, {
            players: [{ id: socket.id }],
            gameState: 'waiting',
          });
        } else {
          const room = rooms.get(roomId);
          if (room && room.players.length < 2) {
            room.players.push({ id: socket.id });
            if (room.players.length === 2) {
              io.to(roomId).emit('gameStart');
            }
          }
        }
      });

      socket.on('selectNumber', ({ roomId, number }: { roomId: string; number: number }) => {
        const room = rooms.get(roomId);
        if (room) {
          const player = room.players.find(p => p.id === socket.id);
          if (player) {
            player.number = number;
            
            if (room.players.every(p => p.number !== undefined)) {
              const sum = room.players.reduce((acc, p) => acc + (p.number || 0), 0);
              const isEven = sum % 2 === 0;
              
              io.to(roomId).emit('gameResult', {
                sum,
                isEven,
                numbers: room.players.map(p => p.number),
              });
              
              rooms.delete(roomId);
            }
          }
        }
      });

      socket.on('disconnect', () => {
        for (const [roomId, room] of rooms.entries()) {
          const playerIndex = room.players.findIndex(p => p.id === socket.id);
          if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            if (room.players.length === 0) {
              rooms.delete(roomId);
            } else {
              io.to(roomId).emit('playerDisconnected');
            }
            break;
          }
        }
      });
    });

    req.socket.server.io = io;
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 