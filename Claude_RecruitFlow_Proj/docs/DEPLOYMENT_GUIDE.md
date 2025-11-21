# RecruitFlow Deployment Guide

## Production Deployment Options

### Option 1: Docker Compose (Recommended for Self-Hosting)

#### Prerequisites
- Docker and Docker Compose installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

#### Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/recruitflow.git
cd recruitflow
```

2. **Configure environment variables**
```bash
# Create .env file in root
cp .env.example .env

# Edit with production values
nano .env
```

Required variables:
```env
# Database
POSTGRES_DB=recruitflow
POSTGRES_USER=recruitflow_prod
POSTGRES_PASSWORD=strong_password_here

# Backend
JWT_SECRET=very_long_random_string_min_32_chars
OPENAI_API_KEY=sk-your-production-key
PAYNOW_INTEGRATION_ID=prod_integration_id
PAYNOW_INTEGRATION_KEY=prod_integration_key
FRONTEND_URL=https://your domain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

3. **Start services**
```bash
docker-compose up -d
```

4. **Run migrations**
```bash
docker-compose exec backend node database/migrations/run.js
```

5. **Verify deployment**
```bash
curl https://api.yourdomain.com/health
curl https://yourdomain.com
```

---

### Option 2: Heroku + Vercel

#### Backend on Heroku

1. **Install Heroku CLI**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
heroku login
```

2. **Create Heroku app**
```bash
cd backend
heroku create recruitflow-api
```

3. **Add PostgreSQL addon**
```bash
heroku addons:create heroku-postgresql:mini
```

4. **Install pgvector extension**
```bash
heroku pg:psql
CREATE EXTENSION vector;
\q
```

5. **Set environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set OPENAI_API_KEY=sk-your-key
heroku config:set PAYNOW_INTEGRATION_ID=your_id
heroku config:set PAYNOW_INTEGRATION_KEY=your_key
heroku config:set FRONTEND_URL=https://your-app.vercel.app
heroku config:set MAX_FILE_SIZE=5242880
```

6. **Deploy**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

7. **Run migrations**
```bash
heroku run node database/migrations/run.js
```

8. **Check logs**
```bash
heroku logs --tail
```

#### Frontend on Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
vercel login
```

2. **Deploy from frontend directory**
```bash
cd frontend
vercel
```

3. **Set environment variables in Vercel dashboard**
- Go to Project Settings > Environment Variables
- Add:
  - `NEXT_PUBLIC_API_URL`: `https://recruitflow-api.herokuapp.com/api`
  - `NEXT_PUBLIC_APP_URL`: `https://your-app.vercel.app`

4. **Deploy to production**
```bash
vercel --prod
```

---

### Option 3: Railway

#### Deploy Full Stack

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

2. **Initialize project**
```bash
railway init
```

3. **Add PostgreSQL**
```bash
railway add postgresql
```

4. **Deploy backend**
```bash
cd backend
railway up
```

5. **Deploy frontend**
```bash
cd frontend
railway up
```

6. **Set environment variables**
Use Railway dashboard to set all required environment variables.

---

### Option 4: DigitalOcean App Platform

1. **Connect GitHub repository**
- Go to DigitalOcean App Platform
- Connect your GitHub account
- Select repository

2. **Configure backend**
```yaml
name: recruitflow-backend
services:
  - name: api
    source_dir: /backend
    github:
      repo: yourusername/recruitflow
      branch: main
    build_command: npm install
    run_command: npm start
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${db.DATABASE_URL}
      - key: JWT_SECRET
        scope: RUN_TIME
        value: your_secret
      - key: OPENAI_API_KEY
        scope: RUN_TIME
        value: sk-your-key
    http_port: 5000

databases:
  - name: db
    engine: PG
    version: "14"
```

3. **Configure frontend**
```yaml
name: recruitflow-frontend
services:
  - name: web
    source_dir: /frontend
    github:
      repo: yourusername/recruitflow
      branch: main
    build_command: npm run build
    run_command: npm start
    envs:
      - key: NEXT_PUBLIC_API_URL
        scope: BUILD_AND_RUN_TIME
        value: https://api.yourdomain.com/api
```

---

## Post-Deployment Checklist

### Security

- [ ] Change default admin password
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Implement API key rotation
- [ ] Set up monitoring and alerts

### Database

