'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        background: '#0d0f17',
                        color: 'white',
                        fontFamily: 'Inter, sans-serif',
                        gap: '16px',
                        padding: '24px',
                    }}>
                        <div style={{ fontSize: '3rem' }}>💥</div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Something went wrong</h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '400px', textAlign: 'center' }}>
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
