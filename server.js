// ===============================
// SMART CAMPUS - SINGLE BACKEND
// ===============================

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// MYSQL CONNECTION
// ===============================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Varsh@2466",
  database: "smart_campus"
});

// Connect and setup DB + Tables
db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL Connected");

  // Create DB
  db.query("CREATE DATABASE IF NOT EXISTS smart_campus", () => {
    db.query("USE smart_campus", () => {

      // Students Table
      db.query(`
        CREATE TABLE IF NOT EXISTS students (
          id VARCHAR(20) PRIMARY KEY,
          name VARCHAR(100),
          dept VARCHAR(50),
          sem VARCHAR(10)
        )
      `);

      // Subjects Table
      db.query(`
        CREATE TABLE IF NOT EXISTS subjects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id VARCHAR(20),
          subject_name VARCHAR(100),
          present INT,
          held INT,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
      `);

      console.log("✅ Database & Tables Ready");
    });
  });
});

// ===============================
// ROUTES
// ===============================

// ➕ ADD STUDENT
app.post("/students", (req, res) => {
  const { id, name, dept, sem } = req.body;

  const sql = "INSERT INTO students VALUES (?, ?, ?, ?)";
  db.query(sql, [id, name, dept, sem], (err) => {
    if (err) return res.status(500).send(err);
    res.send("✅ Student Added");
  });
});

// 📥 GET ALL STUDENTS
app.get("/students", (req, res) => {
  const sql = `
    SELECT s.id, s.name, s.dept, s.sem,
           sub.subject_name, sub.present, sub.held
    FROM students s
    LEFT JOIN subjects sub
    ON s.id = sub.student_id
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);

    const studentsMap = {};

    result.forEach(row => {
      if (!studentsMap[row.id]) {
        studentsMap[row.id] = {
          id: row.id,
          name: row.name,
          dept: row.dept,
          sem: row.sem,
          subjects: []
        };
      }

      if (row.subject_name) {
        studentsMap[row.id].subjects.push({
          name: row.subject_name,
          present: row.present,
          held: row.held
        });
      }
    });

    res.json(Object.values(studentsMap));
  });
});
// 📥 GET STUDENT + SUBJECTS
app.get("/students/:id", (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT s.*, sub.subject_name, sub.present, sub.held
    FROM students s
    LEFT JOIN subjects sub ON s.id = sub.student_id
    WHERE s.id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// ✏️ UPDATE STUDENT
app.put("/students/:id", (req, res) => {
  const id = req.params.id;
  const { name, dept, sem } = req.body;

  const sql = "UPDATE students SET name=?, dept=?, sem=? WHERE id=?";
  db.query(sql, [name, dept, sem, id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("✏️ Student Updated");
  });
});

// ❌ DELETE STUDENT
app.delete("/students/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM students WHERE id=?", [id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("🗑️ Student Deleted");
  });
});

// ➕ ADD SUBJECT
app.post("/subjects", (req, res) => {
  const { student_id, subject_name, present, held } = req.body;

  const sql = `
    INSERT INTO subjects (student_id, subject_name, present, held)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [student_id, subject_name, present, held], (err) => {
    if (err) return res.status(500).send(err);
    res.send("📘 Subject Added");
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});