- [ ] Run migrations
- [ ] Verify pgvector extension is installed
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Index optimization
- [ ] Set up replica (if needed)

### Application

- [ ] Verify all environment variables
- [ ] Test file uploads
- [ ] Test CV processing
- [ ] Test job matching
- [ ] Test payment integration
- [ ] Configure email notifications (if added)
- [ ] Set up logging and monitoring

### Monitoring

```bash
# Set up health checks
*/5 * * * * curl https://api.yourdomain.com/health

# Monitor logs
tail -f /var/log/recruitflow/*.log

# Database monitoring
SELECT * FROM cv_statistics;
SELECT upload_status, COUNT(*) FROM cvs GROUP BY upload_status;
```

---

## Backup Strategy

### Database Backups

**Daily backups:**
```bash
# Cron job for daily backup
0 2 * * * pg_dump $DATABASE_URL > /backups/recruitflow_$(date +\%Y\%m\%d).sql
```

**Automated Heroku backups:**
```bash
heroku pg:backups:schedule --at '02:00 America/Los_Angeles' DATABASE_URL
```

### File Backups

```bash
# Backup uploads directory
0 3 * * * tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /app/uploads
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**
   - Use Nginx or cloud load balancer
   - Distribute traffic across multiple backend instances

2. **Database Scaling**
   - Read replicas for queries
   - Connection pooling (PgBouncer)
   - Redis for caching

3. **File Storage**
   - Move to S3/Cloud Storage
   - CDN for static assets

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Enable caching
- Use worker processes for CV processing

---

## Monitoring Setup

### Application Monitoring

**PM2 for Node.js:**
```bash
npm install -g pm2
pm2 start src/server.js --name recruitflow-api
pm2 startup
pm2 save
```

**Monitoring dashboard:**
```bash
pm2 plus
```

### Log Management

**Centralized logging with Winston + LogDNA/Papertrail:**
```javascript
// Already configured in backend/src/utils/logger.js
```

### Uptime Monitoring

- UptimeRobot: https://uptimerobot.com
- Pingdom: https://www.pingdom.com
- Better Uptime: https://betteruptime.com

---

## SSL/HTTPS Setup

### Let's Encrypt with Nginx

1. **Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
```

2. **Obtain certificate**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Auto-renewal**
```bash
sudo certbot renew --dry-run
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Performance Optimization

### Backend Optimization

1. **Enable compression**
   - Already configured with compression middleware

2. **Caching strategy**
```javascript
// Add Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache CV search results
app.get('/api/cvs', async (req, res) => {
  const cacheKey = `cvs:${JSON.stringify(req.query)}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Fetch from database
  const results = await fetchCVs(req.query);
  await client.setex(cacheKey, 300, JSON.stringify(results));
  res.json(results);
});
```

3. **Database optimization**
```sql
-- Add composite indexes
CREATE INDEX idx_cvs_skills_status ON cvs(skills, upload_status);
CREATE INDEX idx_jobs_employer_status ON jobs(employer_id, status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM cvs WHERE skills && ARRAY['Python'];
```

### Frontend Optimization

1. **Image optimization** - Already using Next.js Image component
2. **Code splitting** - Automatic with Next.js
3. **Static generation** - Use for marketing pages
4. **CDN** - Deploy to Vercel/Netlify for automatic CDN

---

## Rollback Procedure

### Application Rollback

**Heroku:**
```bash
heroku releases
heroku rollback v123
```

**Docker:**
```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

### Database Rollback

```bash
# Restore from backup
pg_restore -d $DATABASE_URL /backups/recruitflow_20240101.sql
```

---

## Troubleshooting Production Issues

### High CPU Usage
```bash
# Check process stats
top
htop

# Node.js profiling
node --prof src/server.js
```

### Memory Leaks
```bash
# Monitor memory
pm2 monit

# Heap snapshot
node --inspect src/server.js
```

### Database Issues
```sql
-- Check connections
SELECT * FROM pg_stat_activity;

-- Kill long-running queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active';

-- Vacuum database
VACUUM ANALYZE;
```

---

## Support Contacts

- Technical Issues: support@recruitflow.com
- Emergency: +1-XXX-XXX-XXXX
- Documentation: https://docs.recruitflow.com

---

**Deployment completed successfully? Don't forget to:**
1. Update DNS records
2. Configure monitoring
3. Set up backups
4. Test all features
5. Update documentation
6. Train users