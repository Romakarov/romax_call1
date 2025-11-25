"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const router = (0, express_1.Router)();
// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Проверяем, существует ли пользователь
        const existingUser = await (0, db_1.query)('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email or username already exists' });
        }
        // Хешируем пароль
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Создаем пользователя
        const result = await (0, db_1.query)('INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username', [email, username, passwordHash]);
        const user = result.rows[0];
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.SESSION_SECRET || 'secret', {
            expiresIn: '7d',
        });
        res.status(201).json({ user, token });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Вход
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }
        // Найдем пользователя
        const result = await (0, db_1.query)('SELECT id, email, username, password_hash FROM users WHERE email = $1', [
            email,
        ]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const passwordMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.SESSION_SECRET || 'secret', {
            expiresIn: '7d',
        });
        // Обновляем статус онлайн
        await (0, db_1.query)('UPDATE users SET is_online = true, last_seen = NOW() WHERE id = $1', [user.id]);
        res.json({
            user: { id: user.id, email: user.email, username: user.username },
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// Получить текущего пользователя
router.get('/me', async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const result = await (0, db_1.query)('SELECT id, email, username, is_online FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map