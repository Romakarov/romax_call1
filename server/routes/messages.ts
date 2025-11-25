import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Получить сообщения чата
router.get('/:chatId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { chatId } = req.params;

    // Проверяем, что пользователь участник чата
    const isMember = await query(
      'SELECT id FROM chat_participants WHERE chat_id = $1 AND user_id = $2',
      [chatId, userId]
    );

    if (isMember.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Получаем сообщения
    const result = await query(
      `SELECT m.id, m.chat_id, m.sender_id, m.text, m.image_uri, m.type, 
              m.is_read, m.is_deleted, m.edited_at, m.created_at,
              u.username as sender_name, u.email as sender_email
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = $1
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [chatId]
    );

    res.json(result.rows.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Отправить сообщение
router.post('/:chatId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { chatId } = req.params;
    const { text, imageUri, type = 'text' } = req.body;

    // Проверяем, что пользователь участник чата
    const isMember = await query(
      'SELECT id FROM chat_participants WHERE chat_id = $1 AND user_id = $2',
      [chatId, userId]
    );

    if (isMember.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!text && !imageUri) {
      return res.status(400).json({ error: 'text or imageUri is required' });
    }

    // Создаем сообщение
    const result = await query(
      `INSERT INTO messages (chat_id, sender_id, text, image_uri, type) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, chat_id, sender_id, text, image_uri, type, is_read, created_at`,
      [chatId, userId, text || null, imageUri || null, type]
    );

    const message = result.rows[0];

    // Обновляем updated_at чата
    await query('UPDATE chats SET updated_at = NOW() WHERE id = $1', [chatId]);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Редактировать сообщение
router.put('/:messageId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    // Проверяем, что пользователь владелец сообщения
    const messageResult = await query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (messageResult.rows[0].sender_id !== userId) {
      return res.status(403).json({ error: 'Cannot edit other user message' });
    }

    // Обновляем сообщение
    const result = await query(
      'UPDATE messages SET text = $1, edited_at = NOW() WHERE id = $2 RETURNING *',
      [text, messageId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Удалить сообщение
router.delete('/:messageId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;

    // Проверяем, что пользователь владелец сообщения
    const messageResult = await query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (messageResult.rows[0].sender_id !== userId) {
      return res.status(403).json({ error: 'Cannot delete other user message' });
    }

    // Мягкое удаление
    await query('UPDATE messages SET is_deleted = true, text = NULL, image_uri = NULL WHERE id = $1', [
      messageId,
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
