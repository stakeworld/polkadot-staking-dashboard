// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faGlasses } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useConnect } from 'contexts/Connect';
import { useExtensions } from 'contexts/Extensions';
import { ExtensionInjected } from 'contexts/Extensions/types';
import { useModal } from 'contexts/Modal';
import { Identicon } from 'library/Identicon';
import { clipAddress } from 'Utils';
import { AccountElementProps } from './types';
import { AccountWrapper } from './Wrappers';

export const AccountElement = (props: AccountElementProps) => {
  return (
    <AccountWrapper>
      <div>
        <AccountInner {...props} />
      </div>
    </AccountWrapper>
  );
};

export const AccountButton = (props: AccountElementProps) => {
  const { meta } = props;
  const disconnect = props.disconnect ?? false;
  const { connectToAccount, disconnectFromAccount } = useConnect();
  const { setStatus } = useModal();
  const imported = meta !== null;

  return (
    <AccountWrapper>
      <button
        type="button"
        disabled={!disconnect && !imported}
        onClick={() => {
          if (imported) {
            if (disconnect) {
              disconnectFromAccount();
            } else {
              connectToAccount(meta);
              setStatus(2);
            }
          }
        }}
      >
        <AccountInner {...props} />
      </button>
    </AccountWrapper>
  );
};

export const AccountInner = (props: AccountElementProps) => {
  const { address, meta } = props;

  const { extensions } = useExtensions();
  const extension = extensions.find(
    (e: ExtensionInjected) => e.id === meta?.source
  );
  const Icon = extension?.icon ?? null;
  const label = props.label ?? null;
  const source = meta?.source ?? null;
  const imported = meta !== null && source !== 'external';

  return (
    <>
      <div>
        <Identicon value={address ?? ''} size={26} />
        <span className="name">
          &nbsp; {meta?.name ?? clipAddress(address ?? '')}
        </span>
      </div>
      {!imported && (
        <div
          className="label warning"
          style={{ color: '#a17703', paddingLeft: '0.5rem' }}
        >
          Read Only
        </div>
      )}

      <div className={label === null ? `` : label[0]}>
        {label !== null && <h5>{label[1]}</h5>}
        {Icon !== null && <Icon className="icon" />}

        {!imported && (
          <FontAwesomeIcon
            icon={faGlasses as IconProp}
            className="icon"
            style={{ opacity: 0.7 }}
          />
        )}
      </div>
    </>
  );
};
