<img src="./icon.png"/>

# FhyDB

FhyDB adalah sebuah proyek percobaan prototipe database lokal sederhana yang menyimpan data dalam format file teks (`.fdb`), dirancang untuk mendukung operasi dasar seperti `select`, `insert`, `update`, `delete`, dan pengelolaan tabel. 

## Fitur

```
| Fitur                        | Status | Catatan Singkat                                                       |
| ---------------------------- | ------ | --------------------------------------------------------------------- |
| Autentikasi (username/pass)  | ✔️     | Validasi saat inisialisasi dan saat membuat file DB                   |
| Logging                      | ✔️     | Dapat diaktifkan/nonaktifkan, log rapi dalam format tabel ASCII       |
| Create/Drop Table            | ✔️     | Mendukung skema dengan tipe data                                      |
| Insert/Select/Update/Delete  | ✔️     | Mendukung auto-increment, validasi tipe, dan overwrite jika `id` sama |
| Order & Limit                | ✔️     | Sorting dengan `asc`, `desc`, dan `rand`, serta `limit()` pada hasil  |
| Alter Table                  | ✔️     | Menyesuaikan data lama dengan skema baru                              |
| Relasi antar tabel           | ✔️     | Mendukung satu level join berbasis foreign key                        |
| Raw query                    | ✔️     | Fleksibel, bisa akses langsung ke `this.tables`                       |
| JSON Output                  | ✔️     | Full dump dalam format JSON yang mudah dibaca                         |
| Auto save + `_save()` manual | ✔️     | Perubahan langsung disimpan ke file, juga bisa pakai `_save()` manual |
| Cek keberadaan tabel         | ✔️     | Memeriksa apakah tabel tertentu ada dalam database                    |
| Daftar semua tabel           | ✔️     | Mendapatkan daftar nama semua tabel yang tersedia                     |
```

## Instalasi

Pastikan Anda memiliki `Node.js` terinstal. Untuk menggunakan driver ini, cukup salin kode ke dalam file JavaScript dan import ke dalam proyek Anda.

## Definisi Struktur

### Inisialisasi

Untuk memulai menggunakan **FDB**, buat instance dari kelas **FDB** dengan memberikan path file untuk menyimpan data.

```javascript
const FDB = require('./fhydb');

// Inisialisasi database dengan file './mydatabase.fdb'
const db = new FDB('mydatabase.fdb', { username: 'root', password: '' });
```

#### Menggunakan Password dengan Hash (Optional)

Jika Anda ingin menggunakan password terenkripsi (hash) tanpa mengubah driver, Anda bisa mengenkripsi password terlebih dahulu sebelum mengirimkannya ke FDB.

Contoh menggunakan SHA-256:

```javascript
const crypto = require('crypto'); // Import modul crypto untuk hashing password

// Fungsi untuk meng-hash password dengan SHA-256
function encryptPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Hash password sebelum menggunakannya
const password = encryptPassword('mypassword123');

// Buat instance FDB dengan username dan password yang sudah di-hash
const db = new FDB('mydatabase.fdb', { username: 'root', password });

```

> Catatan: Pastikan juga file database .fdb dibuat dengan password yang sudah di-hash menggunakan cara yang sama agar autentikasi berhasil.

### Mengaktifkan/menonaktifkan Logging

Anda dapat mengaktifkan atau menonaktifkan logging untuk memantau operasi yang dilakukan.

```javascript
db.enableLog();  // Aktifkan logging untuk memantau operasi database
db.disableLog(); // Nonaktifkan logging (default)
```

### Membuat Tabel

Untuk membuat tabel baru, gunakan metode `createTable`.

```javascript
db.createTable('users', [
  { col: 'id', type: 'int' },      // Kolom id bertipe integer
  { col: 'name', type: 'string' }, // Kolom name bertipe string
  { col: 'email', type: 'string' } // Kolom email bertipe string
]);
```

### Menyisipkan Data

Untuk menyisipkan data ke dalam tabel, gunakan metode `insert`.

