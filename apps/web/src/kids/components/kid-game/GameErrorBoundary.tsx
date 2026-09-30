// ============================================================================
// GAME ERROR BOUNDARY — PREVENT GAME CRASHES FROM BREAKING THE APP
// Graceful fallback • Error recovery • Technical reporting
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { GameButton } from './GameButton';

interface Props {
  children: ReactNode;
  onExit?: () => void;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GameErrorBoundary] Game encountered an unexpected error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md select-none">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border-4 border-amber-300">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              {this.props.fallbackTitle || 'Không Thể Mở Trò Chơi'}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
              Trò chơi tạm thời gặp lỗi kết nối hoặc hiển thị. Bé hãy thử tải lại hoặc quay lại danh mục nhé!
            </p>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mb-6 p-3 rounded-xl bg-slate-100 text-left font-mono text-[11px] text-rose-600 overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <GameButton
                variant="amber"
                size="md"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={this.handleRetry}
              >
                Thử lại
              </GameButton>

              <GameButton
                variant="ghost"
                size="md"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={this.props.onExit || (() => window.history.back())}
              >
                Quay lại
              </GameButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
