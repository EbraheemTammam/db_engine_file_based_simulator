# Database engine project
***
#### description:

a file based database engine that supports essential sql standard operations on csv files rather than binary pages
***
#### endpoints:

there are 3 endpoints in total
- POST /execute/ddl
  for executing DDL commands (CREATE TABLE, ALTER TABLE, TRUNCATE TABLE, DROP TABLE)
- POST /execute/dml
  for executing DML commands (INSERT, UPDATE, DELETE, SELECT)
- GET /history
  to get history of successful operations (date, time and query)

##### schema:

- for execute ddl/dml endpoints it just takes sql query as raw string buffer
- for get history there's an optional **date** query parameter if provided will return history of that specific date otherwise will return history of today
***
#### example on DDL:

request:
```sql
CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY, 
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL
);
TRUNCATE TABLE users;
ALTER TABLE users ADD column age INT NOT NULL;
ALTER TABLE users DROP column age;
ALTER TABLE users rename TO accounts;
DROP TABLE accounts;
```

response
```json
[
    {
        "type": "COMMAND",
        "tag": "CREATE TABLE"
    },
    {
        "type": "COMMAND",
        "tag": "TRUNCATE TABLE"
    },
    {
        "type": "COMMAND",
        "tag": "ALTER TABLE"
    },
    {
        "type": "COMMAND",
        "tag": "ALTER TABLE"
    },
    {
        "type": "COMMAND",
        "tag": "ALTER TABLE"
    },
    {
        "type": "COMMAND",
        "tag": "DROP TABLE"
    }
]
```
***
#### example on get history:

response:
```json
[
    {
        "time": "12/23/2025 1:46:44 PM",
        "query": "CREATE TABLE IF NOT EXISTS users ( id SERIAL PRIMARY KEY "
    },
    {
        "time": "12/23/2025 1:46:44 PM",
        "query": "TRUNCATE TABLE users"
    },
    {
        "time": "12/23/2025 1:46:44 PM",
        "query": "ALTER TABLE users ADD column age INT NOT NULL"
    },
    {
        "time": "12/23/2025 1:46:44 PM",
        "query": "ALTER TABLE users DROP column age"
    },
    {
        "time": "12/23/2025 1:46:44 PM",
        "query": "ALTER TABLE users RENAME TO accounts"
    },
    {
        "time": "12/23/2025 1:46:44 PM",
        "query": "DROP TABLE accounts"
    }
]
```
***
#### example on DML:

request:
```sql
INSERT INTO users(first_name, last_name, age) 
    VALUES ('Mohamed', 'Hesham', 23), 
           ('Akrm', 'Faheem', 23),
           ('Abdo', 'Etman', 23),
           ('Ebraheem', 'Ahmed', 24),
           ('Amin', 'Ahmed', 25), -- or 26 idk
           ('Some', 'Body', 24),
           ('Mahmoud', 'ElShaieb', 23)
           ;
UPDATE users SET first_name = 'Ahmed', age = 48 WHERE last_name = 'Ebraheem';
DELETE FROM users WHERE id >= 5;
SELECT * FROM users ORDER BY age, first_name LIMIT 3;
```

response:
```json
[
    {
        "type": "COMMAND",
        "tag": "INSERT",
        "row_count": 7
    },
    {
        "type": "COMMAND",
        "tag": "UPDATE",
        "row_count": 0
    },
    {
        "type": "COMMAND",
        "tag": "DELETE",
        "row_count": 3
    },
    {
        "type": "ROWS",
        "tag": "SELECT",
        "row_count": 4,
        "rows": [
            [
                3,
                "Abdo",
                "Etman",
                23
            ],
            [
                2,
                "Akrm",
                "Faheem",
                23
            ],
            [
                1,
                "Mohamed",
                "Hesham",
                23
            ]
        ]
    }
]
```