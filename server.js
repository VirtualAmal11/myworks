const express = require('express');
const app = express();
const sequelize = require('./config/database');

const hikeRoutes = require('./routes/hikeRoutes');
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const Hike = require('./models/hike');
const User = require('./models/user');
const Application = require('./models/application');



User.hasMany(Hike, {
    foreignKey: 'organizerId',
    as: 'organizedHikes'
});

Hike.belongsTo(User, {
    foreignKey: 'organizerId',
    as: 'organizer'
});

User.hasMany(Application, {
    foreignKey: 'userId',
    as: 'applications'
});

Application.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

Hike.hasMany(Application, {
    foreignKey: 'hikeId',
    as: 'applications'
});

Application.belongsTo(Hike, {
    foreignKey: 'hikeId',
    as: 'hike'
});

app.use(express.json());
app.use('/api/hikes', hikeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use(errorMiddleware);

const PORT = 5000;

async function startServer() {
    try {
        await sequelize.authenticate();

        console.log('PostgreSQL connected successfully!');

        await sequelize.sync({ alter: true });

        console.log('Database tables synchronized!');

        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });

    } catch (error) {
        console.error('Database connection error:', error);
    }
}

startServer();

