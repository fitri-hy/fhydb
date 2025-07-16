<img src="./icon.png"/>

# FhyDB

FhyDB adalah sebuah proyek percobaan prototipe database lokal sederhana yang menyimpan data dalam format file teks (`.fdb`), dirancang untuk mendukung operasi dasar seperti select, insert, update, delete, dan pengelolaan tabel. 

## Instalasi

Pastikan Anda memiliki Node.js terinstal. Untuk menggunakan driver ini, cukup salin kode ke dalam file JavaScript dan import ke dalam proyek Anda.

## Definisi Struktur

### Inisialisasi

Untuk memulai menggunakan FDB, buat instance dari kelas FDB dengan memberikan path file untuk menyimpan data.

```
const FDB = require('./fhydb');
const db = new FDB('./database.fdb');
```

### Mengaktifkan/menonaktifkan Logging

Anda dapat mengaktifkan atau menonaktifkan logging untuk memantau operasi yang dilakukan.

```
db.enableLog();
db.disableLog(); // default
```

### Membuat Tabel

Untuk membuat tabel baru, gunakan metode createTable.

```
db.createTable('users', [
  { col: 'id', type: 'int' },
  { col: 'name', type: 'string' },
  { col: 'email', type: 'string' }
]);
```

### Menyisipkan Data

Untuk menyisipkan data ke dalam tabel, gunakan metode insert.

```
db.insert('users', { name: 'John Doe', email: 'john@example.com' });
```

* `id` akan otomatis dibuat jika tidak ada (auto-increment).

### Memperbarui Data

Untuk memperbarui data yang ada, gunakan metode update.

```
db.update('users', row => row.id === 1, { email: 'john.doe@example.com' });
```

### Menghapus Data

Untuk menghapus data, gunakan metode delete.

```
db.delete('users', row => row.id === 1);
```

### Mengambil Data

Untuk mengambil data dari tabel, gunakan metode select.

```
const users = db.select('users');
```

### Mengurutkan Data

Untuk mengurutkan data berdasarkan kolom tertentu, gunakan metode orderBy.

```
const sortedUsers = db.orderBy('users', 'name', 'asc');
```

* Mendukung asc, desc, rand

### Membatasi Hasil

Untuk membatasi jumlah hasil yang diambil, gunakan metode limit.

```
const limitedUsers = db.limit(users, 5);
```

### Menghapus Tabel

Untuk menghapus tabel, gunakan metode dropTable.

```
db.dropTable('users');
```

### Mengubah Struktur Tabel

Untuk mengubah struktur tabel, gunakan metode alterTable.

```
db.alterTable('users', [
  { col: 'id', type: 'int' },
  { col: 'name', type: 'string' },
  { col: 'email', type: 'string' },
  { col: 'age', type: 'int' } // Menambahkan kolom baru
]);
```

### Relasi Antara Tabel

Untuk membuat relasi antara dua tabel, gunakan metode relate.

```
const relatedData = db.relate('orders', 'userId', 'users', 'id');
```

### Eksekusi Query Mentah

Untuk menjalankan query mentah, gunakan metode raw.

```
db.raw(tables => {
  // Operasi mentah pada tabel
});
```

### Mengonversi ke JSON

Untuk mendapatkan representasi JSON dari database, gunakan metode toJSON.

```
const jsonData = db.toJSON();
```

### Menyimpan Data

Data secara otomatis disimpan ke dalam file setiap kali ada perubahan. Namun, Anda juga dapat memanggil metode _save secara manual jika diperlukan.

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

| Metode | Parameter | Return Value | Deskripsi |
|--------|-----------|--------------|-----------|
| `select(table, whereFn)` | `table`: string, `whereFn`: function | Array | Mengambil data dari tabel |
| `insert(table, data)` | `table`: string, `data`: object | object | Menyisipkan data baru |
| `update(table, whereFn, newData)` | `table`: string, `whereFn`: function, `newData`: object | void | Memperbarui data yang ada |
| `delete(table, whereFn)` | `table`: string, `whereFn`: function | void | Menghapus data |
| `createTable(name, schema)` | `name`: string, `schema`: array | void | Membuat tabel baru |
| `dropTable(name)` | `name`: string | void | Menghapus tabel |
| `alterTable(name, newSchema)` | `name`: string, `newSchema`: array | void | Mengubah struktur tabel |
| `orderBy(table, column, direction)` | `table`: string, `column`: string, `direction`: string | Array | Mengurutkan data |
| `limit(rows, count)` | `rows`: array, `count`: number | Array | Membatasi jumlah data |
| `relate(fromTable, fromKey, toTable, toKey)` | `fromTable`: string, `fromKey`: string, `toTable`: string, `toKey`: string | Array | Membuat relasi antar tabel |
| `raw(callback)` | `callback`: function | Variabel | Eksekusi query mentah |

## Contoh Penggunaan

### Penggunaan Asynchronous

```javascript
// Saat ini FDB bersifat synchronous
// Contoh implementasi async jika ditambahkan di masa depan:
async function asyncInsert(table, data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(db.insert(table, data));
    }, 0);
  });
}

// Penggunaan:
const result = await asyncInsert('users', {name: 'Async User'});
```

### Penggunaan Lengkap

```javascript
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
```

## Catatan

* Pastikan untuk memeriksa tipe data saat menyisipkan atau memperbarui data agar sesuai dengan skema tabel.
* Driver ini tidak mendukung transaksi atau penguncian, sehingga tidak cocok untuk aplikasi dengan kebutuhan konsistensi data yang tinggi.