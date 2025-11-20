# RecruitFlow - Complete Project Structure

```
recruitflow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── openai.js
│   │   │   └── payment.js
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── cvController.js
│   │   │   ├── jobController.js
│   │   │   └── paymentController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   ├── upload.js
│   │   │   └── validator.js
│   │   ├── models/
│   │   │   ├── CV.js
│   │   │   ├── Job.js
│   │   │   ├── User.js
│   │   │   └── Payment.js
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── cvRoutes.js
│   │   │   ├── jobRoutes.js
│   │   │   └── paymentRoutes.js
│   │   ├── services/
│   │   │   ├── cvParser.js
│   │   │   ├── embeddingService.js
│   │   │   ├── matchingService.js
│   │   │   └── paymentService.js
│   │   ├── utils/
│   │   │   ├── fileHandler.js
│   │   │   ├── logger.js
│   │   │   └── textExtractor.js
│   │   └── server.js
│   ├── database/
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.sql
│   │   └── seeds/
│   │       └── sample_data.sql
│   ├── uploads/
│   │   └── .gitkeep
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js
│   │   │   ├── page.js
│   │   │   ├── admin/
│   │   │   │   ├── page.js
│   │   │   │   ├── upload/
│   │   │   │   │   └── page.js
│   │   │   │   └── cvs/
│   │   │   │       └── page.js
│   │   │   ├── employer/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.js
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.js
│   │   │   │   └── cvs/
│   │   │   │       └── page.js
│   │   │   ├── matching/
│   │   │   │   └── page.js
│   │   │   ├── payment/
│   │   │   │   └── page.js
│   │   │   └── payment-success/
│   │   │       └── page.js
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.js
│   │   │   │   ├── Sidebar.js
│   │   │   │   └── Footer.js
│   │   │   ├── cv/
│   │   │   │   ├── CVCard.js
│   │   │   │   ├── CVGrid.js
│   │   │   │   └── CVUploader.js
│   │   │   ├── job/
│   │   │   │   ├── JobForm.js
│   │   │   │   └── MatchResults.js
│   │   │   ├── payment/
│   │   │   │   └── PaymentForm.js
│   │   │   └── ui/
│   │   │       ├── Button.js
│   │   │       ├── Input.js
│   │   │       └── Card.js
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── utils.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useCVs.js
│   │   └── styles/
│   │       └── globals.css
│   ├── .env.local.example
│   ├── .gitignore
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── README.md
│
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── SETUP.md
│
└── README.md
```

## Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run migrate
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Configure your .env.local file
npm run dev
```

### Database Setup
```bash
# Install PostgreSQL with pgvector extension
psql -U postgres
CREATE DATABASE recruitflow;
\c recruitflow
CREATE EXTENSION vector;
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/recruitflow
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key
PAYNOW_INTEGRATION_ID=your_paynow_id
PAYNOW_INTEGRATION_KEY=your_paynow_key
ECOCASH_MERCHANT_ID=your_ecocash_id
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Technology Stack

### Backend
- Node.js + Express
- PostgreSQL with pgvector
- OpenAI API for embeddings
- JWT for authentication
- Multer for file uploads
- pdf-parse, mammoth for document parsing

### Frontend
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Axios for API calls
- React Hook Form for forms

## Features

✅ Admin CV upload and management
✅ Automated CV parsing and field extraction
✅ Vector embeddings generation
✅ Job description matching with similarity search
✅ Anonymous candidate count (free)
✅ Gated detailed candidate info (payment required)
✅ Employer authentication and dashboard
✅ Payment integration (Paynow, EcoCash, PayPal)
✅ CV download functionality
✅ Search and filter capabilities

## Next Steps

1. Review and customize environment variables
2. Run database migrations
3. Test CV upload and processing
4. Configure payment providers
5. Deploy to production

See individual README files in backend/ and frontend/ directories for detailed instructions.