const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use PostgreSQL in production (Vercel/Railway), SQLite in development
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isProduction = process.env.NODE_ENV === 'production' || databaseUrl;

const sequelize = isProduction
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      }
    })
  : new Sequelize({
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
