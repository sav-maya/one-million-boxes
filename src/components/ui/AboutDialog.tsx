import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { TEAMS, TEAM_COLORS, TEAM_LABELS } from "../../../shared/teams"
import { GAME_NAME, LEARN_MORE_URL } from "../../../shared/brand"
import { useTeam } from "../../contexts/team-context"
import { canTapToConfirm, tapToConfirm } from "../../lib/settings"
import {
  MAX_QUOTA,
  QUOTA_BONUS_DOUBLE,
  QUOTA_BONUS_SINGLE,
  QUOTA_REFILL_INTERVAL_MS,
  TOTAL_BOX_COUNT,
} from "../../lib/config"
import type { TeamName } from "../../../shared/teams"
import "./AboutDialog.css"

export interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scores?: [number, number, number, number]
  isLoading?: boolean
}

interface TeamScore {
  team: TeamName
  score: number
  color: string
}

export function AboutDialog({
  open,
  onOpenChange,
  scores = [0, 0, 0, 0],
  isLoading = false,
}: AboutDialogProps) {
  const { team: userTeam } = useTeam()
  const { primary: userTeamColor, ink: buttonTextColor } = TEAM_COLORS[userTeam]
  const tapTwice = tapToConfirm.use() && canTapToConfirm()
  const contentRef = useRef<HTMLDivElement>(null)
  const playButtonRef = useRef<HTMLButtonElement>(null)
  const [hasOverflowTop, setHasOverflowTop] = useState(false)
  const [hasOverflowBottom, setHasOverflowBottom] = useState(false)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Check scroll position and overflow state
  useEffect(() => {
    if (!open) {
      setHasOverflowTop(false)
      setHasOverflowBottom(false)
      resizeObserverRef.current?.disconnect()
      return
    }

    // Wait for portal to mount, then set up observers
    const timeoutId = setTimeout(() => {
      const content = contentRef.current
      if (!content) return

      // Ensure dialog starts at top on open
      content.scrollTop = 0

      const checkOverflow = () => {
        const { scrollTop, scrollHeight, clientHeight } = content
        // Has content hidden above?
        setHasOverflowTop(scrollTop > 1)
        // Has content hidden below? (1px threshold for rounding)
        setHasOverflowBottom(scrollTop + clientHeight < scrollHeight - 1)
      }

      // Check immediately
      checkOverflow()

      // Listen for scroll events
      content.addEventListener(`scroll`, checkOverflow, { passive: true })

      // Use ResizeObserver to detect size changes
      resizeObserverRef.current = new ResizeObserver(checkOverflow)
      resizeObserverRef.current.observe(content)

      // Store scroll listener cleanup
      return () => {
        content.removeEventListener(`scroll`, checkOverflow)
      }
    }, 50)

    return () => {
      clearTimeout(timeoutId)
      resizeObserverRef.current?.disconnect()
      contentRef.current?.removeEventListener(`scroll`, () => {})
    }
  }, [open])

  // Calculate claimed and remaining
  const totalClaimed = scores.reduce((a, b) => a + b, 0)
  const remaining = TOTAL_BOX_COUNT - totalClaimed

  // Create team scores sorted by score (descending)
  const hasScores = totalClaimed > 0
  const teamScores: Array<TeamScore> = TEAMS.map((team, i) => ({
    team,
    score: scores[i],
    color: TEAM_COLORS[team].primary,
  }))

  if (hasScores) {
    teamScores.sort((a, b) => b.score - a.score)
  }

  const refillSeconds = QUOTA_REFILL_INTERVAL_MS / 1000

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="about-dialog-backdrop" />
        <Dialog.Popup className="about-dialog-popup" initialFocus={playButtonRef}>
          <Dialog.Title className={`about-dialog-title${hasOverflowTop ? ` has-overflow` : ``}`}>
            <img src="/logo.svg" alt={GAME_NAME} className="about-dialog-logo" />
          </Dialog.Title>

          <div className="about-dialog-content" ref={contentRef}>
            <p>
              A friendly game of{` `}
              <a
                href="https://en.wikipedia.org/wiki/Dots_and_boxes"
                target="_blank"
                rel="noopener noreferrer"
              >
                Dots &amp; Boxes
              </a>
              {` `}
              for you and your friends, played live on one shared board of{` `}
              <strong>1,000,000 boxes</strong>.
            </p>

            <h3 className="about-dialog-section-title">How to play</h3>
            <ul className="about-dialog-rules">
              <li>
                <span className="desktop-only">Click between two dots to draw a line.</span>
                <span className="mobile-only">
                  {tapTwice
                    ? `Tap a line to pick it, then tap it again to draw it.`
                    : `Tap between two dots to draw a line.`}
                </span>
              </li>
              <li>Draw the fourth side of a box to claim it for your team.</li>
              <li>The team with the most boxes wins.</li>
            </ul>

            <h3 className="about-dialog-section-title">Moves</h3>
            <ul className="about-dialog-rules">
              <li>
                You can hold up to <strong>{MAX_QUOTA} moves</strong> at a time.
              </li>
              <li>
                You get <strong>1 move back every {refillSeconds} seconds</strong>.
              </li>
              <li>
                Claim a box and you get <strong>{QUOTA_BONUS_SINGLE} moves</strong> back.
              </li>
              <li>
                Claim two boxes with one line and you get{" "}
                <strong>{QUOTA_BONUS_DOUBLE} moves</strong>
                {` `}
                back.
              </li>
            </ul>

            <h3 className="about-dialog-section-title">Team scores</h3>
            <div className="about-dialog-leaderboard">
              {isLoading
                ? TEAMS.map((team, index) => (
                    <div
                      key={team}
                      className="about-leaderboard-item about-leaderboard-item--loading"
                    >
                      <span className="about-leaderboard-rank">{index + 1}</span>
                      <span className="about-leaderboard-dot about-skeleton" />
                      <span className="about-leaderboard-team about-skeleton about-skeleton-text" />
                      <span className="about-leaderboard-score about-skeleton about-skeleton-number" />
                    </div>
                  ))
                : teamScores.map(({ team, score, color }, index) => (
                    <div
                      key={team}
                      className="about-leaderboard-item"
                      style={{ "--score-color": color } as CSSProperties}
                    >
                      <span className="about-leaderboard-rank">{index + 1}</span>
                      <span className="about-leaderboard-dot" style={{ background: color }} />
                      <span className="about-leaderboard-team">{TEAM_LABELS[team]}</span>
                      <span className="about-leaderboard-score">{score.toLocaleString()}</span>
                    </div>
                  ))}
            </div>

            <div className="about-dialog-stats">
              <div className="about-stat">
                {isLoading ? (
                  <span className="about-stat-value about-skeleton about-skeleton-number" />
                ) : (
                  <span className="about-stat-value">{remaining.toLocaleString()}</span>
                )}
                <span className="about-stat-label">boxes available</span>
              </div>
              <div className="about-stat">
                {isLoading ? (
                  <span className="about-stat-value about-skeleton about-skeleton-number" />
                ) : (
                  <span className="about-stat-value">{totalClaimed.toLocaleString()}</span>
                )}
                <span className="about-stat-label">boxes claimed</span>
              </div>
            </div>

            <p className="about-dialog-tech">
              Built with{` `}
              <a
                href="https://neon.com/docs/realtime/overview"
                target="_blank"
                rel="noopener noreferrer"
              >
                Neon Realtime
              </a>
              , which keeps every board in sync.{` `}
              <a href={LEARN_MORE_URL} target="_blank" rel="noopener noreferrer">
                See how it&apos;s built
              </a>
              .
            </p>
          </div>

          <div
            className={`about-dialog-button-container${hasOverflowBottom ? ` has-overflow` : ``}`}
          >
            <Dialog.Close
              ref={playButtonRef}
              className="about-dialog-close-button"
              style={{
                background: userTeamColor,
                color: buttonTextColor,
              }}
            >
              Play for the {TEAM_LABELS[userTeam]} team
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
