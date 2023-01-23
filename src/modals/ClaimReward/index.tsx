// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowAltCircleUp } from '@fortawesome/free-regular-svg-icons';
import { faPlus, faShare } from '@fortawesome/free-solid-svg-icons';
import { ButtonSubmit } from '@rossbulat/polkadot-dashboard-ui';
import BigNumber from 'bignumber.js';
import { useApi } from 'contexts/Api';
import { useConnect } from 'contexts/Connect';
import { useModal } from 'contexts/Modal';
import { useActivePools } from 'contexts/Pools/ActivePools';
import { useTxFees } from 'contexts/TxFees';
import { EstimatedTxFee } from 'library/EstimatedTxFee';
import { Warning } from 'library/Form/Warning';
import { useSubmitExtrinsic } from 'library/Hooks/useSubmitExtrinsic';
import { Title } from 'library/Modal/Title';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { planckToUnit } from 'Utils';
import { FooterWrapper, PaddingWrapper, Separator } from '../Wrappers';

export const ClaimReward = () => {
  const { api, network } = useApi();
  const { setStatus: setModalStatus, config } = useModal();
  const { selectedActivePool } = useActivePools();
  const { activeAccount, accountHasSigner } = useConnect();
  const { txFeesValid } = useTxFees();
  const { units, unit } = network;
  let { unclaimedRewards } = selectedActivePool || {};
  unclaimedRewards = unclaimedRewards ?? new BigNumber(0);
  const { claimType } = config;
  const { t } = useTranslation('modals');

  // ensure selected payout is valid
  useEffect(() => {
    if (unclaimedRewards?.isGreaterThan(0)) {
      setValid(true);
    } else {
      setValid(false);
    }
  }, [selectedActivePool]);

  // valid to submit transaction
  const [valid, setValid] = useState<boolean>(false);

  // tx to submit
  const getTx = () => {
    let tx = null;
    if (!api) {
      return tx;
    }

    if (claimType === 'bond') {
      tx = api.tx.nominationPools.bondExtra('Rewards');
    } else {
      tx = api.tx.nominationPools.claimPayout();
    }
    return tx;
  };

  const { submitTx, submitting } = useSubmitExtrinsic({
    tx: getTx(),
    from: activeAccount,
    shouldSubmit: valid,
    callbackSubmit: () => {
      setModalStatus(2);
    },
    callbackInBlock: () => {},
  });

  return (
    <>
      <Title
        title={`${claimType === 'bond' ? t('bond') : t('withdraw')} ${t(
          'rewards'
        )}`}
        icon={claimType === 'bond' ? faPlus : faShare}
      />
      <PaddingWrapper>
        <div
          style={{
            width: '100%',
          }}
        >
          {!accountHasSigner(activeAccount) ? (
            <Warning text={t('readOnly')} />
          ) : null}
          {!unclaimedRewards?.isGreaterThan(0) ? (
            <Warning text={t('noRewards')} />
          ) : null}
          <h2 className="title">
            {`${planckToUnit(unclaimedRewards, units)} ${unit}`}
          </h2>
          <Separator />
          <div className="notes">
            {claimType === 'bond' ? (
              <p>{t('claimReward1')}</p>
            ) : (
              <p>{t('claimReward2')}</p>
            )}
            <EstimatedTxFee />
          </div>
          <FooterWrapper>
            <div>
              <ButtonSubmit
                text={`${submitting ? t('submitting') : t('submit')}`}
                iconLeft={faArrowAltCircleUp}
                iconTransform="grow-2"
                onClick={() => submitTx()}
                disabled={
                  !valid ||
                  submitting ||
                  !accountHasSigner(activeAccount) ||
                  !txFeesValid
                }
              />
            </div>
          </FooterWrapper>
        </div>
      </PaddingWrapper>
    </>
  );
};
