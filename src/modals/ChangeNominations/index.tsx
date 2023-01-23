// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowAltCircleUp } from '@fortawesome/free-regular-svg-icons';
import { faStopCircle } from '@fortawesome/free-solid-svg-icons';
import { ButtonSubmit } from '@rossbulat/polkadot-dashboard-ui';
import { useApi } from 'contexts/Api';
import { useBalances } from 'contexts/Balances';
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
import {
  FooterWrapper,
  NotesWrapper,
  PaddingWrapper,
  Separator,
} from '../Wrappers';

export const ChangeNominations = () => {
  const { api } = useApi();
  const { activeAccount, accountHasSigner } = useConnect();
  const { getBondedAccount, getAccountNominations } = useBalances();
  const { setStatus: setModalStatus, config } = useModal();
  const { poolNominations, isNominator, isOwner, selectedActivePool } =
    useActivePools();
  const { txFeesValid } = useTxFees();
  const { t } = useTranslation('modals');

  const { nominations: newNominations, provider, bondFor } = config;

  const isPool = bondFor === 'pool';
  const isStaking = bondFor === 'nominator';
  const controller = getBondedAccount(activeAccount);
  const signingAccount = isPool ? activeAccount : controller;

  const nominations =
    isPool === true
      ? poolNominations.targets
      : getAccountNominations(activeAccount);
  const removing = nominations.length - newNominations.length;
  const remaining = newNominations.length;

  // valid to submit transaction
  const [valid, setValid] = useState<boolean>(false);

  // ensure selected key is valid
  useEffect(() => {
    setValid(nominations.length > 0);
  }, [nominations]);

  // ensure roles are valid
  let isValid = nominations.length > 0;
  if (isPool) {
    isValid = (isNominator() || isOwner()) ?? false;
  }
  useEffect(() => {
    setValid(isValid);
  }, [isValid]);

  // tx to submit
  const getTx = () => {
    let tx = null;
    if (!valid || !api) {
      return tx;
    }

    // targets submission differs between staking and pools
    const targetsToSubmit = newNominations.map((item: any) =>
      isPool
        ? item
        : {
            Id: item,
          }
    );

    if (isPool) {
      // if nominations remain, call nominate
      if (remaining !== 0) {
        tx = api.tx.nominationPools.nominate(
          selectedActivePool?.id || 0,
          targetsToSubmit
        );
      } else {
        // wishing to stop all nominations, call chill
        tx = api.tx.nominationPools.chill(selectedActivePool?.id || 0);
      }
    } else if (isStaking) {
      if (remaining !== 0) {
        tx = api.tx.staking.nominate(targetsToSubmit);
      } else {
        tx = api.tx.staking.chill();
      }
    }
    return tx;
  };

  const { submitTx, submitting } = useSubmitExtrinsic({
    tx: getTx(),
    from: signingAccount,
    shouldSubmit: valid,
    callbackSubmit: () => {
      setModalStatus(2);

      // if removing a subset of nominations, reset selected list
      if (provider) {
        provider.setSelectActive(false);
        provider.resetSelected();
      }
    },
    callbackInBlock: () => {},
  });

  return (
    <>
      <Title title={t('stopNominating')} icon={faStopCircle} />
      <PaddingWrapper verticalOnly>
        <div
          style={{
            padding: '0 1.25rem',
            width: '100%',
          }}
        >
          {!nominations.length ? (
            <Warning text={t('noNominationsSet')} />
          ) : null}
          {!accountHasSigner(signingAccount) && (
            <Warning
              text={`${
                bondFor === 'nominator'
                  ? t('youMust', { context: 'controller' })
                  : t('youMust', { context: 'account' })
              }`}
            />
          )}
          <h2 className="title">
            {t('stop')}{' '}
            {!remaining
              ? t('allNominations')
              : `${t('nomination', { count: removing })}`}
          </h2>
          <Separator />
          <NotesWrapper>
            <p>{t('changeNomination')}</p>
            <EstimatedTxFee />
          </NotesWrapper>
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
                  !accountHasSigner(signingAccount) ||
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
