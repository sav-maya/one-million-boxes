// Modified by sav-maya
import { MoveDial } from "../ui/MoveDial"
import { LEARN_MORE_URL } from "../../../shared/brand"
import "./Footer.css"

export function Footer() {
  return (
    <footer className="footer" data-testid="footer">
      <div className="footer-left">
        <MoveDial className="footer-move-dial" testId="quota-meter" />
      </div>
      <div className="footer-learn">
        <span className="footer-credit">Built with Neon Realtime</span>
        <a
          href={LEARN_MORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
          aria-label="See how this game is built (opens in a new tab)"
        >
          <span className="footer-link-desktop">See how it&apos;s built</span>
          <span className="footer-link-mobile">How it&apos;s built</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </footer>
  )
}
