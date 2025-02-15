import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title?: string;
  icon?: React.ReactNode;
}

const PageHeader = ({
  title = 'X-me',
  icon = <Users className="w-6 h-6" />,
}: PageHeaderProps) => {
  return (
    <div className="border-b border-light-100 dark:border-dark-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-2">
          {icon}
          <h1 className="text-xl font-medium text-black dark:text-white">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default PageHeader; 