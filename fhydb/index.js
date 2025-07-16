const fs = require("fs");

let LOG_ENABLED = false;
function setLogEnabled(enabled) { LOG_ENABLED = enabled; }
function asciiTable(data) {
  if (!data || data.length === 0) return "(no rows)";
  const columns = Object.keys(data[0]);
  const widths = columns.map(col => col.length);
  data.forEach(row => {
    columns.forEach((col, i) => {
      const val = row[col] == null ? '' : String(row[col]);
      if (val.length > widths[i]) widths[i] = val.length;
    });
  });
  const makeRow = (vals) => "| " + vals.map((v, i) => v.toString().padEnd(widths[i])).join(" | ") + " |";
  const header = makeRow(columns);
  const separator = "|" + widths.map(w => "-".repeat(w + 2)).join("|") + "|";
  const rows = data.map(row => makeRow(columns.map(col => {
    const v = row[col];
    return v instanceof Date ? v.toISOString() : (v == null ? '' : v);
  })));
  return [separator, header, separator, ...rows, separator].join("\n");
}
function logOperation(opName, description, data = null) {
  if (!LOG_ENABLED) return;
  console.log(`\nOperation: ${opName}`);
  console.log(`${description}`);
  if (data) {
    if (Array.isArray(data)) {
      console.log(asciiTable(data));
    } else if (typeof data === 'object') {
      if (Object.values(data).some(v => typeof v === 'object')) {
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(asciiTable([data]));
      }
    } else {
      console.log(data);
    }
  }
  console.log("");
}

class FDB {
  constructor(filePath, options = {}) {
    if (!('username' in options)) options.username = "root";
    if (!('password' in options)) options.password = "";

    if (!fs.existsSync(filePath)) {
      if (!options.username || options.password === undefined) {
        throw new Error("Database file does not exist. To create new DB, username and password are required.");
      }
      const authLine = `#AUTH|username:${options.username}|password:${options.password}`;
      fs.writeFileSync(filePath, authLine + "\n");
      console.log(`Database file '${filePath}' created automatically with provided username and password.`);
    }

    const content = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);

    const authLine = content[0] || "";
    if (!authLine.startsWith("#AUTH")) {
      throw new Error("Database file missing auth header");
    }
    const parts = authLine.split("|");
    let fileUsername = null, filePassword = null;
    parts.forEach(part => {
      if (part.startsWith("username:")) fileUsername = part.slice(9);
      else if (part.startsWith("password:")) filePassword = part.slice(9);
    });

    if (!options.username || options.username === undefined) {
      throw new Error("Authentication required: username must be provided.");
    }
    if (options.username !== fileUsername || options.password !== filePassword) {
      throw new Error("Authentication failed: invalid username or password.");
    }

