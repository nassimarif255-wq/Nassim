import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'حدث خطأ غير متوقع في التطبيق.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback" dir="rtl">
          <div className="error-fallback-box">
            <h2>تعذر إتمام العملية</h2>
            <p>
              حدث خطأ تقني أثناء الاتصال بقاعدة البيانات أو عرض المحتوى. يمكنك
              إعادة تحميل الصفحة والمحاولة مجدداً.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => window.location.reload()}
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
