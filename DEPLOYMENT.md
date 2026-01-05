# 🚀 Deployment Guide

This document provides instructions for deploying the SAMM Rise Frontend to various platforms.

## 📦 Repositories

The project is available on two GitHub repositories:

1. **Primary Repository (ASR-Innovations)**
   - URL: https://github.com/ASR-Innovations/samm-rise-frontend.git
   - Remote name: `origin`
   - Purpose: Main development repository

2. **Guideploy Repository (Abhi1o)**
   - URL: https://github.com/Abhi1o/samm-rise-frontend.git
   - Remote name: `guideploy`
   - Purpose: Deployment and production builds

## 🔄 Managing Multiple Remotes

### View Current Remotes

```bash
git remote -v
```

### Push to Both Repositories

```bash
# Push to primary repository
git push origin main

# Push to guideploy repository
git push guideploy main

# Push to both at once
git push origin main && git push guideploy main
```

### Pull from Specific Remote

```bash
# Pull from origin
git pull origin main

# Pull from guideploy
git pull guideploy main
```

## 🌐 Deployment Options

### 1. Vercel (Recommended)

#### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Abhi1o/samm-rise-frontend)

#### Manual Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production:
   ```bash
   vercel --prod
   ```

#### Environment Variables

Add these in Vercel dashboard:
- `VITE_API_URL` - Backend API URL
- `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- `VITE_ALCHEMY_API_KEY` - Alchemy API key (optional)

### 2. Netlify

#### Quick Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Abhi1o/samm-rise-frontend)

#### Manual Deployment

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login:
   ```bash
   netlify login
   ```

3. Initialize:
   ```bash
   netlify init
   ```

4. Deploy:
   ```bash
   netlify deploy --prod
   ```

#### Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18 or 20

### 3. GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://abhi1o.github.io/samm-rise-frontend"
   }
   ```

3. Update `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/samm-rise-frontend/',
     // ... rest of config
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### 4. AWS S3 + CloudFront

1. Build the project:
   ```bash
   npm run build
   ```

2. Install AWS CLI:
   ```bash
   # macOS
   brew install awscli
   
   # Or download from AWS
   ```

3. Configure AWS:
   ```bash
   aws configure
   ```

4. Create S3 bucket:
   ```bash
   aws s3 mb s3://samm-rise-frontend
   ```

5. Upload files:
   ```bash
   aws s3 sync dist/ s3://samm-rise-frontend --delete
   ```

6. Enable static website hosting:
   ```bash
   aws s3 website s3://samm-rise-frontend --index-document index.html
   ```

### 5. Docker

#### Dockerfile

Create `Dockerfile`:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Build and Run

```bash
# Build image
docker build -t samm-rise-frontend .

# Run container
docker run -p 8080:80 samm-rise-frontend
```

#### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "8080:80"
    environment:
      - VITE_API_URL=http://backend:3000
    depends_on:
      - backend

  backend:
    image: samm-backend:latest
    ports:
      - "3000:3000"
```

Run:
```bash
docker-compose up -d
```

## 🔐 Environment Variables

### Required

- `VITE_API_URL` - Backend API URL (e.g., `https://api.samm.rise`)

### Optional

- `VITE_WALLETCONNECT_PROJECT_ID` - For wallet connection
- `VITE_ALCHEMY_API_KEY` - For RPC provider
- `VITE_COINGECKO_API_KEY` - For price data
- `VITE_INFURA_API_KEY` - Fallback RPC provider

### Production Example

```bash
VITE_API_URL=https://api.samm.rise
VITE_WALLETCONNECT_PROJECT_ID=abc123...
VITE_ALCHEMY_API_KEY=xyz789...
```

## 🔄 CI/CD Pipeline

### GitHub Actions (Already Configured)

The repository includes a CI workflow that:
- Runs on push to `main` and `develop`
- Tests on Node.js 18.x and 20.x
- Runs linting
- Builds the project
- Uploads build artifacts

### Automatic Deployment

Add deployment step to `.github/workflows/ci.yml`:

```yaml
- name: Deploy to Vercel
  if: github.ref == 'refs/heads/main'
  run: |
    npm install -g vercel
    vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
```

## 📊 Performance Optimization

### Build Optimization

1. **Code Splitting**
   ```typescript
   // Use dynamic imports
   const Component = lazy(() => import('./Component'));
   ```

2. **Tree Shaking**
   - Already enabled in Vite
   - Import only what you need

3. **Asset Optimization**
   ```bash
   # Optimize images
   npm install -D vite-plugin-imagemin
   ```

### Runtime Optimization

1. **Enable Compression**
   - Gzip/Brotli on server
   - Already configured in nginx example

2. **CDN Integration**
   - Use CloudFront or Cloudflare
   - Cache static assets

3. **Service Worker**
   ```bash
   npm install -D vite-plugin-pwa
   ```

## 🔍 Monitoring

### Vercel Analytics

Add to `main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

### Sentry Error Tracking

1. Install:
   ```bash
   npm install @sentry/react
   ```

2. Configure:
   ```typescript
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "your-dsn",
     environment: "production",
   });
   ```

## 🧪 Testing Deployment

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] CORS configured on backend
- [ ] SSL certificate ready
- [ ] Domain DNS configured

### Post-deployment Verification

```bash
# Check if site is live
curl -I https://your-domain.com

# Test API connection
curl https://your-domain.com/api/health

# Check SSL
openssl s_client -connect your-domain.com:443
```

## 🔧 Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variables Not Working

- Ensure variables start with `VITE_`
- Restart dev server after changes
- Check `.env.local` is not in `.gitignore`

### API Connection Issues

- Verify CORS settings on backend
- Check API URL in environment
- Ensure backend is accessible from deployment

### 404 on Refresh

Configure server to serve `index.html` for all routes:

**Nginx**:
```nginx
try_files $uri $uri/ /index.html;
```

**Vercel** (vercel.json):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 📚 Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Docker Documentation](https://docs.docker.com)

## 🆘 Support

For deployment issues:
1. Check the troubleshooting section
2. Review platform-specific documentation
3. Open an issue on GitHub
4. Contact the team

---

Happy deploying! 🚀
