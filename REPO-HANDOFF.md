# Repo handoff — Terb-13/summit-graphics

**Intended live URL:** https://github.com/Terb-13/summit-graphics

This scaffold is the Summit Graphics Sirvoce demo (two-door Supabase auth, EXAMPLE catalog, no Clerk, no Stripe).

## Create-repo blocker (2026-09-17)

`Terb-13` is a **User** account, not an org. The Cursor GitHub App installation token cannot create a new user repository:

```
POST /user/repos → 403 Resource not accessible by integration
gh repo create Terb-13/summit-graphics → GraphQL: Resource not accessible by integration (createRepository)
POST /repos/Terb-13/flexible-labels/forks → 403 Resource not accessible by integration
POST /repos/Terb-13/flexible-labels/generate → 404 (source is not a template)
GET https://github.com/Terb-13/summit-graphics → still 404
```

Digital Engineer (or Terb-13): create an **empty private GitHub repo** named `summit-graphics` under the Terb-13 user. Then this tree can be pushed to `main` (or a PR opened there). Origin was not used.

Until that repo exists, this branch may live on `Terb-13/flexible-labels` as a **do-not-merge** holding copy.
