// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useApi } from 'contexts/Api';
import { useTheme } from 'contexts/Themes';
import { Doughnut } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { defaultThemes, networkColors } from 'theme/default';
import { BondedProps } from './types';
import { GraphWrapper } from './Wrappers';

ChartJS.register(ArcElement, Tooltip, Legend);

export const Bonded = ({
  active,
  free,
  unlocking,
  unlocked,
  inactive,
}: BondedProps) => {
  const { mode } = useTheme();
  const { network } = useApi();
  const { t } = useTranslation('library');

  // graph data
  let graphActive = active;
  let graphUnlocking = unlocking.plus(unlocked);
  let graphAvailable = free;

  let zeroBalance = false;
  if (inactive) {
    graphActive = new BigNumber(-1);
    graphUnlocking = new BigNumber(-1);
    graphAvailable = new BigNumber(-1);
    zeroBalance = true;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    spacing: zeroBalance ? 0 : 2,
    plugins: {
      legend: {
        padding: {
          right: 20,
        },
        display: true,
        position: 'left' as const,
        align: 'center' as const,
        labels: {
          padding: 20,
          color: defaultThemes.text.primary[mode],
          font: {
            size: 12.5,
            weight: '600',
          },
        },
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
          label: (context: any) => {
            if (inactive) {
              return t('graphInactive');
            }
            return `${
              context.parsed === -1
                ? 0
                : new BigNumber(context.parsed).toFormat()
            } ${network.unit}`;
          },
        },
      },
    },
    cutout: '75%',
  };
  const _colors = zeroBalance
    ? [
        defaultThemes.graphs.colors[1][mode],
        defaultThemes.graphs.inactive2[mode],
        defaultThemes.graphs.inactive[mode],
      ]
    : [
        networkColors[`${network.name}-${mode}`],
        defaultThemes.graphs.colors[0][mode],
        defaultThemes.graphs.colors[1][mode],
      ];

  const data = {
    labels: [t('active'), t('unlocking'), t('available')],
    datasets: [
      {
        label: network.unit,
        data: [graphActive, graphUnlocking, graphAvailable],
        backgroundColor: _colors,
        borderWidth: 0,
      },
    ],
  };

  return (
    <GraphWrapper
      transparent
      noMargin
      style={{ border: 'none', boxShadow: 'none' }}
    >
      <div
        className="graph"
        style={{
          flex: 0,
          paddingRight: '1rem',
          height: 160,
        }}
      >
        <Doughnut options={options} data={data} />
      </div>
    </GraphWrapper>
  );
};
