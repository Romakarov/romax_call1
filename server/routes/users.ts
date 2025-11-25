import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Поиск пользователей
router.get('/search/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const userId = (req as any).userId;

    const result = await query(
      'SELECT id, username, email, is_online FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 20',
      [`%${username}%`, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Получить всех пользователей
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await query(
      'SELECT id, username, email, is_online, last_seen FROM users WHERE id != $1 ORDER BY username',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

export default router;
