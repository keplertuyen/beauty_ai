---
doc: github-publishing-guide
title: Publishing Syntheprise Framework to GitHub & sharing with the team
status: stable
precedence: 6
owner: Delivery Excellence
last_reviewed: 2026-06-18
---

# Publishing Syntheprise Framework to GitHub (private, internal)

Canonical repository: **`trmn-ai/syntheprise-framework`**, maintained under the
Syntheprise identity and shared with approved collaborators.

## 0. Prerequisites
- Git installed (`git --version`).
- A GitHub account and you are signed in.
- Optional but easier: the GitHub CLI (`gh`) — https://cli.github.com. Run
  `gh auth login` once.

## 1. Pre-flight (make sure it's clean)
From the repo folder:
```bash
find . -name .DS_Store -delete          # remove macOS junk
python3 scripts/doctor.py --template    # expect: OK — clean
python3 scripts/syntheprise_sync.py --check    # adapters in sync
python3 scripts/check-secrets.py        # no secrets
```
Confirm `CODEOWNERS` and `.github/ISSUE_TEMPLATE/config.yml` reference
`@trmn-ai` and the canonical repository.

## 2. Initialize git and make the first commit
```bash
git init -b main
git add .
git commit -m "chore: Syntheprise Framework v5.4.1 initial import"
git tag v5.4.1
```

## 3. Create the private repo and push

**Option A — GitHub CLI (one command):**
```bash
gh repo create trmn-ai/syntheprise-framework --private --source=. --remote=origin --push
git push origin v5.4.1            # push the tag too
```

**Option B — Web + git:**
1. github.com → **New repository** → name `syntheprise-framework`, visibility **Private**, do NOT
   add README/License/.gitignore (we already have them) → Create.
2. ```bash
   git remote add origin https://github.com/trmn-ai/syntheprise-framework.git
   git push -u origin main
   git push origin v5.4.1
   ```

## 4. Protect quality (recommended)
On GitHub → repo **Settings**:
- **Branches → Add branch ruleset / protection** for `main`:
  - Require a pull request before merging (≥ 1 review).
  - Require status checks to pass → select **Syntheprise Framework Quality Gate** (and the stack
    gates you use) once they have run at least once.
  - Require review from Code Owners (uses your `CODEOWNERS`).
- **General → Pull Requests:** allow squash merge; "one thin slice = one PR".
- **General → Features:** enable **Issues** and **Discussions**.
- The CI in `.github/workflows/` runs on every PR/push automatically.

> Note: a personal private repo enforces the gate on PRs but cannot require Code
> Owner review on the **free** plan; the check still requests reviewers. For full
> team controls (teams, required owner review), move the repo to a Syntheprise
> **Organization** later (Settings → Transfer ownership).

## 5. Share with the team
Personal repos share per-person (no teams):
- Repo **Settings → Collaborators → Add people** → enter each member's GitHub
  username or email → choose role **Write** (contributors) or **Read** (viewers).
- Members get an email invite; they accept, then `git clone` the repo.

Send the team:
- Repo URL: `https://github.com/trmn-ai/syntheprise-framework`
- "Read `README.md`, then `docs/_guides/00-quickstart.md` and `08-syntheprise-cli.md`."
- Onboarding command for a new project:
  `./syntheprise init <project> --tier 1 --adapter claude`

## 6. Releases
Create a release from the tag so the team can download a fixed version:
```bash
gh release create v5.4.1 --title "Syntheprise Framework v5.4.1" --notes-file CHANGELOG.md
```
(or GitHub → **Releases → Draft a new release → choose tag `v5.4.1`**).

## 7. Keeping it healthy
- Every change goes through a branch + PR; CI runs `doctor` + gates.
- If you edit `.agents/`, run `./syntheprise sync` and commit the regenerated files.
- Tag each meaningful release (`vX.Y.Z`) and update `CHANGELOG.md` + `VERSION`.
