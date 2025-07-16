const FDB = require('./fhydb');

// Inisialisasi
const db = new FDB('mydatabase.fdb');
db.enableLog();

// Membuat tabel
db.createTable('users', [
  { col: 'id', type: 'int' },
  { col: 'name', type: 'string' },
  { col: 'email', type: 'string' },
  { col: 'isAdmin', type: 'boolean' }
]);

// Operasi CRUD
// Insert
const user1 = db.insert('users', {
  name: 'John Doe',
  email: 'john@example.com',
  isAdmin: true
});

const user2 = db.insert('users', {
  name: 'Jane Smith',
  email: 'jane@example.com',
  isAdmin: false
});

// Select
const allUsers = db.select('users');
const admins = db.select('users', user => user.isAdmin);

// Update
db.update('users', 
  user => user.name === 'John Doe', 
  { email: 'john.doe@company.com' }
);

// Delete
db.delete('users', user => user.name === 'Jane Smith');

// Order dan Limit
const sortedUsers = db.orderBy('users', 'name', 'desc');
const limitedUsers = db.limit(sortedUsers, 5);

// Raw query
const userCount = db.raw(tables => {
  return tables.users.rows.length;
});

// Export ke JSON
const jsonData = db.toJSON();

console.log(jsonData);