// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());

// Connect to MongoDB

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected ✅'))
  .catch(err => console.error('MongoDB Connection Error ❌:', err));



// JWT Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }
  const bearerToken = token.split(' ')[1];
  jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token error ❌:', err });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Example Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Task = mongoose.model('Task', taskSchema);

// Routes
app.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.query.user_id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks ❌:', err });
  }
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    // Perform login logic here (e.g., check user credentials in database)
  
    if (/* invalid credentials */){
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  
    // Generate a token for the user
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ token });
  });
  
app.post('/tasks', authMiddleware, async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const newTask = new Task({ title, description, status, userId: req.userId });
    await newTask.save();
    res.json({ message: 'Task created ✅', task: newTask });
  } catch (err) {
    res.status(500).json({ message: 'Error creating task ❌:', err });
  }
});

app.put('/tasks/:id', authMiddleware, async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status },
      { new: true }
    );
    res.json({ message: 'Task updated ✅', task: updatedTask });
  } catch (err) {
    res.status(500).json({ message: 'Error updating task ❌:', err });
  }
});

app.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting task ❌:', err });
  }
});

// Start the server
const PORT = process.env.PORT || 5040;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});
