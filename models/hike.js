
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Hike = sequelize.define('Hike', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    title: {
        type: DataTypes.STRING,
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT
    },

    date: {
        type: DataTypes.DATE,
        allowNull: false
    },

    duration: {
        type: DataTypes.INTEGER
    },

    difficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard'),
        allowNull: false
    },

    region: {
        type: DataTypes.STRING
    }

});

module.exports = Hike;
