function errorMiddleware(error, req, res, next) {
    console.error(error);

    res.status(500).json({
        message: 'Внутренняя ошибка сервера'
    });
}

module.exports = errorMiddleware;