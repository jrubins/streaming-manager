# Manual setup

This file records every step that happens outside the code, such as dashboards, accounts and
tokens. Terraform (`infra/`) handles everything else.

This deployment: repository `jrubins/streaming-manager`, `project_name` `stream-rotation`.
Copies of every credential are kept in Bitwarden (folder "Deploy tokens").

**Keep it current:**

- Tick a box when a step is done, and commit the change.
- Add a row whenever a token is created or rotated, or a dashboard setting changes.
- **Never write a secret value here**, even partly. Record only its name, where it lives, its
  scopes and its expiry. The values live in GitHub Actions secrets (you can't read them back
  once they're saved) and, if you want a copy, in your password manager.

## 1. Accounts and one-time setup

- [x] **`main` branch** exists. Terraform makes it the
      default branch and protects it.
- [x] **WorkOS** account and AuthKit application created ([sign up](https://workos.com)) (see section 3 for its settings).
- [x] **Cloudflare R2** (state storage, free tier): [sign up](https://dash.cloudflare.com/sign-up),
      then open [R2](https://dash.cloudflare.com/?to=/:account/r2/overview) and enable it (it asks
      for a payment method even on the free tier). Create a bucket named `terraform-state`; one
      bucket can hold every project's state, each under its own key (this one:
      `stream-rotation/terraform.tfstate`). Copy your **Account ID** from the R2 overview page.
- [x] **Vercel**: [sign up](https://vercel.com/signup) with GitHub, then
      [install the Vercel GitHub app](https://github.com/apps/vercel/installations/new) on
      `jrubins/streaming-manager` only.
- [x] **API address in `apps/web/vercel.json`**: replace `stream-rotation` in the `/api/:path*`
      rewrite with your project name, or with the API's real address once the first apply
      prints `api_url` (Vercel adds a suffix when the plain name is taken). The browser reaches
      the API only through this rewrite, so the session cookie stays first-party.
- [x] **Neon**: [sign up](https://console.neon.tech/signup). Terraform creates the project.
- [x] **Sentry**: [sign up](https://sentry.io/signup/), then copy the **Organization Slug** from
      [Settings → General Settings](https://sentry.io/settings/) into `sentry_organization` in
      `infra/terraform.tfvars`.
- [x] **Credentials**: create each one in section 2 and save it as a
      [repository secret](https://github.com/jrubins/streaming-manager/settings/secrets/actions).
- [x] **Repository variables**
      ([Actions variables](https://github.com/jrubins/streaming-manager/settings/variables/actions)):
      `TF_STATE_BUCKET` = `terraform-state`, `CLOUDFLARE_ACCOUNT_ID` = your Cloudflare
      account ID.
- [ ] **First apply**: [Actions → Infrastructure](https://github.com/jrubins/streaming-manager/actions/workflows/infra.yml)
      → **Run workflow** on `main`. Then redeploy both Vercel projects once.
- [ ] **WorkOS production settings** (section 3).
- [ ] **Claude connector**: in [claude.ai Settings → Connectors](https://claude.ai/settings/connectors),
      add a custom connector with the MCP URL (section 4). Sign in once.
- [ ] **Lock the app to you**: copy your WorkOS user ID (`user_...`, under Users in the WorkOS
      dashboard) into `allowed_user_ids` in `infra/terraform.tfvars`, then merge.

## 2. Credentials

All of these are GitHub Actions secrets on this repository, used only by
`.github/workflows/infra.yml`. The session cookie's encryption password needs no secret:
Terraform generates it and writes it straight to Vercel (bump `cookie_password_version` in
`infra/terraform.tfvars` to replace it, which signs everyone out). Prefer an expiry, and note it here so rotation isn't a surprise.

| Secret                    | What it is                                                               | Create it at                                                                                     | Permissions                                                                                                | Expires | Last set   |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------- | ---------- |
| `R2_ACCESS_KEY_ID`        | R2 API token: Access Key ID                                              | [R2 → Manage API tokens](https://dash.cloudflare.com/?to=/:account/r2/api-tokens)                | Object Read & Write, only the `terraform-state` bucket; **no IP filter** (GitHub runners use changing IPs) |         | 2026-11-24 |
| `R2_SECRET_ACCESS_KEY`    | R2 API token: Secret Access Key (same token)                             | Shown once when you create the token above                                                       | (same token)                                                                                               |         | 2026-11-24 |
| `VERCEL_API_TOKEN`        | Vercel access token                                                      | [Vercel → Account settings → Tokens](https://vercel.com/account/settings/tokens)                 | Scope: your personal account (or the team)                                                                 |         | 2026-11-24 |
| `NEON_API_KEY`            | Neon API key                                                             | [Neon → Account settings → API keys](https://console.neon.tech/app/settings/api-keys)            | Personal key (the whole account)                                                                           |         | 2026-11-24 |
| `SENTRY_AUTH_TOKEN`       | Sentry personal token for Terraform                                      | [Sentry → User settings → Personal Tokens](https://sentry.io/settings/account/api/auth-tokens/)  | `org:read`, `project:admin`, `team:admin`                                                                  |         | 2026-11-24 |
| `INFRA_GITHUB_TOKEN`      | Fine-grained personal access token                                       | [GitHub → Fine-grained tokens → New](https://github.com/settings/personal-access-tokens/new)     | Only `jrubins/streaming-manager`; Administration: RW                                                       |         | 2026-11-24 |
| `WORKOS_API_KEY`          | WorkOS API key: the API signs browsers in with it (server-side sessions) | [WorkOS → API Keys](https://dashboard.workos.com/api-keys)                                       | The same WorkOS environment as your client ID (Staging or Production)                                      |         | 2026-11-24 |
| `TMDB_API_TOKEN`          | TMDB API Read Access Token: title search and where titles stream         | [TMDB → Settings → API](https://www.themoviedb.org/settings/api) (free account, "Developer" use) | Read access (the only kind TMDB issues)                                                                    | Never   | 2026-11-24 |
| `SENTRY_SOURCEMAPS_TOKEN` | Optional: Sentry organization token (uploads)                            | [Sentry → Settings → Auth Tokens](https://sentry.io/settings/auth-tokens/)                       | Created with the default organization token scopes                                                         |         |            |

Also set `sentry_sourcemaps_token_version = 1` in `infra/terraform.tfvars` if you add
`SENTRY_SOURCEMAPS_TOKEN`.

**To rotate a credential:** create a new one, overwrite the secret in GitHub, revoke the old
one, and update the "Expires" and "Last set" columns. For `SENTRY_SOURCEMAPS_TOKEN`, also
bump `sentry_sourcemaps_token_version`. For the database password, see `infra/README.md`.

For local development, put the same TMDB token in `.env` as `TMDB_API_TOKEN`. TMDB's terms
require the attribution shown in the app's footer (TMDB, and JustWatch for streaming data);
keep it if you restyle the footer.

## 3. WorkOS (AuthKit)

WorkOS has no Terraform support for these settings yet, so they're set in the
[dashboard](https://dashboard.workos.com) and recorded here. The client ID and AuthKit domain
aren't secrets. They're also in `infra/terraform.tfvars`.

Every setting below belongs to one WorkOS environment (Staging or Production, switched at the
top of the dashboard): the one your client ID and API key come from. A redirect URI saved in the
other environment gives "redirect URI invalid" at sign-in.

| Setting                                                   | Value                                                                                                        | Done |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---- |
| Client ID                                                 | `client_01M86YRTQ0EBJHMX4M7Y08PQ2J`                                                                          | [x]  |
| AuthKit domain                                            | `https://cuddly-jasmine-10.authkit.app`                                                                      | [x]  |
| Authentication → sign-in methods                          | Turn on Magic Auth (or email + password): new environments may offer only SSO, which blocks sign-in          | [ ]  |
| Redirects → Redirect URI (local)                          | `http://localhost:5173/api/auth/callback`                                                                    | [ ]  |
| Redirects → Redirect URI (production)                     | `https://stream-rotation-web.vercel.app/api/auth/callback` (sign-in returns to the API, through the web app) | [ ]  |
| Redirects → Initiate login URI                            | `https://stream-rotation-web.vercel.app/login`                                                               | [ ]  |
| Redirects → Sign-out redirect                             | `https://stream-rotation-web.vercel.app` (sign-out fails without one)                                        | [ ]  |
| Client ID Metadata Document (search "Client ID Metadata") | Enabled (how Claude registers)                                                                               | [ ]  |
| Dynamic Client Registration (search "Dynamic Client")     | Enabled (older MCP clients)                                                                                  | [ ]  |
| Resource Indicators                                       | `https://stream-rotation-api.vercel.app/mcp`, set as default                                                 | [ ]  |
| Sign-up                                                   | Restricted to you, or locked via `allowed_user_ids`                                                          | [ ]  |

The browser never calls WorkOS directly (sign-in runs on the API), so WorkOS needs no CORS
setting.

If Vercel assigned different URLs (the first apply prints `web_url`, `api_url` and
`mcp_url`), use those here and in `infra/terraform.tfvars`.

## 4. Live URLs

Fill these in after the first apply.

| What                   | URL                            |
| ---------------------- | ------------------------------ |
| Web app                |                                |
| API                    |                                |
| MCP (Claude connector) |                                |
| Neon project           |                                |
| Sentry projects        |                                |
| Terraform state        | `terraform-state` bucket in R2 |
