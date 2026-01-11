interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'Saving...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-overlay-content">
        <div className="spinner"></div>
        <span>{message}</span>
      </div>
    </div>
  )
}