```javascript
// Menambahkan data pengguna baru ke tabel 'users'
// id akan dibuat otomatis jika tidak disediakan (auto-increment)
db.insert('users', { name: 'John Doe', email: 'john@example.com' });
```

### Memperbarui Data

Untuk memperbarui data yang ada, gunakan metode `update`.

```javascript
// Memperbarui email user dengan id 1
db.update('users', row => row.id === 1, { email: 'john.doe@example.com' });
```

### Menghapus Data

Untuk menghapus data, gunakan metode `delete`.

```javascript
// Menghapus user dengan id 1
db.delete('users', row => row.id === 1);
```

### Mengambil Data

Untuk mengambil data dari tabel, gunakan metode `select`.

```javascript
// Mengambil semua data dari tabel 'users'
const users = db.select('users');
```

### Mengurutkan Data

Untuk mengurutkan data berdasarkan kolom tertentu, gunakan metode `orderBy`.

```javascript
// Mengurutkan data berdasarkan kolom 'name' secara ascending
const sortedUsers = db.orderBy('users', 'name', 'asc');
```

> Mendukung `asc`, `desc`, `rand`

### Membatasi Hasil

Untuk membatasi jumlah hasil yang diambil, gunakan metode `limit`.

```javascript
// Mengambil 5 data pertama dari hasil yang sudah diurutkan
const limitedUsers = db.limit(sortedUsers, 5);
```

### Menghapus Tabel

Untuk menghapus tabel, gunakan metode `dropTable`.

```javascript
// Menghapus tabel 'users' beserta isinya
db.dropTable('users');
```

### Mengubah Struktur Tabel

Untuk mengubah struktur tabel, gunakan metode `alterTable`.

```javascript
// Menambahkan kolom 'age' bertipe integer pada tabel 'users'
db.alterTable('users', [
  { col: 'id', type: 'int' },
  { col: 'name', type: 'string' },
  { col: 'email', type: 'string' },
  { col: 'age', type: 'int' }  // Kolom baru
]);
```

### Relasi Antara Tabel

Untuk membuat relasi antara dua tabel, gunakan metode `relate`.

```javascript
// Mengambil data 'orders' yang berelasi dengan 'users' berdasarkan userId dan id
const relatedData = db.relate('orders', 'userId', 'users', 'id');
```

### Eksekusi Query Mentah

Untuk menjalankan query mentah, gunakan metode `raw`.

```javascript
db.raw(tables => {
  // Contoh: menghitung jumlah baris dalam tabel 'users'
  console.log('Jumlah user:', tables.users.rows.length);
});
```

### Mengonversi ke JSON

Untuk mendapatkan representasi JSON dari database, gunakan metode `toJSON`.

```javascript
// Mendapatkan seluruh data database dalam format JSON
const jsonData = db.toJSON();
```

### Mengecek Keberadaan Tabel

Untuk memeriksa apakah sebuah tabel dengan nama tertentu sudah ada gunakan `hasTable(name)`.

```javascript
// Cek apakah tabel 'users' ada di database
if (db.hasTable('users')) {
  console.log("Tabel 'users' tersedia.");  // Jika ada, tampilkan pesan ini
} else {
  console.log("Tabel 'users' tidak ditemukan."); // Jika tidak ada, tampilkan pesan ini
}
```

### Mendapatkan Daftar Semua Tabel

Untuk mendapatkan array berisi nama semua tabel yang ada dalam database gunakan `getTables() `.

```javascript
// Ambil daftar semua tabel yang tersedia di database
const tables = db.getTables();

// Tampilkan nama-nama tabel tersebut di console
console.log("Tabel yang tersedia:", tables);
```

### Menyimpan Data

Data secara otomatis disimpan ke dalam file setiap kali ada perubahan. Namun, Anda juga dapat memanggil metode `_save` secara manual jika diperlukan.

```javascript
db._save();
```

## Penanganan Kesalahan

Driver ini akan melemparkan kesalahan jika terjadi masalah, seperti:

* Tabel tidak ditemukan saat melakukan operasi.
* Data yang tidak valid saat menyisipkan atau memperbarui data.

