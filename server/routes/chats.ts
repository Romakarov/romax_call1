import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Получить все чаты пользователя
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await query(
      `SELECT DISTINCT c.id, c.type, c.title, c.description, c.created_at, c.updated_at,
              u.id as creator_id, u.username as creator_name
       FROM chats c
       JOIN chat_participants cp ON c.id = cp.chat_id
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE cp.user_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    const chats = await Promise.all(
      result.rows.map(async (chat) => {
        // Получаем участников чата
        const participants = await query(
          'SELECT id, username, email FROM users WHERE id IN (SELECT user_id FROM chat_participants WHERE chat_id = $1)',
          [chat.id]
        );
        return {
          ...chat,
          participants: participants.rows,
        };
      })
    );

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// Создать приватный чат
router.post('/private', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId is required' });
    }

    // Проверяем, существует ли уже такой чат
    const existing = await query(
      `SELECT c.id FROM chats c
       WHERE c.type = 'private'
       AND c.id IN (
         SELECT chat_id FROM chat_participants WHERE user_id = $1
       )
       AND c.id IN (
         SELECT chat_id FROM chat_participants WHERE user_id = $2
       )`,
      [userId, otherUserId]
    );

    if (existing.rows.length > 0) {
      return res.json({ id: existing.rows[0].id });
    }

    // Создаем новый приватный чат
    const chatResult = await query(
      'INSERT INTO chats (type, creator_id) VALUES ($1, $2) RETURNING id',
      ['private', userId]
    );

    const chatId = chatResult.rows[0].id;

    // Добавляем участников
    await query(
      'INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
      [chatId, userId, otherUserId]
    );

    res.status(201).json({ id: chatId });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Создать групповой чат
router.post('/group', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, description, participantIds } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    // Создаем групповой чат
    const chatResult = await query(
      'INSERT INTO chats (type, title, description, creator_id) VALUES ($1, $2, $3, $4) RETURNING id',
      ['group', title, description || null, userId]
    );

    const chatId = chatResult.rows[0].id;

    // Добавляем создателя
    await query('INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)', [chatId, userId]);

    // Добавляем других участников
    if (participantIds && participantIds.length > 0) {
      for (const participantId of participantIds) {
        await query('INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)', [
          chatId,
          participantId,
        ]);
      }
    }

    res.status(201).json({ id: chatId });
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ error: 'Failed to create group chat' });
  }
});

export default router;
