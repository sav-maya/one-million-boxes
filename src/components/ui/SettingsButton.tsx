import { useId } from "react"
import { Popover } from "@base-ui/react/popover"
import { Switch } from "@base-ui/react/switch"
import { canTapToConfirm, canVibrate, tapToConfirm, vibration } from "../../lib/settings"
import "./SettingsButton.css"

function SettingSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <label className="settings-row">
      <span className="settings-text">
        <span id={`${id}-label`} className="settings-label">
          {label}
        </span>
        <span id={`${id}-description`} className="settings-description">
          {description}
        </span>
      </span>
      <Switch.Root
        className="settings-switch"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
      >
        <Switch.Thumb className="settings-switch-thumb" />
      </Switch.Root>
    </label>
  )
}

/** Touch and haptics preferences, shown only where they apply. */
export function SettingsButton() {
  const tapEnabled = tapToConfirm.use()
  const vibrationEnabled = vibration.use()
  const showTap = canTapToConfirm()
  const showVibration = canVibrate()
  if (!showTap && !showVibration) return null

  return (
    <Popover.Root>
      <Popover.Trigger
        className="zoom-button minimap-settings-button"
        aria-label="Settings"
        title="Settings"
        data-testid="settings-button"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="10" cy="12" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className="settings-positioner"
          side="top"
          align="end"
          sideOffset={8}
          collisionPadding={12}
        >
          <Popover.Popup className="settings-popup" data-testid="settings-popup">
            <Popover.Title className="settings-title">Settings</Popover.Title>
            {showTap && (
              <SettingSwitch
                label="Tap twice to draw"
                description="Tap a line to pick it, then tap it again to draw it."
                checked={tapEnabled}
                onCheckedChange={tapToConfirm.set}
              />
            )}
            {showVibration && (
              <SettingSwitch
                label="Vibration"
                description="Buzz when you draw, claim a box or run out of moves."
                checked={vibrationEnabled}
                onCheckedChange={vibration.set}
              />
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
