// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { u8aToString, u8aUnwrapBytes } from '@polkadot/util';
import { useApi } from 'contexts/Api';
import { useConnect } from 'contexts/Connect';
import { useBondedPools } from 'contexts/Pools/BondedPools';
import { useTheme } from 'contexts/Themes';
import { Identicon } from 'library/Identicon';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { defaultThemes } from 'theme/default';
import { clipAddress, remToUnit } from '../../Utils';
import { PoolAccountProps } from './types';
import { Wrapper } from './Wrapper';

export const PoolAccount = (props: PoolAccountProps) => {
  const { mode } = useTheme();
  const { isReady } = useApi();
  const { activeAccount } = useConnect();
  const { fetchPoolsMetaBatch, meta } = useBondedPools();
  const { t } = useTranslation('library');

  const { label } = props;

  // is this the initial fetch
  const [fetched, setFetched] = useState(false);

  const batchKey = 'pool_header';

  // refetch when pool or active account changes
  useEffect(() => {
    setFetched(false);
  }, [activeAccount, props.pool]);

  // configure pool list when network is ready to fetch
  useEffect(() => {
    if (isReady) {
      setFetched(true);

      if (!fetched) {
        getPoolMeta();
      }
    }
  }, [isReady, fetched]);

  // handle pool list bootstrapping
  const getPoolMeta = () => {
    const pools: any = [{ id: props.pool.id }];
    fetchPoolsMetaBatch(batchKey, pools, true);
  };

  const filled = props.filled ?? false;
  const fontSize = props.fontSize ?? '1.05rem';
  const { canClick }: { canClick: boolean } = props;

  const metaBatch = meta[batchKey];
  const metaData = metaBatch?.metadata?.[0];
  const syncing = metaData === undefined;

  // display value
  const defaultDisplay = clipAddress(props.pool.addresses.stash);
  let display = syncing ? t('syncing') : metaData ?? defaultDisplay;

  // check if super identity has been byte encoded
  const displayAsBytes = u8aToString(u8aUnwrapBytes(display));
  if (displayAsBytes !== '') {
    display = displayAsBytes;
  }
  // if still empty string, default to clipped address
  if (display === '') {
    display = defaultDisplay;
  }

  return (
    <Wrapper
      whileHover={{ scale: 1.01 }}
      onClick={props.onClick}
      cursor={canClick ? 'pointer' : 'default'}
      fill={filled ? defaultThemes.buttons.secondary.background[mode] : 'none'}
      fontSize={fontSize}
    >
      {label !== undefined && <div className="account-label">{label}</div>}

      <span className="identicon">
        <Identicon
          value={props.pool.addresses.stash}
          size={remToUnit(fontSize) * 1.45}
        />
      </span>
      <span className={`title${syncing === true ? ` syncing` : ``}`}>
        {display}
      </span>
    </Wrapper>
  );
};
