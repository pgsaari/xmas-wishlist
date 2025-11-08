# GitHub Repository Setup Guide

This guide explains how to configure your GitHub repository to be public and allow contributions from anyone.

## Step 1: Make the Repository Public

1. Go to your repository on GitHub: `https://github.com/pgsaari/xmas-wishlist`
2. Click on **Settings** (top menu bar)
3. Scroll down to the **Danger Zone** section at the bottom
4. Click **Change visibility**
5. Select **Make public**
6. Type the repository name to confirm
7. Click **I understand, change repository visibility**

## Step 2: Configure Repository Settings for Contributions

### Recommended Approach: Fork + Pull Request (Most Secure)

This is the standard approach used by most open-source projects. Contributors fork your repo, make changes, and create pull requests.

1. **Go to Settings → General**
   - Under "Features", ensure:
     - ✅ **Issues** are enabled
     - ✅ **Pull requests** are enabled
     - ✅ **Discussions** (optional) can be enabled

2. **Go to Settings → Branches**
   - Add a branch protection rule for `main`:
     - **Branch name pattern**: `main`
     - ✅ **Require a pull request before merging**
     - ✅ **Require approvals** (optional, set to 1 or more)
     - ✅ **Require status checks to pass** (if you add CI/CD)
     - ✅ **Do not allow bypassing the above settings**
   - This protects your main branch while allowing PRs

3. **Contributors can now:**
   - Fork your repository
   - Create feature branches in their fork
   - Push changes to their fork
   - Create pull requests from their fork to your main branch

### Alternative Approach: Direct Push to Feature Branches (Less Common)

If you specifically want to allow anyone to push directly to feature branches in your repository:

1. **Go to Settings → Branches**
   - Create branch protection rules that **only** protect `main`:
     - **Branch name pattern**: `main`
     - ✅ **Require a pull request before merging**
     - ✅ **Restrict who can push to matching branches** (only you/your team)
   - **Do NOT** protect `feature/*` branches - this allows anyone to push to them

2. **Go to Settings → Collaborators and teams** (if you want specific people)
   - Or keep it completely open (anyone with a GitHub account can push)

3. **Important Security Considerations:**
   - ⚠️ Anyone can push directly to feature branches
   - ⚠️ Malicious code could be pushed (review all PRs carefully)
   - ⚠️ Consider requiring PR reviews even for feature branches
   - ✅ Main branch is still protected

## Step 3: Enable GitHub Actions (Optional but Recommended)

If you want to add CI/CD, you can create GitHub Actions workflows. See `.github/workflows/` for examples.

## Step 4: Add Contributing Guidelines

Create a `CONTRIBUTING.md` file to guide contributors:

1. How to fork and clone
2. How to create feature branches
3. How to submit pull requests
4. Code style guidelines
5. Testing requirements

## Quick Setup Checklist

- [ ] Make repository public
- [ ] Enable Issues and Pull Requests
- [ ] Set up branch protection for `main`
- [ ] (Optional) Create `CONTRIBUTING.md`
- [ ] (Optional) Create `CODE_OF_CONDUCT.md`
- [ ] (Optional) Add GitHub Actions for CI/CD

## Notes

- **Fork + PR approach** is more secure and is the GitHub standard
- **Direct push approach** requires more trust but allows faster iteration
- Always protect your `main` branch
- Consider requiring PR reviews before merging to `main`
- Monitor all contributions for security and quality

## Need Help?

- [GitHub Docs: Making a repository public](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)
- [GitHub Docs: Managing branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Docs: Collaborating with pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests)

