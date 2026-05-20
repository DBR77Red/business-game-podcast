import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorScreen extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-6 px-6 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-red-400">Off Air</p>
        <h2 className="text-xl text-stone-200 max-w-md">Something went wrong loading the show.</h2>
        <pre className="text-xs text-stone-500 max-w-md whitespace-pre-wrap break-words bg-stone-900/50 p-3 rounded border border-stone-800">
          {this.state.error.message}
        </pre>
        <p className="text-xs text-stone-500 max-w-md">
          Most often this means the server isn't running on port 3001, or the API keys in <code>.env</code> are missing. Check the dev terminal.
        </p>
        <button
          onClick={this.handleReload}
          className="px-8 py-3 border border-stone-600 text-stone-400 text-sm tracking-[0.2em] uppercase hover:border-stone-400 hover:text-stone-200 transition-colors"
        >
          Reload
        </button>
      </div>
    )
  }
}
