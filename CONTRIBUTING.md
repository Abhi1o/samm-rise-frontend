# Contributing to SAMM Rise Frontend

Thank you for your interest in contributing to the SAMM Rise Frontend! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Git
- A GitHub account

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/samm-rise-frontend.git
   cd samm-rise-frontend
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ASR-Innovations/samm-rise-frontend.git
   ```

4. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

5. Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Build the project
npm run build

# Test manually in browser
npm run dev
```

### 4. Commit Your Changes

We follow conventional commits:

```bash
git add .
git commit -m "feat: add new token selection feature"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📝 Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable and function names

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Ensure responsive design (mobile-first)
- Test on different screen sizes

### File Organization

```
src/
├── components/     # React components
│   ├── ui/        # Reusable UI components
│   └── ...        # Feature components
├── config/        # Configuration files
├── hooks/         # Custom React hooks
├── services/      # API services
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## 🧪 Testing

### Manual Testing

1. Test all user flows
2. Check responsive design
3. Verify error handling
4. Test with different tokens and amounts
5. Check browser console for errors

### API Testing

Use the `test-api.html` page to verify backend integration.

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Tested on multiple browsers
- [ ] Responsive design verified

### PR Description

Include:
1. **What**: Brief description of changes
2. **Why**: Reason for the changes
3. **How**: Technical approach
4. **Testing**: How you tested the changes
5. **Screenshots**: For UI changes

Example:
```markdown
## What
Added multi-hop routing visualization

## Why
Users need to see the swap path for multi-hop swaps

## How
- Created RouteVisualization component
- Integrated with EnhancedSwapCard
- Added animations for route display

## Testing
- Tested LINK → DAI swap (2 hops)
- Verified on mobile and desktop
- Checked with different token pairs

## Screenshots
[Add screenshots here]
```

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's reproducible
3. Test on latest version

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Node version: [e.g., 20.10.0]

**Additional context**
Any other relevant information.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other relevant information.
```

## 🎯 Areas for Contribution

### High Priority

- [ ] Wallet connection implementation
- [ ] Transaction execution
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Mobile responsiveness

### Medium Priority

- [ ] Additional token pairs
- [ ] Advanced swap settings
- [ ] Transaction history
- [ ] Pool analytics
- [ ] Dark/Light theme improvements

### Low Priority

- [ ] Animations and transitions
- [ ] Accessibility improvements
- [ ] Documentation updates
- [ ] Code refactoring

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Wagmi Documentation](https://wagmi.sh)

## 🤝 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email security@asr-innovations.com

## 🙏 Thank You

Thank you for contributing to SAMM Rise Frontend! Your contributions help make this project better for everyone.

---

Happy coding! 🚀
