import React from 'react';
import CommonPageHeader from './CommonPageHeader';
import CommonDataTable from './CommonDataTable';
import RemittancePaging from './RemittancePaging';

interface Column {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: any) => React.ReactNode;
}

interface CommonPageLayoutProps {
  title: string;
  subtitle: string;
  gradientColors?: {
    from: string;
    to: string;
  };
  columns: Column[];
  data: any[];
  emptyMessage: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onRowClick?: (item: any) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const CommonPageLayout: React.FC<CommonPageLayoutProps> = ({
  title,
  subtitle,
  gradientColors,
  columns,
  data,
  emptyMessage,
  totalCount,
  currentPage,
  pageSize,
  onRowClick,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  children
}) => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isSmallMobile, setIsSmallMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSmallMobile(width <= 480);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      maxWidth: isSmallMobile ? '100%' : isMobile ? '100%' : '650px',
      margin: isSmallMobile ? '0' : isMobile ? '0' : '0.9rem auto 2.5rem',
      padding: '0'
    }}>
      <CommonPageHeader
        title={title}
        subtitle={subtitle}
        gradientColors={gradientColors}
      />

      {children}

      <CommonDataTable
        columns={columns}
        data={data}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
        isLoading={isLoading}
      />

      <RemittancePaging
        currentPage={currentPage}
        totalPages={Math.ceil(totalCount / pageSize)}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

export default CommonPageLayout;
