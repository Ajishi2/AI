package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"io"
	"net/http"
	"os"
	"time"
    "bytes"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// JWT claims struct
type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// Environment variables
var jwtSecret string
var mongoURI string
var openAIKey string

// MongoDB client
var client *mongo.Client

// Task struct
type Task struct {
	ID          string    `json:"id" bson:"_id"`
	Title       string    `json:"title" bson:"title"`
	Description string    `json:"description" bson:"description"`
	Status      string    `json:"status" bson:"status"`       // e.g., "todo", "in-progress", "completed"
	Priority    string    `json:"priority" bson:"priority"`   // e.g., "low", "medium", "high"
	DueDate     time.Time `json:"due_date" bson:"due_date"`   // Due date for the task
	UserID      string    `json:"user_id" bson:"user_id"`     // ID of the user who owns the task
	CreatedAt   time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" bson:"updated_at"`
}

// WebSocket clients
var clients = make(map[*websocket.Conn]bool) // Track connected clients
var broadcast = make(chan Task)              // Channel for broadcasting updates

// Load environment variables
func loadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	jwtSecret = os.Getenv("JWT_SECRET")
	mongoURI = os.Getenv("MONGO_URI")
	openAIKey = os.Getenv("OPENAI_API_KEY")
}

// Connect to MongoDB
func connectMongoDB() {
	var err error
	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err = mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatal("MongoDB Connection Failed:", err)
	}
	fmt.Println("Connected to MongoDB!")
}

// JWT Middleware
func jwtMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Generate JWT token
func generateJWT(username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

// WebSocket handler
func handleConnections(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade failed:", err)
		return
	}
	defer conn.Close()

	clients[conn] = true

	for {
		var task Task
		err := conn.ReadJSON(&task)
		if err != nil {
			log.Println("Read error:", err)
			delete(clients, conn)
			break
		}
		broadcast <- task
	}
}