## Tipe Data yang Didukung

| Tipe Data  | Deskripsi | Contoh Nilai |
|------------|-----------|--------------|
| `int`      | Bilangan bulat | `42`, `-7` |
| `float`    | Bilangan desimal | `3.14`, `-0.5` |
| `boolean`  | Nilai benar/salah | `true`, `false` |
| `datetime` | Tanggal dan waktu | `new Date()`, timestamp |
| `string`   | Teks | `"Hello"`, `'World'` |

## Referensi API

```
| Metode                          | Parameter                                                            | Return   | Deskripsi                                                        |       |                                    |
| ------------------------------- | -------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- | ----- | ---------------------------------- |
| `new FDB(path, options?)`       | `path: string`, `options?: { username?: string, password?: string }` | instance | Inisialisasi database dengan file dan opsi konfigurasi           |       |                                    |
| `createTable(name, schema)`     | `name: string`, `schema: array`                                      | void     | Membuat tabel baru                                               |       |                                    |
| `dropTable(name)`               | `name: string`                                                       | void     | Menghapus tabel                                                  |       |                                    |
| `alterTable(name, schema)`      | `name: string`, `schema: array`                                      | void     | Mengubah struktur tabel                                          |       |                                    |
| `insert(table, data)`           | `table: string`, `data: object`                                      | object   | Menyisipkan data baru ke tabel                                   |       |                                    |
| `select(table, where?)`         | `table: string`, `where?: function`                                  | array    | Mengambil data (dengan atau tanpa filter)                        |       |                                    |
| `update(table, where, newData)` | `table: string`, `where: function`, `newData: object`                | void     | Memperbarui data berdasarkan kondisi                             |       |                                    |
| `delete(table, where)`          | `table: string`, `where: function`                                   | void     | Menghapus data berdasarkan kondisi                               |       |                                    |
| `orderBy(table, column, dir)`   | `table: string`, `column: string`, \`dir: 'asc'                      | 'desc'   | 'rand'\`                                                         | array | Mengurutkan data berdasarkan kolom |
| `limit(rows, count)`            | `rows: array`, `count: number`                                       | array    | Membatasi jumlah data yang ditampilkan                           |       |                                    |
| `relate(from, key, to, ref)`    | `from: string`, `key: string`, `to: string`, `ref: string`           | array    | Menggabungkan dua tabel berdasarkan relasi kolom                 |       |                                    |
| `raw(callback)`                 | `callback: function(tables)`                                         | bebas    | Mengeksekusi fungsi bebas dengan akses langsung ke seluruh tabel |       |                                    |
| `toJSON()`                      | —                                                                    | object   | Mengembalikan seluruh database dalam format JSON                 |       |                                    |
| `_save()`                       | —                                                                    | void     | Menyimpan data secara manual ke file                             |       |                                    |
| `enableLog()` / `disableLog()`  | —                                                                    | void     | Mengaktifkan atau menonaktifkan logging internal                 |       |                                    |
| **`hasTable(name)`**            | `name: string`                                                       | boolean  | Mengecek apakah tabel dengan nama tertentu ada di database       |       |                                    |
| **`getTables()`**               | —                                                                    | array    | Mengambil daftar nama semua tabel yang ada di database           |       |                                    |
```

## Contoh Penggunaan

### Penggunaan Asynchronous

```javascript
// Contoh fungsi async yang membungkus operasi insert secara synchronous
async function asyncInsert(table, data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = db.insert(table, data);
      resolve(result);
    }, 0);
  });
}

// Penggunaan async/await
(async () => {
  const user = await asyncInsert('users', { name: 'Async User', email: 'async@example.com' });
  console.log('Inserted user:', user);
})();
```

### Penggunaan Lengkap

```javascript
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
```

## Catatan

* Pastikan untuk memeriksa tipe data saat menyisipkan atau memperbarui data agar sesuai dengan skema tabel.
* Driver ini tidak mendukung transaksi atau penguncian, sehingga tidak cocok untuk aplikasi dengan kebutuhan konsistensi data yang tinggi.