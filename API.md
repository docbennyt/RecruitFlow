# Recruitment Platform API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
Most endpoints require JWT authentication via Bearer token.

## Key Endpoints

### Authentication
- `POST /auth/register` - Employer registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile

### Jobs
- `POST /jobs` - Create job posting (authenticated)
- `GET /jobs/my-jobs` - Get employer's jobs (authenticated)
- `GET /jobs/:id` - Get job details
- `PATCH /jobs/:id/status` - Update job status

### Matching
- `GET /matching/jobs/:jobId/candidates/count` - Get matching candidate count (free)
- `GET /matching/jobs/:jobId/candidates/detailed` - Get detailed matches (paid)
- `POST /matching/quick-match` - Quick CV-to-job matching

### CV Management
- `POST /cv/upload` - Upload CV (admin)
- `GET /cv/stats` - Get CV statistics (admin)
- `GET /cv` - List all CVs (admin)

### Admin
- `GET /admin/dashboard` - Admin dashboard stats
- `POST /admin/process-pending` - Process pending CVs

## Sample Requests

### Register Employer
```json
POST /auth/register
{
  "email": "employer@company.com",
  "password": "securepassword",
  "name": "John Doe",
  "company": "Tech Corp",
  "phone": "+1234567890"
}