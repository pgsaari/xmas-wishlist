# Contributing to Christmas Wishlist

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## Contribution Workflows

There are two ways to contribute, depending on your access level:

### For Collaborators (Write Access)

If you're a collaborator with write access to the repository, you can push branches directly without forking.

#### Setting Up Your Development Environment

1. **Clone the repository** directly:
   ```bash
   git clone https://github.com/pgsaari/xmas-wishlist.git
   cd xmas-wishlist
   ```

2. **Install dependencies**:
   ```bash
   npm install
   npm run install:all
   ```

3. **Set up environment variables** (see README.md for details)

#### Creating a Feature Branch and Pull Request

1. **Update your local main branch**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a new feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   
   Or for bug fixes:
   ```bash
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes** and commit them

4. **Push your branch directly to the repository**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub:
   - Go to the repository: `https://github.com/pgsaari/xmas-wishlist`
   - You'll see a banner suggesting to create a PR from your new branch
   - Click "Compare & pull request"
   - Fill out the PR template
   - Submit the PR

**Note**: Even though you have write access, creating a PR allows for code review and discussion before merging to `main`.

### For External Contributors (No Write Access)

If you don't have write access, you'll need to fork the repository first.

#### Setting Up Your Development Environment

1. **Fork the repository** on GitHub (click the "Fork" button)
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/xmas-wishlist.git
   cd xmas-wishlist
   ```
3. **Add the original repository as upstream**:
   ```bash
   git remote add upstream https://github.com/pgsaari/xmas-wishlist.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   npm run install:all
   ```
5. **Set up environment variables** (see README.md for details)

#### Creating a Feature Branch and Pull Request

1. **Update your fork** with the latest changes:
   ```bash
   git checkout main
   git fetch upstream
   git merge upstream/main
   git push origin main
   ```

2. **Create a new feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   
   Or for bug fixes:
   ```bash
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes** and commit them

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub:
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your feature branch from your fork
   - Select `main` as the base branch in the original repository
   - Fill out the PR template
   - Submit the PR

## Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### Making Your Changes

1. Make your changes following the existing code style
2. Test your changes locally
3. Ensure the code builds without errors:
   ```bash
   npm run build
   ```

### Committing Your Changes

Write clear, descriptive commit messages:

```bash
git commit -m "Add feature: description of what you added"
```

Good commit messages:
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Be specific about what changed
- Keep the first line under 50 characters if possible

## Pull Request Process

1. **Ensure your PR**:
   - Has a clear title and description
   - References any related issues
   - Includes tests if applicable
   - Follows the existing code style
   - Builds without errors

2. **Wait for review**:
   - Maintainers will review your PR
   - Address any feedback or requested changes
   - Update your branch if requested

3. **After approval**:
   - Your PR will be merged
   - The feature branch will be deleted

## Code Style Guidelines

- **TypeScript**: Follow existing patterns and use TypeScript types
- **React**: Use functional components and hooks
- **Formatting**: Follow the existing indentation and spacing
- **Comments**: Add comments for complex logic
- **Naming**: Use descriptive variable and function names

## Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists
2. Create a new issue with:
   - Clear title
   - Description of the problem/feature
   - Steps to reproduce (for bugs)
   - Expected vs. actual behavior
   - Screenshots (if applicable)

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing! 🎄

