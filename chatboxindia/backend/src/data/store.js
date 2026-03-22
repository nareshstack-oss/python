import { randomUUID } from 'node:crypto';

const now = () => new Date().toISOString();

export const users = [
  {
    id: 'user-1',
    name: 'Naresh Bhukya',
    email: 'naresh@chatboxindia.app',
    password: 'demo123',
    avatar: 'NB',
    about: 'Building ChatBoxIndia.',
    online: true
  },
  {
    id: 'user-2',
    name: 'Ananya Rao',
    email: 'ananya@chatboxindia.app',
    password: 'demo123',
    avatar: 'AR',
    about: 'Product designer',
    online: true
  },
  {
    id: 'user-3',
    name: 'Rahul Verma',
    email: 'rahul@chatboxindia.app',
    password: 'demo123',
    avatar: 'RV',
    about: 'Weekend traveler',
    online: false
  }
];

export const conversations = [
  {
    id: 'chat-1',
    participants: ['user-1', 'user-2'],
    messages: [
      {
        id: randomUUID(),
        senderId: 'user-2',
        text: 'Can we review the latest ChatBoxIndia home screen tonight?',
        createdAt: now(),
        status: 'seen'
      },
      {
        id: randomUUID(),
        senderId: 'user-1',
        text: 'Yes. I also want to tighten the onboarding flow.',
        createdAt: now(),
        status: 'delivered'
      }
    ]
  },
  {
    id: 'chat-2',
    participants: ['user-1', 'user-3'],
    messages: [
      {
        id: randomUUID(),
        senderId: 'user-3',
        text: 'Train tickets are booked. Shall I share the itinerary here?',
        createdAt: now(),
        status: 'sent'
      }
    ]
  }
];

export const sessions = new Map();
