import cors from 'cors';
import express from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chats.js';
import { conversations } from './data/store.js';
import { registerSwagger } from './swagger.js';
import { getUserByToken } from './utils/auth.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.set('io', io);
app.use(cors());
app.use(express.json());
registerSwagger(app);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', app: 'chatboxindia-backend' });
});

app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);

io.on('connection', (socket) => {
  socket.on('auth:login', ({ token }) => {
    const user = getUserByToken(token);
    if (!user) {
      socket.emit('auth:error', { message: 'Invalid token' });
      return;
    }

    const relevantChats = conversations.filter((chat) => chat.participants.includes(user.id));
    relevantChats.forEach((chat) => socket.join(chat.id));
    socket.data.userId = user.id;
    socket.emit('auth:ok', { userId: user.id, chatIds: relevantChats.map((chat) => chat.id) });
  });

  socket.on('message:send', ({ chatId, text }) => {
    const chat = conversations.find((item) => item.id === chatId && item.participants.includes(socket.data.userId));
    if (!chat || !text?.trim()) {
      return;
    }
    const message = {
      id: crypto.randomUUID(),
      senderId: socket.data.userId,
      text,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };
    chat.messages.push(message);
    io.to(chatId).emit('message:new', { chatId, message });
  });
});

const PORT = process.env.PORT || 8090;
server.listen(PORT, () => {
  console.log(`ChatBoxIndia backend running on http://localhost:${PORT}`);
});
