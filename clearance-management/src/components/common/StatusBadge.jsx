const STATUS_CONFIG = {
  cleared: {
    label: 'Cleared',
    className: 'badge-cleared',
    icon: '✓',
  },
  pending: {
    label: 'Pending',
    className: 'badge-pending',
    icon: '◷',
  },
  rejected: {
    label: 'Rejected',
    className: 'badge-rejected',
    icon: '✕',
  },
  held: {
    label: 'On Hold',
    className: 'badge-held',
    icon: '⊡',
  },
  deficiency: {
    label: 'Deficiency',
    className: 'badge-deficiency',
    icon: '!',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`badge ${config.className}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}