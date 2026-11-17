import { useTeam } from "../../contexts/team-context"
import { TEAM_COLORS, TEAM_LABELS } from "../../../shared/teams"
import "./TeamBadge.css"

export function TeamBadge() {
  const { team } = useTeam()
  const color = TEAM_COLORS[team].primary

  return (
    <div className="team-badge" data-testid="team-badge">
      <div className="team-badge-dot" data-testid="team-color-dot" style={{ background: color }} />
      <span className="team-badge-name" data-testid="team-name">
        {TEAM_LABELS[team]}
        <span className="team-badge-suffix"> team</span>
      </span>
    </div>
  )
}
