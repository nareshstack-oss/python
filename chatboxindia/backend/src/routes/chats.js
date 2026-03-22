import express from 'express';
import { randomUUID } from 'node:crypto';

import { conversations, users } from '../data/store.js';
import { getUserByToken } from '../utils/auth.js';

const router = express.Router();

function requireAuth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = user;
  next();
}

function enrichConversation(conversation, viewerId) {
  const partnerIds = conversation.participants.filter((id) => id !== viewerId);
  const partners = partnerIds.map((id) => users.find((user) => user.id === id)).filter(Boolean);
  const lastMessage = conversation.messages.at(-1) || null;

  return {
    id: conversation.id,
    participants: partners.map(({ password, ...rest }) => rest),
    lastMessage,
    unreadCount: lastMessage && lastMessage.senderId !== viewerId ? 1 : 0
  };
}

/**
 * @openapi
 * /chats:
 *   get:
 *     tags:
 *       - Chats
 *     summary: Get chat list for the logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat list returned
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAuth, (req, res) => {
  const items = conversations
    .filter((chat) => chat.participants.includes(req.user.id))
    .map((chat) => enrichConversation(chat, req.user.id));
  res.json(items);
});

/**
 * @openapi
 * /chats:
 *   post:
 *     tags:
 *       - Chats
 *     summary: Create or fetch a one-to-one conversation with another user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participantId]
 *             properties:
 *               participantId:
 *                 type: string
 *                 example: user-2
 *     responses:
 *       201:
 *         description: Conversation created or returned
 *       404:
 *         description: Participant not found
 */
router.post('/', requireAuth, (req, res) => {
  const { participantId } = req.body;
  const participant = users.find((user) => user.id === participantId);
  if (!participant) {
    return res.status(404).json({ message: 'Participant not found' });
  }

  const existing = conversations.find((chat) =>
    chat.participants.length == 2 &&
    chat.participants.includes(req.user.id) &&
    chat.participants.includes(participantId)
  );

  if (existing) {
    return res.status(201).json(enrichConversation(existing, req.user.id));
  }

  const newConversation = {
    id: `chat-${conversations.length + 1}`,
    participants: [req.user.id, participantId],
    messages: []
  };
  conversations.unshift(newConversation);
  return res.status(201).json(enrichConversation(newConversation, req.user.id));
});

/**
 * @openapi
 * /chats/{chatId}/messages:
 *   get:
 *     tags:
 *       - Chats
 *     summary: Get messages for a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages returned
 *       404:
 *         description: Conversation not found
 */
router.get('/:chatId/messages', requireAuth, (req, res) => {
  const chat = conversations.find((item) => item.id === req.params.chatId && item.participants.includes(req.user.id));
  if (!chat) {
    return res.status(404).json({ message: 'Conversation not found' });
  }
  return res.json(chat.messages);
});

/**
 * @openapi
 * /chats/{chatId}/messages:
 *   post:
 *     tags:
 *       - Chats
 *     summary: Send a message to a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       201:
 *         description: Message created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 */
router.post('/:chatId/messages', requireAuth, (req, res) => {
  const chat = conversations.find((item) => item.id === req.params.chatId && item.participants.includes(req.user.id));
  if (!chat) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const message = {
    id: randomUUID(),
    senderId: req.user.id,
    text: req.body.text,
    createdAt: new Date().toISOString(),
    status: 'sent'
  };
  chat.messages.push(message);
  req.app.get('io').to(chat.id).emit('message:new', { chatId: chat.id, message });
  return res.status(201).json(message);
});

export default router;
