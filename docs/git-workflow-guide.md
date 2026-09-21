# Going Merry HMS — Git Workflow & Deployment Lifecycle Guide

## 1. Overview & Architecture

This repository follows an automated, promotion-based Git lifecycle that minimizes manual branch coordination while strictly enforcing automated testing (CI), peer review, and environment isolation.

```mermaid
flowchart TD
    subgraph DeveloperWorkspaces["Developer Workspaces"]
        dev1["Personal Branch: saurabh"]
        dev2["Personal Branch: ankit"]
        dev3["Personal Branch: sahil"]
        dev4["Personal Branch: rizwan"]
    end

    subgraph IntegrationStage["Integration & Development"]
        PR_Dev["Pull Request to dev\n(CI: Lint, Format, Types, Tests, Build)"]
        dev["dev branch\n(Development Environment Deploy)"]
    end

    subgraph StagingStage["Pre-Production / QA"]
        AutoPR_Staging["Automated PR: 🚀 Promote dev → staging\n(CI Checks)"]
        staging["staging branch\n(Staging / QA Environment Deploy)"]
    end

    subgraph ProductionStage["Production"]
        AutoPR_Prod["Automated PR: 🚀 Promote staging → production\n(CI Checks)"]
        main["main branch\n(Production Deployment)"]
    end

    subgraph HotfixTrack["Hotfix Flow"]
        hotfix["hotfix/issue-description\n(Branch off main)"]
        PR_Hotfix["Pull Request to main\n(CI Checks + Urgent Review)"]
        Backport_Staging["Automated PR: 🩹 Sync hotfix: main → staging"]
        Backport_Dev["Automated PR: 🩹 Sync hotfix: main → dev"]
    end

    dev1 -->|PR| PR_Dev
    dev2 -->|PR| PR_Dev
    dev3 -->|PR| PR_Dev
    dev4 -->|PR| PR_Dev
    PR_Dev -->|Merge after Approval| dev

    dev -->|Auto Trigger| AutoPR_Staging
    AutoPR_Staging -->|QA Approval & Merge| staging

    staging -->|Auto Trigger| AutoPR_Prod
    AutoPR_Prod -->|Release Manager Approval & Merge| main

    main -->|Branch off for Hotfix| hotfix
    hotfix -->|PR| PR_Hotfix
    PR_Hotfix -->|Emergency Approval & Merge| main
    main -->|Auto Sync on Merge| Backport_Staging
    main -->|Auto Sync on Merge| Backport_Dev
    Backport_Staging -->|Merge| staging
    Backport_Dev -->|Merge| dev
```

---

## 2. Core Branch Definitions

| Branch            | Purpose                                                | Deployment Target                                                | Access & Protection                                                             |
| :---------------- | :----------------------------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| `main`            | Production release branch                              | Production (`https://hms.goingmerry.com` or Vercel Production)   | Strict Protection. No direct pushes. 1+ approvals required. Required CI checks. |
| `staging`         | Pre-production & QA verification                       | Staging (`https://staging-hms.goingmerry.com` or Vercel Staging) | Protected. No direct pushes. QA approval required. Required CI checks.          |
| `dev`             | Daily team integration branch                          | Development (`https://dev-hms.goingmerry.com` or Vercel Preview) | Protected. No direct pushes. Peer code review required. Required CI checks.     |
| Personal Branches | Active developer workspaces (`saurabh`, `ankit`, etc.) | Local / PR Preview                                               | Unprotected. Full developer autonomy. No `feature/*` branches.                  |
| `hotfix/*`        | Critical production bug fixes                          | Local / PR Preview                                               | Created directly from `main`. Targeted PR to `main`.                            |

---

## 3. GitHub Actions Workflows

All workflows are located in `.github/workflows/`:

