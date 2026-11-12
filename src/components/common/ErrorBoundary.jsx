import React from 'react';
import { AlertOctagon, RotateCcw, Home, Sparkles } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/options';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            backgroundColor: '#f8fafc',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <AlertOctagon size={28} />
            </div>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '8px',
              }}
            >
              Terjadi Kendala pada Tampilan
            </h3>

            <p
              style={{
                fontSize: '14px',
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '24px',
              }}
            >
              Sistem mendeteksi kendala runtime rendering pada halaman ini. Data rekam medis dan transaksi Anda tetap aman di server.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#334155',
                  overflowX: 'auto',
                  marginBottom: '24px',
                  maxHeight: '120px',
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <RotateCcw size={16} />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontWeight: '600',
                  fontSize: '14px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Home size={16} />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
