import { strings } from '../../i18n/en';
import type { PlayerStats } from '../../services/statsStore';
import type { IsoDate } from '../../types/puzzle';
import { Modal } from '../Modal/Modal';
import { StatsPanel } from './StatsPanel';

export function StatsModal({
  open,
  onClose,
  stats,
  today,
  modeLabel,
}: {
  open: boolean;
  onClose: () => void;
  stats: PlayerStats;
  today: IsoDate;
  modeLabel: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={`${strings.stats} · ${modeLabel}`}>
      <StatsPanel
        stats={stats}
        today={today}
        distribution={{
          title: strings.statsDistribution,
          rows: stats.mistakeDistribution.map((count, i) => ({ label: strings.statsMistakeLabel(i), count })),
          empty: strings.statsEmpty,
        }}
      />
    </Modal>
  );
}
