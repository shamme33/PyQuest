const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../.vscode'))); // Serve frontend files

// Load static JSON data
const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/users.json'), 'utf8'));
const tutorialsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/tutorials.json'), 'utf8'));
const quizzesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/quizzes.json'), 'utf8'));

// Simple in-memory storage for sessions (in production, use proper session management)
let sessions = {};

// Routes

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = usersData.find(u => u.email === email && u.password === password);
  if (user) {
    // Override role if selected
    const loginUser = { ...user, role: role || user.role };
    const sessionId = Math.random().toString(36).substring(2);
    sessions[sessionId] = loginUser;
    res.json({ success: true, user: loginUser, sessionId });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Register endpoint
app.post('/api/register', (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  const existingUser = usersData.find(u => u.email === email);
  if (existingUser) {
    res.status(400).json({ success: false, message: 'User already exists' });
  } else {
    const newUser = {
      id: usersData.length + 1,
      firstName,
      lastName,
      email,
      password, // In production, hash this!
      role: role || 'student'
    };
    usersData.push(newUser);
    // Save to file (in production, use database)
    fs.writeFileSync(path.join(__dirname, 'data/users.json'), JSON.stringify(usersData, null, 2));
    res.json({ success: true, user: newUser });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const { sessionId } = req.body;
  delete sessions[sessionId];
  res.json({ success: true });
});

// Get current user (requires session)
app.get('/api/me', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const user = sessions[sessionId];
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(usersData);
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const user = usersData.find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Get all tutorials
app.get('/api/tutorials', (req, res) => {
  res.json(tutorialsData);
});

// Get tutorial by ID
app.get('/api/tutorials/:id', (req, res) => {
  const tutorial = tutorialsData.find(t => t.id === parseInt(req.params.id));
  if (tutorial) {
    res.json(tutorial);
  } else {
    res.status(404).json({ message: 'Tutorial not found' });
  }
});

// Get all quizzes
app.get('/api/quizzes', (req, res) => {
  res.json(quizzesData);
});

// Get quiz by ID
app.get('/api/quizzes/:id', (req, res) => {
  const quiz = quizzesData.find(q => q.id === parseInt(req.params.id));
  if (quiz) {
    res.json(quiz);
  } else {
    res.status(404).json({ message: 'Quiz not found' });
  }
});

// Submit quiz answer (simple simulation)
app.post('/api/quizzes/:id/submit', (req, res) => {
  const { answers } = req.body;
  // Simple scoring logic (just count correct answers)
  const quiz = quizzesData.find(q => q.id === parseInt(req.params.id));
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  let score = 0;
  quiz.questions.forEach((question, index) => {
    if (answers[index] === question.correctAnswer) {
      score++;
    }
  });

  res.json({
    score: score,
    total: quiz.questions.length,
    percentage: Math.round((score / quiz.questions.length) * 100)
  });
});

// Catch-all handler: send back index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../.vscode/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PyQuest backend server running on http://localhost:${PORT}`);
});