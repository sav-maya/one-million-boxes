// Modified by sav-maya
/**
 * Team keys in order of team ID. The API returns these keys; Postgres stores
 * only the numeric team ID (0-3), never a name or colour.
 */
export const TEAMS = [`FOX`, `JAY`, `FROG`, `FLAMINGO`] as const

/**
 * Type for team keys.
 */
export type TeamName = (typeof TEAMS)[number]

/**
 * Display names, written for sentence-case UI copy ("Fox team").
 */
export const TEAM_LABELS: Record<TeamName, string> = {
  FOX: `Fox`,
  JAY: `Jay`,
  FROG: `Frog`,
  FLAMINGO: `Flamingo`,
}

export interface TeamColor {
  /** Edges, badges, score chips, pencil, moves dial. At least 3:1 on the board. */
  primary: string
  /** Translucent box fill. */
  fill: string
  /** Primary as 0-255 channels for the box bitmap. */
  rgb: { r: number; g: number; b: number }
  /** Text colour placed on primary, at least 4.5:1. */
  ink: string
}

function teamColor(primary: string, ink: string): TeamColor {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(primary.slice(i, i + 2), 16))
  return { primary, fill: `rgba(${r}, ${g}, ${b}, 0.5)`, rgb: { r, g, b }, ink }
}

/**
 * The single source of team colours. Okabe-Ito based and checked against the
 * #FAFAFA board for 3:1 contrast and for separation under protanopia,
 * deuteranopia and tritanopia. Jay and Flamingo are deeper shades of the
 * defaults to pass those checks.
 */
export const TEAM_COLORS: Record<TeamName, TeamColor> = {
  FOX: teamColor(`#D55E00`, `#131415`),
  JAY: teamColor(`#00639B`, `#FFFFFF`),
  FROG: teamColor(`#009E73`, `#131415`),
  FLAMINGO: teamColor(`#C3739F`, `#131415`),
}

/**
 * Convert a team ID (0-3) to a team key.
 */
export function teamIdToName(teamId: number): TeamName {
  if (teamId < 0 || teamId >= TEAMS.length) {
    throw new Error(`Invalid team ID: ${teamId}`)
  }
  return TEAMS[teamId]
}

/**
 * Convert a team key to a team ID (0-3).
 */
export function teamNameToId(name: TeamName): number {
  const id = TEAMS.indexOf(name)
  if (id === -1) {
    throw new Error(`Invalid team name: ${name}`)
  }
  return id
}

/**
 * Get the colors for a team by ID.
 */
export function getTeamColor(teamId: number): TeamColor {
  const name = teamIdToName(teamId)
  return TEAM_COLORS[name]
}
