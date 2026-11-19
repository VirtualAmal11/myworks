const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

const Hike = require('../models/hike');
const User = require('../models/user');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', async (req, res, next) => {
    try {
        const { region, difficulty, date, title } = req.query;

        const where = {};

        if (title) {
            where.title = {
                [Op.iLike]: `%${title}%`
            };
        }
          

        if (region) {
            where.region = {
                [Op.iLike]: `%${region}%`
            };
        }

        if (difficulty) {
            where.difficulty = difficulty;
        }

        if (date) {
            const startDate = new Date(`${date}T00:00:00.000Z`);

            const endDate = new Date(startDate);
            endDate.setUTCDate(endDate.getUTCDate() + 1);

            where.date = {
                [Op.gte]: startDate,
                [Op.lt]: endDate
            };
        }

        const hikes = await Hike.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'organizer',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        res.json(hikes);

    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const hike = await Hike.findByPk(req.params.id);

        if (!hike) {
            return res.status(404).json({
                message: 'Поход не найден'
            });
        }

        res.json(hike);
    } catch (error) {
        next(error);
    }
});

router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const hike = await Hike.create({
            ...req.body,
            organizerId: req.user.id
        });

        res.status(201).json({
            message: 'Поход успешно создан',
            hike: hike
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
        const hike = await Hike.findByPk(req.params.id);

        if (!hike) {
            return res.status(404).json({
                message: 'Поход не найден'
            });
        }

        if (Number(hike.organizerId) !== Number(req.user.id)) {
            return res.status(403).json({
                message: 'Вы не можете редактировать чужой поход'
            });
        }

        await hike.update(req.body);

        res.json({
            message: 'Поход успешно обновлён',
            hike: hike
        });

    } catch (error) {
        next(error);
    }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const hike = await Hike.findByPk(req.params.id);

        if (!hike) {
            return res.status(404).json({
                message: 'Поход не найден'
            });
        }

        if (Number(hike.organizerId) !== Number(req.user.id)) {
            return res.status(403).json({
                message: 'Вы не можете удалить чужой поход'
            });
        }

        await hike.destroy();

        res.json({
            message: 'Поход успешно удалён'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
