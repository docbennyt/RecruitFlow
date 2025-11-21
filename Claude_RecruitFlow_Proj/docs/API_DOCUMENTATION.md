# RecruitFlow API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-api.com/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### POST /auth/register
Register a new employer account.

**Request Body:**
```json
{
  "email": "employer@company.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "company_name": "Acme Corp",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "email": "employer@company.com",
      "full_name": "John Doe",
      "company_name": "Acme Corp",
      "role": "employer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login
Login as employer.

**Request Body:**
```json
{
  "email": "employer@company.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/admin-login
Login as admin.

**Request Body:**
```json
{
  "email": "admin@recruitflow.com",
  "password": "admin123"
}
```

**Response:** Same as employer login

### GET /auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "employer@company.com",
    "full_name": "John Doe",
    "company_name": "Acme Corp",
    "role": "employer",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## CV Endpoints

### POST /cvs/upload
Upload one or more CV files (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form Data:
files: [file1.pdf, file2.docx, ...]
```

**Response (201):**
```json
{
  "success": true,
  "message": "2 CV(s) uploaded",
  "data": [
    {
      "id": 1,
      "filename": "john_doe_cv.pdf",
      "status": "pending",
      "message": "CV uploaded successfully and queued for processing"
    },
    {
      "id": 2,
      "filename": "jane_smith_cv.pdf",
      "status": "pending",
      "message": "CV uploaded successfully and queued for processing"
    }
  ]
}
```

### GET /cvs
Get all CVs with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)
- `search` (string): Search term
- `skills` (string): Comma-separated skills
- `minExperience` (number): Minimum years of experience

**Example:**
```
GET /cvs?page=1&limit=20&search=developer&skills=python,django
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cvs": [
      {
        "id": 1,
        "filename": "john_doe_cv.pdf",
        "candidate_name": "John Doe",
        "current_role": "Senior Developer",
        "experience_years": 5,
        "skills": ["Python", "Django", "PostgreSQL"],
        "uploaded_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### GET /cvs/:id
Get single CV details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200) - Locked:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "john_doe_cv.pdf",
    "current_role": "Senior Developer",
    "experience_years": 5,
    "skills": ["Python", "Django", "PostgreSQL"],
    "isLocked": true
  }
}
```

**Response (200) - Unlocked:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "john_doe_cv.pdf",
    "candidate_name": "John Doe",
    "candidate_email": "john@example.com",
    "candidate_phone": "+1234567890",
    "current_role": "Senior Developer",
    "experience_years": 5,
    "skills": ["Python", "Django", "PostgreSQL"],
    "education": "BSc Computer Science",
    "certifications": ["AWS Certified"],
    "isLocked": false
  }
}
```

### GET /cvs/:id/download
Download CV file (requires unlock).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** File download

### GET /cvs/stats
Get CV statistics (Admin).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_cvs": 150,
      "processed_cvs": 145,
      "pending_cvs": 3,
      "failed_cvs": 2,
      "cvs_today": 5
    },
    "topSkills": [
      { "skill": "Python", "frequency": 75 },
      { "skill": "JavaScript", "frequency": 68 }
    ]
  }
}
```

---

## Job Endpoints

### POST /jobs/match-instant
Instant job matching (no authentication required).

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "description": "We are looking for a Senior Software Engineer with 5+ years of experience in Python, Django, PostgreSQL, and AWS.",
  "required_skills": ["Python", "Django", "PostgreSQL", "AWS"],
  "experience_required": 5
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "job_id": 1,
    "total_matches": 24,
    "message": "Found 24 matching candidates. Sign up to view full details.",
    "preview_matches": [
      {
        "candidate_id": "#123",
        "current_role": "Senior Developer",
        "experience_years": 6,
        "skills": ["Python", "Django", "PostgreSQL", "AWS"],
        "match_percentage": 94
      }
    ]
  }
}
```

