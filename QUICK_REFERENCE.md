# 🚀 Quick Reference Card

## 📦 Repositories

| Repository | URL | Remote | Purpose |
|------------|-----|--------|---------|
| **ASR-Innovations** | https://github.com/ASR-Innovations/samm-rise-frontend.git | `origin` | Main development |
| **Guideploy (Abhi1o)** | https://github.com/Abhi1o/samm-rise-frontend.git | `guideploy` | Deployment |

## 🔄 Common Git Commands

### Push to Both Repositories

```bash
# Push to both at once
git push origin main && git push guideploy main

# Or separately
git push origin main
git push guideploy main
```

### Pull Latest Changes

```bash
# From primary repo
git pull origin main

# From guideploy repo
git pull guideploy main
```

### Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Commit Changes

```bash
git add .
git commit -m "feat: your commit message"
```

### View Remotes

```bash
git remote -v
```

## 🚀 Development

### Start Dev Server

```bash
npm run dev
# Opens at http://localhost:8080
```

### Build for Production

```bash
npm run build
```

### Run Linter

```bash
npm run lint
```

## 🌐 Deployment

### Vercel (Quick Deploy)

```bash
vercel --prod
```

### Netlify

```bash
netlify deploy --prod
```

### Docker

```bash
docker build -t samm-rise-frontend .
docker run -p 8080:80 samm-rise-frontend
```

## 🔐 Environment Variables

```bash
VITE_API_URL=http://localhost:3000
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_ALCHEMY_API_KEY=your_alchemy_key
```

## 📝 Commit Message Format

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: maintenance
```

## 🔗 Quick Links

- **Primary Repo**: https://github.com/ASR-Innovations/samm-rise-frontend
- **Guideploy Repo**: https://github.com/Abhi1o/samm-rise-frontend
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:8080

## 📚 Documentation

- [README.md](./README.md) - Full project documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [GIT_SETUP_COMPLETE.md](./GIT_SETUP_COMPLETE.md) - Git setup details

## 🆘 Quick Troubleshooting

### Build Fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Git Push Rejected
```bash
git pull origin main --rebase
git push origin main
```

### Environment Variables Not Working
- Restart dev server
- Check variables start with `VITE_`
- Verify `.env.local` exists

---

Keep this handy for quick reference! 📌
