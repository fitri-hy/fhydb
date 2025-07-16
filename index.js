const FDB = require('./fhydb');

// Inisialisasi database dengan file 'mydatabase.fdb' dan autentikasi
const db = new FDB('mydatabase.fdb', { username: 'root', password: '' });

// Aktifkan logging untuk melihat operasi secara detail di konsol
db.enableLog();

// Membuat tabel 'users' dengan beberapa kolom dan tipe data
db.createTable('users', [
  { col: 'id', type: 'int' },        // kolom id bertipe integer
  { col: 'name', type: 'string' },   // kolom nama pengguna
  { col: 'email', type: 'string' },  // kolom email pengguna
  { col: 'isAdmin', type: 'boolean' } // kolom status admin (true/false)
]);

// Menambahkan data pengguna baru ke tabel 'users'
// id akan dibuat otomatis jika tidak disediakan (auto-increment)
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

// Mengambil semua data dari tabel 'users'
const allUsers = db.select('users');

// Mengambil hanya pengguna yang memiliki isAdmin = true
const admins = db.select('users', user => user.isAdmin);

// Memperbarui email user dengan nama 'John Doe'
db.update('users', 
  user => user.name === 'John Doe', 
  { email: 'john.doe@company.com' }
);

// Menghapus user dengan nama 'Jane Smith'
db.delete('users', user => user.name === 'Jane Smith');

// Mengurutkan data pengguna berdasarkan kolom 'name' secara descending
const sortedUsers = db.orderBy('users', 'name', 'desc');

// Membatasi hasil hanya 5 data pertama
const limitedUsers = db.limit(sortedUsers, 5);

// Menjalankan query mentah untuk menghitung jumlah baris pada tabel 'users'
const userCount = db.raw(tables => tables.users.rows.length);
console.log('Jumlah pengguna:', userCount);

// Mendapatkan seluruh data database dalam format JSON yang rapi
const jsonData = db.toJSON();
console.log(jsonData);