    this.filePath = filePath;
    this.tables = {};
    this._load(content.slice(1));
  }

  static createDatabase(filePath, options = {}) {
    if (fs.existsSync(filePath)) {
      throw new Error(`Database file already exists: ${filePath}`);
    }
    if (!options.username || !options.password) {
      throw new Error("Username and password are required to create database.");
    }
    const authLine = `#AUTH|username:${options.username}|password:${options.password}`;
    fs.writeFileSync(filePath, authLine + "\n");
    console.log(`Database created at: ${filePath} with username: ${options.username}`);
  }

  enableLog() { setLogEnabled(true); }
  disableLog() { setLogEnabled(false); }

  _load(lines) {
    this.tables = {};
    let currentTable = null;
    for (const line of lines) {
      if (!line.trim()) continue;
      if (line.startsWith("#TABLE")) {
        const parts = line.split("|");
        const tableMatch = parts[0].match(/^#TABLE\s+(\w+)/);
        if (!tableMatch) continue;
        const name = tableMatch[1];
        const schema = parts.slice(1).map(col => {
          const [colName, type] = col.split(":");
          return { col: colName, type };
        }).filter(col => col.col && col.type);
        currentTable = { name, schema, rows: [], lastId: 0 };
        this.tables[name] = currentTable;
      } else if (currentTable) {
        const values = line.split("|");
        const row = {};
        currentTable.schema.forEach((s, i) => {
          row[s.col] = this._cast(values[i], s.type);
        });
        currentTable.rows.push(row);
      }
    }
    for (const tblName in this.tables) {
      const tbl = this.tables[tblName];
      const maxId = tbl.rows.reduce((max, r) => (typeof r.id === 'number' && r.id > max ? r.id : max), 0);
      tbl.lastId = maxId;
    }
  }

  _save() {
    const lines = [];
    const content = fs.readFileSync(this.filePath, "utf-8").split(/\r?\n/);
    const authLine = content[0];
    lines.push(authLine);

    for (const tableName in this.tables) {
      const tbl = this.tables[tableName];
      const header = `#TABLE ${tableName}|` + tbl.schema.map(s => `${s.col}:${s.type}`).join("|");
      lines.push(header);
      tbl.rows.forEach(row => {
        const rowStr = tbl.schema.map(s => this._reverseCast(row[s.col], s.type)).join("|");
        lines.push(rowStr);
      });
    }
    fs.writeFileSync(this.filePath, lines.join("\n"));
    const contentReload = fs.readFileSync(this.filePath, "utf-8").split(/\r?\n/);
    this._load(contentReload.slice(1));
  }

  _cast(val, type) {
    if (val == null || val === '') return null;
    switch(type) {
      case "int": return parseInt(val, 10);
      case "float": return parseFloat(val);
      case "boolean": return val === 'true' || val === true;
      case "datetime": return val ? new Date(parseInt(val, 10) * 1000) : null;
      default: return val;
    }
  }

  _reverseCast(val, type) {
    if (val == null) return '';
    switch(type) {
      case "datetime": return val instanceof Date ? Math.floor(val.getTime() / 1000) : val;
      case "boolean": return val ? 'true' : 'false';
      default: return val;
    }
  }

  _validateData(schema, data) {
    for (const {col, type} of schema) {
      if (data[col] == null) continue;
      switch(type) {
        case "int":
          if (typeof data[col] !== "number" || !Number.isInteger(data[col])) {
            throw new Error(`Invalid value for column '${col}': expected int`);
          }
          break;
        case "float":
          if (typeof data[col] !== "number") {
            throw new Error(`Invalid value for column '${col}': expected float`);
          }
          break;
        case "boolean":
          if (typeof data[col] !== "boolean") {
            throw new Error(`Invalid value for column '${col}': expected boolean`);
          }
          break;
        case "datetime":
          if (!(data[col] instanceof Date)) {
            throw new Error(`Invalid value for column '${col}': expected Date object`);
          }
          break;
        default:
          break;
      }
    }
  }

  select(table, whereFn = null, log = true) {
    const rows = this.tables[table]?.rows || [];
    const result = whereFn ? rows.filter(whereFn) : rows;
    if (log) logOperation("select()", `Fetch from '${table}'`, result);
    return result;
  }

  insert(table, data) {
    const tbl = this.tables[table];
    if (!tbl) throw new Error("Table not found: " + table);
    this._validateData(tbl.schema, data);
    if (!data.id) {
      tbl.lastId++;
      data.id = tbl.lastId;
    } else if (data.id > tbl.lastId) {
      tbl.lastId = data.id;
    }
    const idx = tbl.rows.findIndex(row => row.id === data.id);
    if (idx >= 0) {
      tbl.rows[idx] = { ...tbl.rows[idx], ...data };
      logOperation("insert()", `Update in '${table}' id=${data.id}`, tbl.rows[idx]);
    } else {
      const newRow = {};
      tbl.schema.forEach(s => newRow[s.col] = data[s.col] !== undefined ? data[s.col] : null);
      tbl.rows.push(newRow);
      logOperation("insert()", `Add new to '${table}'`, newRow);
    }
    this._save();
    return data;
  }

  update(table, whereFn, newData) {
    const tbl = this.tables[table];
    if (!tbl) throw new Error("Table not found: " + table);
    this._validateData(tbl.schema, newData);
    let changed = false;
    tbl.rows.forEach(row => {
      if (whereFn(row)) {
        Object.keys(newData).forEach(k => {
          row[k] = newData[k];
        });
        changed = true;
      }
    });
    if (changed) {
      this._save();
      logOperation("update()", `Update in '${table}'`, newData);
    }
  }

  delete(table, whereFn) {
    const tbl = this.tables[table];
    if (!tbl) throw new Error("Table not found: " + table);
    const deletedRows = tbl.rows.filter(whereFn);
    tbl.rows = tbl.rows.filter(row => !whereFn(row));
    if (deletedRows.length > 0) {
      this._save();
      logOperation("delete()", `Delete from '${table}'`, deletedRows);
    }
  }

  orderBy(table, column, direction = "asc") {
    const rows = this.select(table, null, false);
    let sorted;
    if (direction === "rand") {
      sorted = [...rows].sort(() => Math.random() - 0.5);
    } else {
      sorted = [...rows].sort((a, b) => {
        if (direction === "desc") return a[column] < b[column] ? 1 : -1;
        return a[column] > b[column] ? 1 : -1;
      });
    }
    logOperation("orderBy()", `Sort '${table}' by '${column}' (${direction})`, sorted);
    return sorted;
  }

  limit(rows, count) {
    const limited = rows.slice(0, count);
    logOperation("limit()", `Limit to ${count} rows`, limited);
    return limited;
  }

  createTable(name, schema) {
    if (this.tables[name]) throw new Error("Table already exists: " + name);
    this.tables[name] = {
      name,
      schema,
      rows: [],
      lastId: 0,
    };
    this._save();
    logOperation("createTable()", `Table '${name}' created`, schema);
  }

  dropTable(name) {
    if (!this.tables[name]) throw new Error("Table not found: " + name);
    delete this.tables[name];
    this._save();
    logOperation("dropTable()", `Table '${name}' deleted`);
  }

  alterTable(name, newSchema) {
    const tbl = this.tables[name];
    if (!tbl) throw new Error("Table not found: " + name);
    const oldCols = tbl.schema.map(s => s.col);
    const newCols = newSchema.map(s => s.col);
    tbl.schema = newSchema;
    tbl.rows = tbl.rows.map(row => {
      const newRow = {};
      newCols.forEach(col => {
        newRow[col] = col in row ? row[col] : null;
      });
      return newRow;
    });
    this._save();
    logOperation("alterTable()", `Table '${name}' schema changed`, newSchema);
  }

  relate(fromTable, fromKey, toTable, toKey) {
    if (!this.tables[fromTable] || !this.tables[toTable]) throw new Error("Table not found");
    const relatedNameCol = this.tables[toTable].schema[0]?.col || toKey;
    const result = this.tables[fromTable].rows.map(row => {
      const related = this.tables[toTable].rows.find(r => r[toKey] === row[fromKey]);
      return { ...row, [toTable]: related ? related[relatedNameCol] : null };
    });
    logOperation("relate()", `Relation ${fromTable}.${fromKey} → ${toTable}.${toKey}`, result);
    return result;
  }

  raw(callback) {
    const result = callback(this.tables);
    logOperation("raw()", "Raw query executed", result);
    return result;
  }

  toJSON() {
    const json = JSON.stringify(this.tables, null, 2);
    console.log("\nOperation: toJSON()");
    console.log("Dump in JSON format");
    console.log(json);
    console.log("");
    return json;
  }
  
  hasTable(name) {
    const exists = !!this.tables[name];
    logOperation("hasTable()", `Check existence of table '${name}'`, exists);
    return exists;
  }

getTables() {
  const tableNames = Object.keys(this.tables);
  logOperation("getTables()", "List all available tables", tableNames.map(name => ({table: name})));
  return tableNames;
}
}


module.exports = FDB;
