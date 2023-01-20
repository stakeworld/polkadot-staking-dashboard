// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowAltCircleUp } from '@fortawesome/free-regular-svg-icons';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ButtonSubmit } from '@rossbulat/polkadot-dashboard-ui';
import BigNumber from 'bignumber.js';
import { useApi } from 'contexts/Api';
import { useBalances } from 'contexts/Balances';
import { useConnect } from 'contexts/Connect';
import { useModal } from 'contexts/Modal';
import { useActivePools } from 'contexts/Pools/ActivePools';
import { useBondedPools } from 'contexts/Pools/BondedPools';
import { usePoolMembers } from 'contexts/Pools/PoolMembers';
import { usePoolMemberships } from 'contexts/Pools/PoolMemberships';
import { usePoolsConfig } from 'contexts/Pools/PoolsConfig';
import { useTxFees } from 'contexts/TxFees';
import { EstimatedTxFee } from 'library/EstimatedTxFee';
import { Warning } from 'library/Form/Warning';
import { useSubmitExtrinsic } from 'library/Hooks/useSubmitExtrinsic';
import { forwardRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { planckToUnit, rmCommas } from 'Utils';
import { FooterWrapper, NotesWrapper, Separator } from '../Wrappers';
import { ContentWrapper } from './Wrappers';

export const Forms = forwardRef(
  ({ setSection, unlock, task }: any, ref: any) => {
    const { api, network, consts } = useApi();
    const { activeAccount, accountHasSigner } = useConnect();
    const { removeFavorite: removeFavoritePool } = usePoolsConfig();
    const { membership } = usePoolMemberships();
    const { selectedActivePool } = useActivePools();
    const { removeFromBondedPools } = useBondedPools();
    const { removePoolMember } = usePoolMembers();
    const { setStatus: setModalStatus, config } = useModal();
    const { getBondedAccount } = useBalances();
    const { txFeesValid } = useTxFees();
    const { t } = useTranslation('modals');

    const { bondFor, poolClosure } = config || {};
    const { historyDepth } = consts;
    const { units } = network;
    const controller = getBondedAccount(activeAccount);

    const isStaking = bondFor === 'nominator';
    const isPooling = bondFor === 'pool';

    // valid to submit transaction
    const [valid, setValid] = useState<boolean>(
      unlock?.value?.toNumber() > 0 ?? false
    );

    // ensure unlock value is valid
    useEffect(() => {
      setValid(unlock?.value?.toNumber() > 0 ?? false);
    }, [unlock]);

    // tx to submit
    const getTx = () => {
      let tx = null;
      if (!valid || !api) {
        return tx;
      }
      // rebond is only available when staking directly.
      if (task === 'rebond' && isStaking) {
        tx = api.tx.staking.rebond(unlock.value.toNumber());
      } else if (task === 'withdraw' && isStaking) {
        tx = api.tx.staking.withdrawUnbonded(historyDepth.toString());
      } else if (task === 'withdraw' && isPooling && selectedActivePool) {
        tx = api.tx.nominationPools.withdrawUnbonded(
          activeAccount,
          historyDepth.toString()
        );
      }
      return tx;
    };
    const signingAccount = isStaking ? controller : activeAccount;
    const { submitTx, submitting } = useSubmitExtrinsic({
      tx: getTx(),
      from: signingAccount,
      shouldSubmit: valid,
      callbackSubmit: () => {
        setModalStatus(2);
      },
      callbackInBlock: () => {
        // if pool is being closed, remove from static lists
        if (poolClosure) {
          removeFavoritePool(selectedActivePool?.addresses?.stash ?? '');
          removeFromBondedPools(selectedActivePool?.id ?? 0);
        }

        // if no more bonded funds from pool, remove from poolMembers list
        if (bondFor === 'pool') {
          const points = membership?.points ? rmCommas(membership.points) : 0;
          const bonded = planckToUnit(new BigNumber(points), network.units);
          if (bonded.isZero()) {
            removePoolMember(activeAccount);
          }
        }
      },
    });

    const value = unlock?.value ?? new BigNumber(0);

    return (
      <ContentWrapper>
        <div ref={ref} style={{ paddingBottom: '1rem' }}>
          <div>
            {!accountHasSigner(signingAccount) && (
              <Warning text={t('readOnly')} />
            )}

            <div style={{ marginTop: '2rem' }}>
              {task === 'rebond' && (
                <h2 className="title">
                  {`${t('rebond')} ${planckToUnit(value, units)} ${
                    network.unit
                  }`}
                </h2>
              )}
              {task === 'withdraw' && (
                <h2 className="title">
                  {`${t('withdraw')} ${planckToUnit(value, units)} ${
                    network.unit
                  }`}
                </h2>
              )}
            </div>
            <Separator />
            <NotesWrapper>
              <EstimatedTxFee />
            </NotesWrapper>
          </div>
          <FooterWrapper>
            <div>
              <button
                type="button"
                className="submit secondary"
                onClick={() => setSection(0)}
              >
                <FontAwesomeIcon transform="shrink-2" icon={faChevronLeft} />
                {t('back')}
              </button>
            </div>
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
      </ContentWrapper>
    );
  }
);
