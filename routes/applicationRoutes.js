const express = require('express');
const router = express.Router();

const Application = require('../models/application');
const Hike = require('../models/hike');
const User = require('../models/user');
const authMiddleware = require('../middleware/authMiddleware');



router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { hikeId, message } = req.body;

        if (!hikeId) {
            return res.status(400).json({
                message: 'Необходимо указать ID похода'
            });
        }

        const hike = await Hike.findByPk(hikeId);

        if (!hike) {
            return res.status(404).json({
                message: 'Поход не найден'
            });
        }
        
        if (Number(hike.organizerId) === Number(req.user.id)) {
            return res.status(400).json({
            message: 'Организатор не может подать заявку на собственный поход'
            });
        }

        const existingApplication = await Application.findOne({
            where: {
                userId: req.user.id,
                hikeId: hikeId
            }
        });

        if (existingApplication) {
            return res.status(409).json({
                message: 'Вы уже подали заявку на этот поход'
            });
        }

        const application = await Application.create({
            userId: req.user.id,
            hikeId: hikeId,
            message: message || null
        });

        res.status(201).json({
            message: 'Заявка успешно отправлена',
            application: application
        });

    } catch (error) {
        next(error);
    }
});


router.get('/organizer', authMiddleware, async (req, res, next) => {
    try {
        const applications = await Application.findAll({
            include: [
                {
                    model: Hike,
                    as: 'hike',
                    where: {
                        organizerId: req.user.id
                    },
                    attributes: ['id', 'title', 'date', 'region']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        res.json(applications);

    } catch (error) {
        next(error);
    }
});

router.patch('/:id/status', authMiddleware, async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Недопустимый статус заявки'
            });
        }

        const application = await Application.findByPk(req.params.id, {
            include: [
                {
                    model: Hike,
                    as: 'hike'
                }
            ]
        });

        if (!application) {
            return res.status(404).json({
                message: 'Заявка не найдена'
            });
        }

        if (Number(application.hike.organizerId) !== Number(req.user.id)) {
            return res.status(403).json({
                message: 'Вы не являетесь организатором этого похода'
            });
        }

        await application.update({ status });

        res.json({
            message: 'Статус заявки успешно изменён',
            application: application
        });

    } catch (error) {
        next(error);
    }
});

router.get('/my', authMiddleware, async (req, res, next) => {
    try {
        const applications = await Application.findAll({
            where: {
                userId: req.user.id
            },
            include: [
                {
                    model: Hike,
                    as: 'hike',
                    attributes: ['id', 'title', 'date', 'region', 'difficulty']
                }
            ]
        });

        res.json(applications);

    } catch (error) {
        next(error);
    }
});


router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const application = await Application.findByPk(req.params.id);

        if (!application) {
            return res.status(404).json({
                message: 'Заявка не найдена'
            });
        }

        if (Number(application.userId) !== Number(req.user.id)) {
            return res.status(403).json({
                message: 'Вы не можете отменить чужую заявку'
            });
        }

        await application.destroy();

        res.json({
            message: 'Заявка успешно отменена'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;