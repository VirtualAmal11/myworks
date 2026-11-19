const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Заполните все поля корректно'
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: 'Укажите корректный email'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Пароль должен содержать минимум 8 символов'
            });
        }

        const existingUser = await User.findOne({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Пользователь с такой почтой уже существует'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            passwordHash
        });

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Введите корректные email и пароль'
            });
        }

        const normalizedEmail = email.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: 'Укажите корректный email'
            });
        }
        const user = await User.findOne({
            where: { email: normalizedEmail }
        });

        if (!user) {
            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '24h'
            }
        );

        res.json({
            message: 'Авторизация успешна',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
});

router.patch('/profile', authMiddleware, async (req, res, next) => {
    try {
        const { name, email } = req.body;

        if (email !== undefined) {
            const normalizedEmail = email.trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
                return res.status(400).json({
                    message: 'Укажите корректный email'
                });
            }
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        if (name !== undefined && !name.trim()) {
            return res.status(400).json({
                message: 'Имя не может быть пустым'
            });
        }

        if (email !== undefined && email !== user.email) {
            const existingUser = await User.findOne({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({
                    message: 'Этот email уже используется'
                });
            }
        }

        await user.update({
            name: name !== undefined ? name.trim() : user.name,
            email: email !== undefined ? email.trim() : user.email
        });

        res.json({
            message: 'Профиль успешно обновлён',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next (error);
    }
});

router.get('/profile', authMiddleware, async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email']
        });

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        res.json(user);

    } catch (error) {
        next(error);
    }
});

module.exports = router;