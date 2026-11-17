// Modified by sav-maya
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TEAMS, TEAM_COLORS, TEAM_LABELS, teamNameToId } from "../../../../shared/teams"
import { useTeam } from "../../../../src/contexts/team-context"
import { TeamBadge } from "../../../../src/components/ui/TeamBadge"
import type { TeamName } from "../../../../shared/teams"

// Mock the team context
vi.mock(`../../../../src/contexts/team-context`, () => ({
  useTeam: vi.fn(),
}))
const mockUseTeam = vi.mocked(useTeam)

describe(`TeamBadge`, () => {
  it(`displays the team's display name`, () => {
    mockUseTeam.mockReturnValue({
      team: `FOX`,
      teamId: 0,
    })

    render(<TeamBadge />)

    expect(screen.getByTestId(`team-name`)).toHaveTextContent(`Fox`)
  })

  it.each(TEAMS)(`displays the correct color dot for %s`, (team) => {
    mockUseTeam.mockReturnValue({ team, teamId: teamNameToId(team) })

    render(<TeamBadge />)

    const dot = screen.getByTestId(`team-color-dot`)
    expect(dot).toHaveStyle({ background: TEAM_COLORS[team].primary })
  })

  it(`renders all team variations correctly`, () => {
    const teams: Array<{ team: TeamName; display: string }> = [
      { team: `FOX`, display: `Fox team` },
      { team: `JAY`, display: `Jay team` },
      { team: `FROG`, display: `Frog team` },
      { team: `FLAMINGO`, display: `Flamingo team` },
    ]

    for (const { team, display } of teams) {
      mockUseTeam.mockReturnValue({ team, teamId: teamNameToId(team) })

      const { unmount } = render(<TeamBadge />)

      expect(screen.getByTestId(`team-name`)).toHaveTextContent(display)
      expect(screen.getByTestId(`team-color-dot`)).toHaveStyle({
        background: TEAM_COLORS[team].primary,
      })

      unmount()
    }
  })

  it(`keeps exactly four teams with labels`, () => {
    expect(TEAMS).toHaveLength(4)
    for (const team of TEAMS) expect(TEAM_LABELS[team]).toBeTruthy()
  })

  it(`has correct test IDs for accessibility`, () => {
    mockUseTeam.mockReturnValue({
      team: `FOX`,
      teamId: 0,
    })

    render(<TeamBadge />)

    expect(screen.getByTestId(`team-badge`)).toBeInTheDocument()
    expect(screen.getByTestId(`team-color-dot`)).toBeInTheDocument()
    expect(screen.getByTestId(`team-name`)).toBeInTheDocument()
  })
})
