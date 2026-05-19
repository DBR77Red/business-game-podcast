interface Props {
  onPressStart: () => void
  onPressEnd: () => void
  isRecording: boolean
  isDisabled: boolean
}

export function MicButton({ onPressStart, onPressEnd, isRecording, isDisabled }: Props) {
  const handlePressStart = () => {
    if (!isDisabled) onPressStart()
  }
  const handlePressEnd = () => {
    if (!isDisabled) onPressEnd()
  }

  return (
    <button
      type="button"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={(e) => {
        e.preventDefault()
        handlePressStart()
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
        handlePressEnd()
      }}
      onTouchCancel={(e) => {
        e.preventDefault()
        handlePressEnd()
      }}
      disabled={isDisabled}
      className={[
        'w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-150 select-none',
        isDisabled
          ? 'border-stone-700 text-stone-700 cursor-not-allowed'
          : isRecording
            ? 'border-green-400 bg-green-400/20 text-green-400 scale-110 shadow-[0_0_20px_rgba(74,222,128,0.4)]'
            : 'border-stone-500 text-stone-400 hover:border-green-400 hover:text-green-400 cursor-pointer',
      ].join(' ')}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
      <span className="sr-only">Hold to speak</span>
    </button>
  )
}
