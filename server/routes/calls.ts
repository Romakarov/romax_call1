import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Получить историю звонков
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    // Для MVP просто возвращаем пустой массив
    res.json([]);
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ error: 'Failed to get call history' });
  }
});

export default router;
