// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useApi } from 'contexts/Api';
import { usePoolMemberships } from 'contexts/Pools/PoolMemberships';
import { useStaking } from 'contexts/Staking';
import { useSubscan } from 'contexts/Subscan';
import { useTheme } from 'contexts/Themes';
import { useUi } from 'contexts/UI';
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import {
  defaultThemes,
  networkColors,
  networkColorsSecondary,
} from 'theme/default';
import { AnySubscan } from 'types';
import { PayoutLineProps } from './types';
import {
  calculatePayoutAverages,
  combineRewardsByDay,
  formatRewardsForGraphs,
} from './Utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const PayoutLine = ({
  days,
  average,
  height,
  background,
}: PayoutLineProps) => {
  const { t } = useTranslation('library');
  const { mode } = useTheme();
  const { name, unit, units } = useApi().network;
  const { isSyncing } = useUi();
  const { inSetup } = useStaking();
  const { membership: poolMembership } = usePoolMemberships();
  const { payouts, poolClaims } = useSubscan();

  const notStaking = !isSyncing && inSetup() && !poolMembership;
  const poolingOnly = !isSyncing && inSetup() && poolMembership !== null;

  // remove slashes from payouts (graph does not support negative values).
  const payoutsNoSlash = payouts.filter(
    (p: AnySubscan) => p.event_id !== 'Slashed'
  );

  const { payoutsByDay, poolClaimsByDay } = formatRewardsForGraphs(
    days,
    units,
    payoutsNoSlash,
    poolClaims
  );

  // combine payouts and pool claims into one dataset and calculate averages.
  const combined = combineRewardsByDay(payoutsByDay, poolClaimsByDay);

  const combinedPayouts = calculatePayoutAverages(combined, 10, days);

  // determine color for payouts
  const color = notStaking
    ? networkColors[`${name}-${mode}`]
    : !poolingOnly
    ? networkColors[`${name}-${mode}`]
    : networkColorsSecondary[`${name}-${mode}`];

  // configure graph options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
          maxTicksLimit: 30,
          autoSkip: true,
        },
      },
      y: {
        ticks: {
          display: false,
          beginAtZero: false,
        },
        border: {
          display: false,
        },
        grid: {
          color: defaultThemes.graphs.grid[mode],
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        backgroundColor: defaultThemes.graphs.tooltip[mode],
        titleColor: defaultThemes.text.invert[mode],
        bodyColor: defaultThemes.text.invert[mode],
        bodyFont: {
          weight: '600',
        },
        callbacks: {
          title: () => [],
          label: (context: any) =>
            ` ${new BigNumber(context.parsed.y).toFormat()} ${unit}`,
        },
        intersect: false,
        interaction: {
          mode: 'nearest',
        },
      },
    },
  };

  const data = {
    labels: combinedPayouts.map(() => ''),
    datasets: [
      {
        label: t('payout'),
        data: combinedPayouts.map((item: AnySubscan) => item?.amount ?? 0),
        borderColor: color,
        backgroundColor: color,
        pointStyle: undefined,
        pointRadius: 0,
        borderWidth: 2.3,
      },
    ],
  };

  return (
    <>
      <h5 className="secondary" style={{ paddingLeft: '1.5rem' }}>
        {average > 1 ? `${average} ${t('dayAverage')}` : null}
      </h5>
      <div
        className="graph_line"
        style={{
          height: height || 'auto',
          background: background || 'none',
        }}
      >
        <Line options={options} data={data} />
      </div>
    </>
  );
};