| Workflow File                                                                                        | Trigger                                             | Purpose                    | Key Actions                                                                                                                                                               |
| :--------------------------------------------------------------------------------------------------- | :-------------------------------------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml)                                       | `push` & `pull_request` on `dev`, `staging`, `main` | Comprehensive Verification | Runs `npm ci`, `npx prisma generate`, `format:check`, `lint`, `typecheck`, `test` (Vitest), and `build` (Next.js).                                                        |
| [`.github/workflows/promote-to-staging.yml`](file:///.github/workflows/promote-to-staging.yml)       | `push` on `dev` (upon PR merge)                     | Staging Promotion          | Compares `dev` with `staging`. Checks for existing open PRs (idempotency). Opens `🚀 Promote dev → staging` with commit logs & diff stats.                                |
| [`.github/workflows/promote-to-production.yml`](file:///.github/workflows/promote-to-production.yml) | `push` on `staging` (upon PR merge)                 | Production Promotion       | Compares `staging` with `main`. Checks for existing open PRs. Opens `🚀 Promote staging → production` with release checklist and commit summaries.                        |
| [`.github/workflows/sync-hotfix.yml`](file:///.github/workflows/sync-hotfix.yml)                     | `push` on `main`                                    | Backport Synchronization   | Detects when `main` contains commits missing from `staging` or `dev` (e.g. from hotfixes). Automatically creates non-destructive backport PRs to both lower environments. |

---

## 4. Required GitHub Branch Protection Settings

To configure branch protection in GitHub:
Navigate to **Repository Settings** &rarr; **Branches** &rarr; **Add branch ruleset** (or **Branch protection rule**).

### A. Protection for `main` (Production)

- **Branch name pattern:** `main`
- [x] **Require a pull request before merging**
  - Require approvals: **1**
  - [x] **Dismiss stale pull request approvals when new commits are pushed**
  - [x] **Require review from Code Owners** (optional)
- [x] **Require status checks to pass before merging**
  - [x] **Require branches to be up to date before merging**
  - Required status check: `Lint, Typecheck, Test & Build`
- [x] **Block force pushes**
- [x] **Block deletions**
- [x] **Do not allow bypassing the above settings**

### B. Protection for `staging` (Pre-Production / QA)

- **Branch name pattern:** `staging`
- [x] **Require a pull request before merging**
  - Require approvals: **1** (QA or Lead)
- [x] **Require status checks to pass before merging**
  - Required status check: `Lint, Typecheck, Test & Build`
- [x] **Block force pushes**
- [x] **Block deletions**

### C. Protection for `dev` (Development / Integration)

- **Branch name pattern:** `dev`
- [x] **Require a pull request before merging**
  - Require approvals: **1** (Peer review)
- [x] **Require status checks to pass before merging**
  - Required status check: `Lint, Typecheck, Test & Build`
- [x] **Block force pushes**
- [x] **Block deletions**

### D. Workflow Permissions Setting

To allow GitHub Actions to automatically open promotion and sync PRs:

1. Go to **Settings** &rarr; **Actions** &rarr; **General**.
2. Scroll to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Check the box **"Allow GitHub Actions to create and approve pull requests"**.
5. Save changes.

_(Optional but recommended)_: Add a Personal Access Token or GitHub App token named `PROMOTION_TOKEN` to Repository Secrets so that PRs created by the action automatically trigger CI checks.

---

## 5. Environment Separation & Secret Management

### Strict Rule:

```text
Development Database ≠ Staging Database ≠ Production Database
```

**Never mix credentials or point staging/development to production databases or API keys.**

### Environment Matrix:

| Environment     | Branch    | Vercel Environment            | Supabase / Database    | Upstash Redis         | App URL                              |
| :-------------- | :-------- | :---------------------------- | :--------------------- | :-------------------- | :----------------------------------- |
| **Development** | `dev`     | `Preview` (Branch: `dev`)     | Supabase Dev DB        | Dev Redis cluster     | `https://dev-hms.goingmerry.com`     |
| **Staging**     | `staging` | `Preview` (Branch: `staging`) | Supabase Staging DB    | Staging Redis cluster | `https://staging-hms.goingmerry.com` |
| **Production**  | `main`    | `Production`                  | Supabase Production DB | Prod Redis cluster    | `https://hms.goingmerry.com`         |

### Required Environment Variables per Environment:

- `DATABASE_URL`: PostgreSQL connection pooler URI
- `DIRECT_URL`: PostgreSQL direct connection URI
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (backend only)
- `JWT_SECRET`: JWT encryption secret (min 32 chars)
- `UPSTASH_REDIS_REST_URL`: Upstash Redis endpoint
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis token
- `QSTASH_URL`: Upstash QStash publish URL
- `QSTASH_TOKEN`: Upstash QStash token
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `OPENROUTER_API_KEY`: OpenRouter API key for AI assistant
- `NEXT_PUBLIC_APP_URL`: Base application URL for the environment
- `NODE_ENV`: `development` | `production`

---

## 6. Vercel Deployment Configuration

In the Vercel Dashboard for the project:

1. **Git Integration**:
   - **Production Branch**: Set to `main`.
   - **Preview Branches**: Vercel automatically deploys any branch or PR.
2. **Environment Scoping in Vercel**:
   - Go to **Project Settings** &rarr; **Environment Variables**.
   - For every variable (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, etc.):
     - Assign the **Production** value to the `Production` scope.
     - Assign the **Staging** value to the `Preview` scope with custom branch: `staging`.
     - Assign the **Development** value to the `Preview` scope with custom branch: `dev`.
     - Assign ephemeral test values or development values to general `Preview` pull requests.
3. **Build Command**:
   - Vercel uses `npm run build`, which triggers `prisma generate && next build`.

---

## 7. Step-by-Step Operating Procedures

### A. Developer Daily Workflow

Each developer works on their dedicated personal branch (`saurabh`, `ankit`, `sahil`, `rizwan`). Do NOT create `feature/*` branches.

```bash
# 1. Switch to your personal branch
git checkout saurabh

# 2. Pull the latest integration changes from dev
git fetch origin dev
git merge origin/dev

# 3. Work on your tasks, write tests, and verify locally
npm run format:check
npm run lint
npx tsc --noEmit
npm test

# 4. Commit and push your changes
git add .
git commit -m "feat(module): describe task accomplishments"
git push origin saurabh

# 5. Open a Pull Request from your branch into dev via GitHub or GitHub CLI:
gh pr create --base dev --head saurabh --title "feat(module): your task title"
```

Once the PR passes CI and is reviewed and approved, merge it into `dev`.

---

### B. Release to Staging (QA)

1. When any developer's PR merges into `dev`, GitHub Actions automatically detects the push.
2. The workflow [`.github/workflows/promote-to-staging.yml`](file:///.github/workflows/promote-to-staging.yml) runs:
   - Verifies changes exist.
   - Checks that no open promotion PR is already active.
   - Automatically opens a PR: `dev` &rarr; `staging` titled `🚀 Promote dev → staging`.
3. The QA team and engineers review the PR:
   - Verify CI passes.
   - Test on the Vercel preview deployment.
4. When QA signs off, **merge the PR into `staging`**.
5. Staging environment deploys automatically.

---

### C. Release to Production

1. When the promotion PR merges into `staging`, GitHub Actions detects the push.
2. The workflow [`.github/workflows/promote-to-production.yml`](file:///.github/workflows/promote-to-production.yml) runs:
   - Checks for existing open production PRs.
   - Automatically opens a PR: `staging` &rarr; `main` titled `🚀 Promote staging → production`.
3. The Release Manager / Lead reviews the checklist and commit log.
4. When approved, **merge the PR into `main`**.
5. Production environment deploys automatically to Vercel.

---

### D. Critical Production Hotfix Workflow

If a critical bug is discovered in production that requires immediate remediation:

```bash
# 1. Create a hotfix branch directly from latest production (main)
git checkout main
git pull origin main
git checkout -b hotfix/fix-critical-issue

# 2. Implement the minimal fix, write an assertive regression test, and verify
npm test
npm run build

# 3. Commit and push the hotfix branch
git add .
git commit -m "fix(prod): resolve critical issue description"
git push -u origin hotfix/fix-critical-issue

# 4. Open an Emergency PR directly into main
gh pr create --base main --head hotfix/fix-critical-issue --title "🔥 Hotfix: resolve critical issue"
```

5. **Merge Hotfix into `main`**:
   - Once CI passes and an emergency review is completed, merge the hotfix PR into `main`.
   - Production immediately deploys the fix.
6. **Automated Backporting to Lower Environments**:
   - GitHub Actions automatically triggers [`.github/workflows/sync-hotfix.yml`](file:///.github/workflows/sync-hotfix.yml).
   - It detects that `main` is ahead of `staging` and `dev`.
   - It automatically opens two backport PRs:
     - `main` &rarr; `staging` (`🩹 Sync hotfix: main → staging`)
     - `main` &rarr; `dev` (`🩹 Sync hotfix: main → dev`)
   - Merge these two backport PRs to guarantee that future releases from `dev` and `staging` will never regress or overwrite the hotfix.
