import { Component, type ReactNode } from 'react';

export class WorldBoundary extends Component<
  { children: ReactNode; message?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="world-fallback" role="status">
          {this.props.message ??
            'The 3D background is unavailable. All portfolio content and navigation remain available.'}
        </p>
      );
    }

    return this.props.children;
  }
}
