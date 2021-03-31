#!/bin/bash

RETRIES=10

PSQL="psql -U ${POSTGRES_USER} -h ${DB_HOST}"
until ${PSQL} -c "SELECT 1"> /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    echo "Waiting for postgres, $((RETRIES--))..."
    sleep 2
done

# populate the database with a table and some rows
${PSQL} -c "CREATE TABLE users (id int PRIMARY KEY NOT NULL, name text);"
${PSQL} -c "CREATE TABLE papers (id int PRIMARY KEY NOT NULL, title text, author int REFERENCES users(id));";
${PSQL} -f - <<EOF
CREATE TABLE reviews (
  id int PRIMARY KEY NOT NULL,
  score int,
  author int REFERENCES users(id),
  paper int REFERENCES papers(id)
);
EOF

${PSQL} -c "INSERT INTO users (id, name) VALUES (1, 'alice'), (2, 'bob'), (3, 'carol')"
${PSQL} -c "INSERT INTO papers (id, title, author) VALUES (1, 'toward hypergeometry', 1)"
${PSQL} -c "INSERT INTO papers (id, title, author) VALUES (2, 'bobs great paper', 2)"
${PSQL} -c "INSERT INTO papers (id, title, author) VALUES (3, 'bobs next great paper', 2)"

${PSQL} -c "INSERT INTO reviews (id, paper, score, author) VALUES (1, 2, 10, 1)"
${PSQL} -c "INSERT INTO reviews (id, paper, score, author) VALUES (2, 3, 20, 1)"

# Putting this after database initialization because compilation
# depends on the above tables existing.
cd /tapeworm/magic_demo && make compile
