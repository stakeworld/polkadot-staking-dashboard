// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faBullhorn as faBack } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BigNumber from 'bignumber.js';
import { useApi } from 'contexts/Api';
import { useBondedPools } from 'contexts/Pools/BondedPools';
import { usePoolMembers } from 'contexts/Pools/PoolMembers';
import { BondedPool } from 'contexts/Pools/types';
import { useStaking } from 'contexts/Staking';
import { useUi } from 'contexts/UI';
import { motion } from 'framer-motion';
import { Announcement as AnnouncementLoader } from 'library/Loaders/Announcement';
import { useTranslation } from 'react-i18next';
import {
  capitalizeFirstLetter,
  planckToUnit,
  rmCommas,
  sortWithNull,
} from 'Utils';
import { Item } from './Wrappers';

export const Announcements = () => {
  const { t } = useTranslation('pages');
  const { poolsSyncing, isSyncing } = useUi();
  const { network } = useApi();
  const { eraStakers } = useStaking();
  const { units } = network;
  const { poolMembers } = usePoolMembers();
  const { bondedPools } = useBondedPools();
  const { totalStaked } = eraStakers;

  let totalPoolPoints = new BigNumber(0);
  bondedPools.forEach((b: BondedPool) => {
    totalPoolPoints = totalPoolPoints.plus(new BigNumber(rmCommas(b.points)));
  });
  const totalPoolPointsUnit = planckToUnit(totalPoolPoints, units);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25,
      },
    },
  };

  const listItem = {
    hidden: {
      opacity: 0,
    },
    show: {
      opacity: 1,
    },
  };

  const announcements = [];

  const networkUnit = network.unit;

  // total staked on the network
  if (!isSyncing) {
    announcements.push({
      class: 'neutral',
      title: t('overview.networkCurrentlyStaked', {
        total: planckToUnit(totalStaked, units).integerValue().toFormat(),
        unit: network.unit,
        network: capitalizeFirstLetter(network.name),
      }),
      subtitle: t('overview.networkCurrentlyStakedSubtitle', {
        unit: network.unit,
      }),
    });
  } else {
    announcements.push(null);
  }

  // total locked in pools
  if (bondedPools.length) {
    announcements.push({
      class: 'neutral',
      title: `${totalPoolPointsUnit.integerValue().toFormat()} ${
        network.unit
      } ${t('overview.inPools')}`,
      subtitle: `${t('overview.bondedInPools', { networkUnit })}`,
    });
  } else {
    announcements.push(null);
  }

  if (bondedPools.length && poolMembers.length > 0 && !poolsSyncing) {
    // total locked in pols
    announcements.push({
      class: 'neutral',
      title: `${new BigNumber(poolMembers.length).toFormat()} ${t(
        'overview.poolMembersBonding'
      )}`,
      subtitle: `${t('overview.totalNumAccounts')}`,
    });
  } else {
    announcements.push(null);
  }

  announcements.sort(sortWithNull(true));

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ width: '100%' }}
    >
      {announcements.map((item, index) =>
        item === null ? (
          <AnnouncementLoader key={`announcement_${index}`} />
        ) : (
          <Item key={`announcement_${index}`} variants={listItem}>
            <h4 className={item.class}>
              <FontAwesomeIcon
                icon={faBack}
                style={{ marginRight: '0.6rem' }}
              />
              {item.title}
            </h4>
            <p>{item.subtitle}</p>
          </Item>
        )
      )}
    </motion.div>
  );
};
