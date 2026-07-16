import { Component } from 'react'

// R3F's Canvas catches errors thrown while rendering the WebGL tree (lost
// context, driver issues, unsupported features) internally and then
// re-throws them outward so the host app decides what to do. Without this
// boundary that re-thrown error has nowhere to land and crashes the page;
// here it just falls back to the static 2D scene instead.
class CanvasErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('HeroScene failed to render, falling back to static scene:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export default CanvasErrorBoundary