### POST /jobs
Create a new job (authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Full Stack Developer",
  "description": "Looking for a Full Stack Developer...",
  "required_skills": ["React", "Node.js", "MongoDB"],
  "experience_required": 3,
  "location": "Remote",
  "salary_range": "$80k-$120k",
  "job_type": "Full-time"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "id": 1,
    "title": "Full Stack Developer",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /jobs/:id/matches
Get matches for a specific job.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "job_id": 1,
    "job_title": "Full Stack Developer",
    "total_matches": 15,
    "matches": [
      {
        "cv_id": 123,
        "candidate_name": "Candidate #123",
        "current_role": "Full Stack Developer",
        "experience_years": 4,
        "skills": ["React", "Node.js", "MongoDB"],
        "similarity_score": 0.92,
        "match_percentage": 92,
        "is_unlocked": false
      }
    ]
  }
}
```

### GET /jobs
Get all jobs for authenticated employer.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Results per page
- `status` (string): Filter by status (active, closed, draft)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Full Stack Developer",
      "status": "active",
      "match_count": 15,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Payment Endpoints

### POST /payments/unlock
Unlock CV contact details.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "cv_id": 123,
  "payment_method": "ecocash"
}
```

**Valid payment methods:**
- `ecocash`
- `paynow`
- `paypal`
- `onemoney`
- `zimswitch`

**Response (200):**
```json
{
  "success": true,
  "message": "Payment initiated",
  "data": {
    "payment_id": 1,
    "amount": 25.00,
    "currency": "USD",
    "payment_method": "ecocash",
    "redirect_url": "https://payment-gateway.com/...",
    "status": "processing"
  }
}
```

### GET /payments/:id/status
Check payment status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payment_id": 1,
    "status": "completed",
    "amount": 25.00,
    "currency": "USD",
    "payment_method": "ecocash",
    "completed_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /payments/confirm
Manually confirm payment (testing only).

**Request Body:**
```json
{
  "payment_id": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed and CV unlocked",
  "data": {
    "cv_id": 123,
    "payment_id": 1
  }
}
```

### GET /payments/unlocked
Get all unlocked CVs.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "unlocked_at": "2024-01-01T00:00:00.000Z",
      "id": 123,
      "candidate_name": "John Doe",
      "candidate_email": "john@example.com",
      "candidate_phone": "+1234567890"
    }
  ]
}
```

### GET /payments/history
Get payment history.

**Query Parameters:**
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 1,
        "amount": 25.00,
        "payment_status": "completed",
        "payment_method": "ecocash",
        "candidate_name": "John Doe",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

---

## Admin Endpoints

All admin endpoints require admin role authentication.

### GET /admin/analytics
Get platform analytics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cvs": {
      "total_cvs": 150,
      "processed_cvs": 145,
      "cvs_today": 5
    },
    "users": {
      "total_employers": 50,
      "active_users": 45
    },
    "jobs": {
      "total_jobs": 75,
      "active_jobs": 60
    },
    "payments": {
      "total_payments": 100,
      "completed_payments": 95,
      "total_revenue": 2375.00
    }
  }
}
```

### GET /admin/users
List all users.

**Query Parameters:**
- `page`, `limit`, `role`, `status`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "employer@company.com",
        "full_name": "John Doe",
        "role": "employer",
        "is_active": true
      }
    ],
    "pagination": { /* pagination object */ }
  }
}
```

### GET /admin/cvs/queue
Get CV processing queue status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "queue_status": {
      "pending": 5,
      "processing": 2,
      "completed": 145,
      "failed": 3
    },
    "failed_cvs": [
      {
        "id": 1,
        "filename": "corrupt_file.pdf",
        "processing_error": "Unable to extract text"
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error",
  "error": "Error details (dev mode only)"
}
```

---

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## Webhooks

### POST /payments/paynow/webhook
Paynow payment webhook (no authentication).

**Request Body:**
```
reference=RF-PAY-123&status=Paid&pollUrl=...&hash=...
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Testing

Use the provided test script:
```bash
chmod +x backend/scripts/test-api.sh
./backend/scripts/test-api.sh
```

Or test manually with curl:
```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get CVs (with auth)
curl http://localhost:5000/api/cvs \
  -H "Authorization: Bearer YOUR_TOKEN"
```