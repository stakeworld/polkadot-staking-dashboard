// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useConnect } from 'contexts/Connect';
import { ImportedAccount } from 'contexts/Connect/types';
import { useExtensions } from 'contexts/Extensions';
import { useModal } from 'contexts/Modal';
import { useEffect, useRef, useState } from 'react';
import { Accounts } from './Accounts';
import { Extensions } from './Extensions';
import { CardsWrapper, Wrapper } from './Wrappers';

export const ConnectAccounts = () => {
  const modal = useModal();
  const { extensions } = useExtensions();
  const { activeAccount } = useConnect();
  let { accounts } = useConnect();
  const { config } = modal;
  const _section = config?.section ?? null;

  // active section of modal
  const [section, setSection] = useState(
    _section !== null ? _section : activeAccount !== null ? 1 : 0
  );

  // toggle read only management
  const [readOnlyOpen, setReadOnlyOpen] = useState(false);

  // resize modal on state change
  const extensionsRef = useRef<HTMLDivElement>(null);
  const accountsRef = useRef<HTMLDivElement>(null);

  const resizeModal = () => {
    let _height = 0;
    if (section === 0) {
      _height = extensionsRef.current?.clientHeight ?? 0;
    } else if (section === 1) {
      _height = accountsRef.current?.clientHeight ?? 0;
    }
    modal.setModalHeight(_height);
  };

  useEffect(() => {
    resizeModal();
  }, [
    section,
    activeAccount,
    accounts,
    extensions,
    modal.height,
    readOnlyOpen,
  ]);

  // remove active account from connect list
  accounts = accounts.filter(
    (item: ImportedAccount) => item.address !== activeAccount
  );

  return (
    <Wrapper>
      <CardsWrapper
        animate={section === 0 ? 'home' : 'next'}
        initial={false}
        transition={{
          duration: 0.5,
          type: 'spring',
          bounce: 0.1,
        }}
        variants={{
          home: {
            left: 0,
          },
          next: {
            left: '-100%',
          },
        }}
      >
        <Extensions
          setSection={setSection}
          readOnlyOpen={readOnlyOpen}
          setReadOnlyOpen={setReadOnlyOpen}
          ref={extensionsRef}
        />
        <Accounts setSection={setSection} ref={accountsRef} />
      </CardsWrapper>
    </Wrapper>
  );
};
