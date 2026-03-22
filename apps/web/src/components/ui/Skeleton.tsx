type SkeletonVariant = 'default' | 'circle' | 'text' | 'card';

const variantClasses: Record<SkeletonVariant, string> = {
  default: '',
  circle: 'rounded-full',
  text: 'h-[14px] rounded-[4px]',
  card: 'rounded-[var(--border-radius-md)]',
};

export function Skeleton({
  className = '',
  variant = 'default',
}: {
  className?: string;
  variant?: SkeletonVariant;
}) {
  return (
    <div
      className={`shimmer ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );
}
