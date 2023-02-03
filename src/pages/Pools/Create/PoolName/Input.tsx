// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useConnect } from 'contexts/Connect';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const Input = (props: any) => {
  const { listenIsValid, defaultValue } = props;
  const setters = props.setters ?? [];
  const _value = props.value ?? 0;
  const { activeAccount } = useConnect();
  const { t } = useTranslation('pages');

  // the current local bond value
  const [metadata, setMetadata] = useState(_value);

  // handle change for bonding
  const handleChange = (e: any) => {
    const { value } = e.target;
    listenIsValid(value !== '');
    setMetadata(value);

    // apply value to parent setters
    for (const s of setters) {
      s.set({
        ...s.current,
        metadata: value,
      });
    }
  };

  // reset value to default when changing account
  useEffect(() => {
    setMetadata(defaultValue ?? '');
  }, [activeAccount]);

  return (
    <>
      <div style={{ margin: '1rem 0' }}>
        <input
          className="textbox"
          style={{ width: '100%' }}
          placeholder={`${t('pools.poolName')}`}
          type="text"
          onChange={(e: React.FormEvent<HTMLInputElement>) => handleChange(e)}
          value={metadata ?? ''}
        />
      </div>
      <p>{t('pools.poolNameSupport')}</p>
    </>
  );
};
