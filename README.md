# Task Master AI

A modern task management application powered by AI, built with React, Go, and MongoDB. The application features an AI-powered task suggestion system, real-time updates, and a responsive interface.

## Features

- 🤖 AI-powered task suggestions using Cohere API
- 📊 Dynamic task dashboard with statistics
- 🔄 Real-time updates using WebSocket
- 📱 Responsive design for all devices
- 🎯 Task prioritization and status management
- 🔍 Filter tasks by status and priority
- 🎨 Grid and list view options

## Tech Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Real-time WebSocket integration
- Vercel for deployment
https://ai-pnuv-6zmku5wtk-ajishi2s-projects.vercel.app/

### Backend
- Go (Golang)
- MongoDB for data storage
- Cohere API for AI suggestions
- WebSocket for real-time updates
- Render.com for deployment
https://ai-rcan.onrender.com
## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Go (v1.16 or higher)
- MongoDB
- Cohere API key

### Environment Variables

#### Backend (.env)
```
MONGO_URI=your_mongodb_uri
COHERE_API_KEY=your_cohere_api_key
JWT_SECRET=your_jwt_secret
```

### Installation

1. Clone the repository
```bash
git clone <repository-url>
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Install backend dependencies
```bash
cd backend
go mod download
```

### Running the Application

1. Start the backend server
```bash
cd backend
go run main.go
```
The server will start on port 5040.

2. Start the frontend development server
```bash
cd frontend
npm run dev
```
The frontend will start on port 3000.

## Project Structure

### Frontend
```
frontend/
  ├── components/
  │   ├── TaskForm.tsx
  │   ├── TaskList.tsx
  │   └── AiSuggestion.tsx
  ├── pages/
  │   └── index.tsx
  └── ...
```

### Backend
```
backend/
  ├── main.go
  ├── go.mod
  └── go.sum
```

## API Endpoints

- `POST /tasks` - Create a new task
- `GET /tasks` - Get all tasks for a user
- `PATCH /tasks/{id}` - Update task status
- `DELETE /tasks/{id}` - Delete a task
- `POST /ai/suggest` - Get AI-powered task suggestions
- `WS /ws` - WebSocket connection for real-time updates

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy

## CORS Configuration

Make sure to update the CORS configuration in the backend to allow requests from your Vercel domain:

```go
c := cors.New(cors.Options{
    AllowedOrigins: []string{
        "http://localhost:3000",
        "https://your-vercel-domain.vercel.app"
    },
    AllowedMethods: []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
    AllowedHeaders: []string{"Authorization", "Content-Type"},
    AllowCredentials: true,
})
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

