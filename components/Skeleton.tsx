import React from 'react';

interface Props {
  className?: string;
  count?: number;
}

const Skeleton: React.FC<Props> = ({ className = "", count = 1 }) => {
  return (
    <div className="space-y-2 animate-pulse w-full">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}></div>
      ))}
    </div>
  );
};

export default Skeleton;