"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// Поиск пользователей
router.get('/search/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const userId = req.userId;
        const result = await (0, db_1.query)('SELECT id, username, email, is_online FROM users WHERE username ILIKE $1 AND id != $2 LIMIT 20', [`%${username}%`, userId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});
// Получить всех пользователей
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        const result = await (0, db_1.query)('SELECT id, username, email, is_online, last_seen FROM users WHERE id != $1 ORDER BY username', [userId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map