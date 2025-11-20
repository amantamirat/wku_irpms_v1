import React from 'react';

interface BadgeProps {
  type: 'status' | 'academic' | 'classification' | 'gender' | 'stage';
  value: string;
}

const MyBadge: React.FC<BadgeProps> = ({ type, value }) => {
  const className = `${type}-badge ${type}-${value.toLowerCase()}`;
  return <span className={className}>{value}</span>;
};

export default MyBadge;
