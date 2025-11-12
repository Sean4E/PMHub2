const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use SQLite for easy setup (no separate database server needed)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync tables without altering existing ones
    await sequelize.sync({ force: false });
    console.log('✅ Database models synchronized.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    // Don't exit, continue running
    console.log('⚠️ Continuing without database connection...');
  }
};

module.exports = { sequelize, connectDB };
