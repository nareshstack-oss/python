import express from 'express';
import { createSession } from '../utils/auth.js';
import { users } from '../data/store.js';

const router = express.Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login with demo credentials
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((candidate) => candidate.email === email && candidate.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = createSession(user.id);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      about: user.about
    }
  });
});

/**
 * @openapi
 * /auth/users:
 *   get:
 *     tags:
 *       - Auth
 *     summary: List demo users
 *     responses:
 *       200:
 *         description: Users returned
 */
router.get('/users', (_, res) => {
  return res.json(
    users.map(({ password, ...user }) => user)
  );
});

export default router;
