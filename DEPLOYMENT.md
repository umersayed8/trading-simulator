# Deployment Guide

This guide covers deploying StockSim to Railway, which provides easy MySQL + Node.js hosting with automatic HTTPS.

## Prerequisites

- GitHub account (for deployment)
- Railway account (free tier available)
- Local development environment working

## Option 1: Railway Deployment (Recommended)

Railway provides seamless deployment with automatic builds and MySQL hosting.

### Step 1: Prepare Repository

1. Push code to GitHub repository:

```bash
cd notebooks/kavin/project
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/stocksim.git
git push -u origin main
```

2. Ensure project structure:
```
stocksim/
├── backend/
│   ├── package.json
│   └── ...
├── frontend/
│   ├── package.json
│   └── ...
└── ...
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your repository
5. Select your repository

### Step 3: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "MySQL"**
3. Railway will provision a MySQL instance
4. Note the connection credentials from the **"Variables"** tab:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

### Step 4: Configure Backend Service

1. Click on your backend service (or add one if not auto-detected)
2. Go to **"Settings"**:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. Go to **"Variables"** and add:

```env
NODE_ENV=production
PORT=3001
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
JWT_EXPIRES_IN=7d
```

4. Enable **"Public Networking"** to get a public URL

### Step 5: Configure Frontend Service

1. Add a new service for frontend (if not auto-detected)
2. Go to **"Settings"**:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`
3. Go to **"Variables"** and add:

```env
VITE_API_URL=https://your-backend-url.railway.app/api
```

4. Enable **"Public Networking"**

### Step 6: Run Database Migrations

1. Connect to your Railway MySQL instance:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run npm run migrate --service backend

# Seed data
railway run npm run seed --service backend
```

### Step 7: Verify Deployment

1. Access your frontend URL (e.g., `https://stocksim-frontend.railway.app`)
2. Test registration and login
3. Verify stock data fetching
4. Check all features work

---

## Option 2: Docker Deployment

For self-hosted or VPS deployment.

### Step 1: Build Docker Images

```bash
# Build backend
cd backend
docker build -t stocksim-backend .

# Build frontend
cd ../frontend
docker build -t stocksim-frontend .
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: stocksim
      MYSQL_USER: stocksim
      MYSQL_PASSWORD: stocksimpass
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: db
      DB_PORT: 3306
      DB_USER: stocksim
      DB_PASSWORD: stocksimpass
      DB_NAME: stocksim
      JWT_SECRET: your-secret-key
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost:3001/api
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

### Step 3: Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed

# View logs
docker-compose logs -f
```

---

## Option 3: Vercel + PlanetScale

For serverless deployment.

### Backend on Vercel Functions

1. Create `vercel.json` in backend:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/index.ts"
    }
  ]
}
```

2. Deploy:

```bash
cd backend
vercel
```

### Database on PlanetScale

1. Create PlanetScale database at [planetscale.com](https://planetscale.com)
2. Get connection string
3. Add to Vercel environment variables

### Frontend on Vercel

```bash
cd frontend
vercel
```

---

## Environment Variables Reference

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment mode | `production` |
| PORT | Server port | `3001` |
| DB_HOST | MySQL host | `localhost` |
| DB_PORT | MySQL port | `3306` |
| DB_USER | MySQL user | `stocksim` |
| DB_PASSWORD | MySQL password | `secure-password` |
| DB_NAME | Database name | `stocksim` |
| JWT_SECRET | Secret for JWT signing | `random-64-char-string` |
| JWT_EXPIRES_IN | Token expiration | `7d` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | `https://api.stocksim.com/api` |

---

## SSL/HTTPS

Railway and Vercel provide automatic HTTPS. For self-hosted:

### Using Nginx + Let's Encrypt

```nginx
server {
    listen 80;
    server_name stocksim.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name stocksim.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/stocksim.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stocksim.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Generate certificate:

```bash
sudo certbot --nginx -d stocksim.yourdomain.com
```

---

## Monitoring and Logs

### Railway

- Built-in logs in dashboard
- Metrics available in Pro plan

### Docker

```bash
# View logs
docker-compose logs -f backend

# Monitor resources
docker stats
```

### Application Logging

The backend uses structured JSON logging. In production:

```bash
# View recent errors
railway logs --service backend | grep "error"
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
railway run node -e "require('./src/config/database').testConnection()"
```

### Build Failures

1. Check Node.js version (18+ required)
2. Verify all dependencies in package.json
3. Check build logs for specific errors

### Stock API Rate Limits

If Yahoo Finance rate limits occur:
- The app caches prices for 1 minute
- Graceful fallback shows last cached price
- Consider upgrading to paid API for production

### CORS Issues

Ensure backend CORS is configured for frontend domain:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

---

## Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] Login/logout works
- [ ] Stock search returns results
- [ ] Trading executes correctly
- [ ] Portfolio displays holdings
- [ ] Leaderboard loads
- [ ] Learning modules work
- [ ] Algo backtesting runs
- [ ] SSL certificate valid
- [ ] Error logging works
