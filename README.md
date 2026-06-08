# 🚀 ErrorLens

**AI-Powered Error Monitoring & Debugging Platform for Modern Applications**

ErrorLens helps developers capture, monitor, analyze, and resolve application errors in real time. Instead of manually digging through logs, ErrorLens automatically processes errors, identifies possible root causes, and generates AI-powered fix suggestions.

---

## ✨ Features

### 📌 Error Monitoring

* Capture frontend application errors in real time
* Automatic JavaScript error tracking
* Unhandled Promise rejection tracking
* Stack trace collection

### 🤖 AI-Powered Analysis

* Root cause analysis using AI
* Automatic fix suggestions
* Faster debugging workflow

### ⚡ Real-Time Processing

* RabbitMQ-based queue processing
* Asynchronous error handling
* Dead Letter Queue (DLQ) support

### 🚀 Performance Optimized

* Redis caching for repeated errors
* Reduced AI calls
* Faster response times

### 🔐 Secure Project Management

* User authentication
* Project-based isolation
* Unique API keys per project

### 📊 Dashboard

* View captured errors
* Track processing status
* Review AI analysis
* Access fix recommendations

---

# 🏗️ System Architecture

```text
Application
     │
     ▼
ErrorLens SDK
     │
     ▼
Backend API
     │
     ▼
PostgreSQL (Neon)
     │
     ▼
Outbox Table
     │
     ▼
RabbitMQ Queue
     │
     ▼
Worker Service
     │
 ┌───┴────┐
 ▼        ▼
Redis     AI Service
 Cache
     │
     ▼
Dashboard
```

---

# 🛠️ Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Socket.IO Client

## Backend

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication

## Infrastructure

* Neon PostgreSQL
* RabbitMQ
* Redis
* Render
* Vercel

## AI

* OpenAI API

---

# 📦 ErrorLens SDK

Install the SDK:

```bash
npm install @rajatsingh45/errorlens-sdk
```

Initialize:

```javascript
import ErrorLens from "@rajatsingh45/errorlens-sdk";

ErrorLens.init({
  apiKey: "YOUR_API_KEY"
});
```

Manual Error Capture:

```javascript
try {
  throw new Error("Database connection failed");
} catch (err) {
  ErrorLens.capture(err);
}
```

Automatic Error Monitoring:

```javascript
import ErrorLens from "@rajatsingh45/errorlens-sdk";

ErrorLens.init({
  apiKey: "YOUR_API_KEY"
});
```

The SDK automatically captures:

* Runtime JavaScript errors
* Unhandled Promise rejections
* Stack traces

---

# 🚀 Getting Started

## 1. Clone Repository

```bash
git clone https://github.com/RajatSingh45/ErrorLens.git

cd ErrorLens
```

---

## 2. Backend Setup

```bash
cd backend

npm install
```

Create `.env`

```env
DATABASE_URL=
JWT_SECRET=
RABBITMQ_URL=
REDIS_URL=
OPENAI_API_KEY=
FRONTEND_URL=
```

Run backend:

```bash
npm run dev
```

---

## 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# 👨‍💻 Using ErrorLens

## Step 1

Register an account.

## Step 2

Create a new project.

## Step 3

Copy the generated API key.

## Step 4

Install the SDK.

```bash
npm install @rajatsingh45/errorlens-sdk
```

## Step 5

Initialize the SDK.

```javascript
import ErrorLens from "@rajatsingh45/errorlens-sdk";

ErrorLens.init({
  apiKey: "YOUR_API_KEY"
});
```

## Step 6

Start monitoring errors.

---

# 📋 Example Workflow

```text
User Application
      │
      ▼
Error Occurs
      │
      ▼
SDK Captures Error
      │
      ▼
Backend Stores Error
      │
      ▼
RabbitMQ Queue
      │
      ▼
Worker Processes Error
      │
      ▼
Redis Cache Check
      │
      ▼
AI Analysis
      │
      ▼
Dashboard Updated
```

---

# 🔮 Future Roadmap

* Email notifications
* Slack integration
* Discord integration
* Source map support
* Error analytics
* Team collaboration
* Alert rules
* Performance monitoring
* API documentation

---

# 📄 License

MIT License

---

# 👨‍💻 Author

Rajat Singh

GitHub:
https://github.com/RajatSingh45

---

⭐ If you find this project useful, consider giving it a star on GitHub.
