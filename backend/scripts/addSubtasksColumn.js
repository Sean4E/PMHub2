const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.run('ALTER TABLE tasks ADD COLUMN subtasks TEXT', (err) => {
  if (err) {
    if (err.message.includes('duplicate')) {
      console.log('Column already exists!');
    } else {
      console.error('Error adding column:', err);
    }
  } else {
    console.log('✅ Subtasks column added successfully!');
  }
  db.close();
});
