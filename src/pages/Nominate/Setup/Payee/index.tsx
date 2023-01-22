// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';
import { useConnect } from 'contexts/Connect';
import { useSetup } from 'contexts/Setup';
import { Footer } from 'library/SetupSteps/Footer';
import { Header } from 'library/SetupSteps/Header';
import { MotionContainer } from 'library/SetupSteps/MotionContainer';
import { SetupStepProps } from 'library/SetupSteps/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spacer } from '../../Wrappers';
import { Item, Items } from './Wrappers';

export const Payee = ({ section }: SetupStepProps) => {
  const { t } = useTranslation('pages');
  const { activeAccount } = useConnect();
  const { getSetupProgress, setActiveAccountSetup } = useSetup();
  const setup = getSetupProgress('stake', activeAccount);

  const options = ['Staked', 'Stash', 'Controller'];
  const buttons = [
    {
      title: t('nominate.backToStaking'),
      subtitle: t('nominate.automaticallyBonded'),
      index: 0,
    },
    {
      title: t('nominate.toStash'),
      subtitle: t('nominate.sentToStash'),
      index: 1,
    },
    {
      title: t('nominate.toController'),
      subtitle: t('nominate.sentToController'),
      index: 2,
    },
  ];

  const [payee, setPayee]: any = useState(setup.payee);

  // update selected value on account switch
  useEffect(() => {
    setPayee(setup.payee);
  }, [activeAccount]);

  const handleChangePayee = (i: number) => {
    if (new BigNumber(i).isNaN() || i >= options.length) {
      return;
    }
    // set local value to update input element
    setPayee(options[i]);
    // set setup payee
    setActiveAccountSetup('stake', {
      ...setup,
      payee: options[i],
    });
  };

  return (
    <>
      <Header
        thisSection={section}
        complete={setup.payee !== null}
        title={t('nominate.rewardDestination') || ''}
        helpKey="Reward Destination"
        setupType="stake"
      />
      <MotionContainer thisSection={section} activeSection={setup.section}>
        <Spacer />
        <Items>
          {buttons.map((item: any, index: number) => {
            return (
              <Item
                key={`payee_option_${index}`}
                selected={payee === options[item.index]}
                onClick={() => handleChangePayee(item.index)}
              >
                <div>
                  <h3>{item.title}</h3>
                  <div>
                    <p>{item.subtitle}</p>
                  </div>
                </div>
              </Item>
            );
          })}
        </Items>
        <Footer complete={setup.payee !== null} setupType="stake" />
      </MotionContainer>
    </>
  );
};
