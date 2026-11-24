# Non-secret settings for this deployment. Secrets are environment variables in CI.
# Replace every CHANGE-ME here and the state key in versions.tf (see infra/README.md).
project_name        = "CHANGE-ME"        # base name for Vercel, Neon and Sentry projects
github_owner        = "CHANGE-ME"        # GitHub user or organization
github_repository   = "CHANGE-ME"        # this repository's name
sentry_organization = "CHANGE-ME"        # Sentry organization slug
workos_client_id    = "client_CHANGE-ME" # WorkOS: Developer > API Keys
authkit_domain      = "https://CHANGE-ME.authkit.app"
# After your first sign-in, add your WorkOS user ID to lock the app to you:
allowed_user_ids = []
