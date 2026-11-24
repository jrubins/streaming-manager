# Adopts this deployment's two Vercel projects by ID. A no-op while they're in the state.
#
# Why: the first apply ran without a team configured, so the provider stored the projects'
# identity without a team ID; it now reports the team on every read, and Terraform stops with
# "Unexpected Identity Change". The fix is to run the Infrastructure workflow by hand with
# "reimport_vercel_projects" checked: it forgets the projects in the state (not in Vercel),
# and this file imports them again, with `vercel_team_id` now set, so the identities agree.
import {
  to = vercel_project.web
  id = "${var.vercel_team_id}/prj_GP6GdusvYzHVGcyflucWzdWwIAwV"
}

import {
  to = vercel_project.api
  id = "${var.vercel_team_id}/prj_8Z45FcL5jgEinMlzwazbhbYrfaOZ"
}