// Broadcast task updates to all clients
func handleMessages() {
	for {
		task := <-broadcast
		for client := range clients {
			err := client.WriteJSON(task)
			if err != nil {
				log.Println("Write error:", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

// Handle user login and generate JWT token
func loginHandler(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// Decode the request body into creds
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Normally you'd check the credentials against a database here.
	// For simplicity, we'll assume any username and password are valid.
	if creds.Username == "" || creds.Password == "" {
		http.Error(w, "Username and password required", http.StatusBadRequest)
		return
	}

	// Generate a JWT token for the user
	token, err := generateJWT(creds.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Return the token as a response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

// Create a new task
func createTask(w http.ResponseWriter, r *http.Request) {
	var task Task
	err := json.NewDecoder(r.Body).Decode(&task)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	task.ID = primitive.NewObjectID().Hex()
	task.CreatedAt = time.Now()
	task.UpdatedAt = time.Now()

	collection := client.Database("taskmanager").Collection("tasks")
	_, err = collection.InsertOne(context.TODO(), task)
	if err != nil {
		http.Error(w, "Failed to create task", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)

	// Broadcast the new task to all connected clients
	broadcast <- task
}
// Update task status by ID
func updateTaskStatus(w http.ResponseWriter, r *http.Request) {
	// Extract task ID from the URL
	params := mux.Vars(r)
	taskID := params["id"]

	// Parse the request body to get the new status
	var update struct {
		Status string `json:"status"`
	}
	err := json.NewDecoder(r.Body).Decode(&update)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Create a MongoDB filter and update
	filter := bson.M{"_id": taskID}
	updateData := bson.M{"$set": bson.M{"status": update.Status, "updated_at": time.Now()}}

	collection := client.Database("taskmanager").Collection("tasks")
	_, err = collection.UpdateOne(context.TODO(), filter, updateData)
	if err != nil {
		http.Error(w, "Failed to update task", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Task status updated successfully"})
}

// Get all tasks for a user
func getTasks(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	collection := client.Database("taskmanager").Collection("tasks")
	filter := bson.M{"user_id": userID}

	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		http.Error(w, "Failed to fetch tasks", http.StatusInternalServerError)
		return
	}

	var tasks []Task
	if err = cursor.All(context.TODO(), &tasks); err != nil {
		http.Error(w, "Failed to decode tasks", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tasks)
}
func deleteTask(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    taskID := vars["id"]

    collection := client.Database("taskmanager").Collection("tasks")
    result, err := collection.DeleteOne(context.TODO(), bson.M{"_id": taskID})
    
    if err != nil {
        http.Error(w, "Failed to delete task", http.StatusInternalServerError)
        return
    }

    if result.DeletedCount == 0 {
        http.Error(w, "Task not found", http.StatusNotFound)
        return
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Task deleted successfully"})
}
// Update task status by ID
// AI-powered task suggestion using Cohere API
func aiSuggestTask(w http.ResponseWriter, r *http.Request) {
    var input struct {
        Description string `json:"description"`
    }
    err := json.NewDecoder(r.Body).Decode(&input)
    if err != nil {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request payload"})
        return
    }

    log.Printf("Calling Cohere API with description: %s\n", input.Description)

    // Prepare the request to Cohere's API
    apiKey := os.Getenv("COHERE_API_KEY")
    if apiKey == "" {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Cohere API key is missing"})
        return
    }

    cohereURL := "https://api.cohere.ai/generate"  // Cohere's API endpoint

    // Build the request payload
    requestBody, err := json.Marshal(map[string]interface{}{
        "model":      "command-xlarge-nightly", // Specify the model to use
        "prompt":     "You are a helpful task management assistant. Suggest a task based on the user's description: " + input.Description,
        "max_tokens": 200,   // Limit the number of tokens (response length)
        "temperature": 0.7,  // Temperature for creativity
    })
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to build request"})
        return
    }

    // Create a new HTTP request
    req, err := http.NewRequest("POST", cohereURL, bytes.NewBuffer(requestBody))
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create request"})
        return
    }

    // Add headers
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+apiKey)

    // Send the request
    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        log.Printf("Cohere API error: %v\n", err)
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate AI suggestion"})
        return
    }
    defer resp.Body.Close()

    // Log the entire response body
    responseBody, err := io.ReadAll(resp.Body)
    if err != nil {
        log.Printf("Failed to read response body: %v\n", err)
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to read AI suggestion"})
        return
    }
    log.Printf("Cohere API full response: %s\n", string(responseBody))

    // Parse the response
    var cohereResp struct {
        Text string `json:"text"`
    }
    err = json.Unmarshal(responseBody, &cohereResp)
    if err != nil {
        log.Printf("Failed to parse Cohere API response: %v\n", err)
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to parse AI suggestion"})
        return
    }

    // Log the suggestion text
    log.Printf("Cohere API suggestion: %s\n", cohereResp.Text)

    // Return the suggestion
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"suggestion": cohereResp.Text})
}

// Main function
func main() {
	// Load environment variables
	loadEnv()

	// Connect to MongoDB
	connectMongoDB()

	// Start the WebSocket message handler
	go handleMessages()

	// Initialize the router
	r := mux.NewRouter()

	// WebSocket route
	r.HandleFunc("/ws", handleConnections)
    r.HandleFunc("/tasks/{id}", deleteTask).Methods("DELETE")
	// Task routes
	r.HandleFunc("/tasks", createTask).Methods("POST")
	r.HandleFunc("/tasks", getTasks).Methods("GET")
	r.HandleFunc("/tasks/{id}", updateTaskStatus).Methods("PATCH")

	// AI route
	r.HandleFunc("/ai/suggest", aiSuggestTask).Methods("POST")

	// Authentication route
	r.HandleFunc("/login", loginHandler).Methods("POST")

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"}, // Allow frontend origin
		AllowedMethods:   []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	// Wrap the router with the CORS handler
	handler := c.Handler(r)

	// Start the server
	fmt.Println("Server started on :5040")
	log.Fatal(http.ListenAndServe(":5040", handler))
}
