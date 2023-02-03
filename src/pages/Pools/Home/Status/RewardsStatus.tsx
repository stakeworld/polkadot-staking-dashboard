// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faPlus, faShare } from '@fortawesome/free-solid-svg-icons';
import BigNumber from 'bignumber.js';
import { useApi } from 'contexts/Api';
import { useConnect } from 'contexts/Connect';
import { useModal } from 'contexts/Modal';
import { useActivePools } from 'contexts/Pools/ActivePools';
import { useUi } from 'contexts/UI';
import { Stat } from 'library/Stat';
import { useTranslation } from 'react-i18next';
import { planckToUnit } from 'Utils';

export const RewardsStatus = () => {
  const { t } = useTranslation('pages');
  const {
    network: { units, unit },
    isReady,
  } = useApi();
  const { poolsSyncing } = useUi();
  const { openModalWith } = useModal();
  const { selectedActivePool } = useActivePools();
  const { activeAccount, isReadOnlyAccount } = useConnect();

  let { unclaimedRewards } = selectedActivePool || {};
  unclaimedRewards = unclaimedRewards ?? new BigNumber(0);

  // Set the minimum unclaimed planck value to prevent e numbers.
  const minUnclaimedDisplay = new BigNumber(1_000_000);

  const labelRewards = unclaimedRewards.isGreaterThan(minUnclaimedDisplay)
    ? `${planckToUnit(unclaimedRewards, units)} ${unit}`
    : `0 ${unit}`;

  // Display Reward buttons if unclaimed rewards is a non-zero value.
  const buttonsRewards = unclaimedRewards.isGreaterThan(minUnclaimedDisplay)
    ? [
        {
          title: t('pools.withdraw'),
          icon: faShare,
          disabled: !isReady || isReadOnlyAccount(activeAccount),
          small: true,
          onClick: () =>
            openModalWith('ClaimReward', { claimType: 'withdraw' }, 'small'),
        },
        {
          title: t('pools.bond'),
          icon: faPlus,
          disabled:
            !isReady ||
            isReadOnlyAccount(activeAccount) ||
            selectedActivePool?.bondedPool?.state === 'Destroying',
          small: true,
          onClick: () =>
            openModalWith('ClaimReward', { claimType: 'bond' }, 'small'),
        },
      ]
    : undefined;

  return (
    <Stat
      label={t('pools.unclaimedRewards')}
      helpKey="Pool Rewards"
      stat={labelRewards}
      buttons={poolsSyncing ? [] : buttonsRewards}
    />
  );
};
