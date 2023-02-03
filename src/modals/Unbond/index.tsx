// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faArrowAltCircleUp, faMinus } from '@fortawesome/free-solid-svg-icons';
import { ButtonSubmit } from '@rossbulat/polkadot-dashboard-ui';
import BigNumber from 'bignumber.js';
import { useApi } from 'contexts/Api';
import { useBalances } from 'contexts/Balances';
import { useConnect } from 'contexts/Connect';
import { useModal } from 'contexts/Modal';
import { useActivePools } from 'contexts/Pools/ActivePools';
import { usePoolsConfig } from 'contexts/Pools/PoolsConfig';
import { useStaking } from 'contexts/Staking';
import { useTransferOptions } from 'contexts/TransferOptions';
import { useTxFees } from 'contexts/TxFees';
import { EstimatedTxFee } from 'library/EstimatedTxFee';
import { UnbondFeedback } from 'library/Form/Unbond/UnbondFeedback';
import { Warning } from 'library/Form/Warning';
import { useSubmitExtrinsic } from 'library/Hooks/useSubmitExtrinsic';
import { Title } from 'library/Modal/Title';
import { FooterWrapper, NotesWrapper, PaddingWrapper } from 'modals/Wrappers';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { planckToUnit, unitToPlanck } from 'Utils';

export const Unbond = () => {
  const { t } = useTranslation('modals');
  const { api, network, consts } = useApi();
  const { units } = network;
  const { setStatus: setModalStatus, setResize, config } = useModal();
  const { activeAccount, accountHasSigner } = useConnect();
  const { staking, getControllerNotImported } = useStaking();
  const { getBondedAccount } = useBalances();
  const { bondFor } = config;
  const { stats } = usePoolsConfig();
  const { isDepositor, selectedActivePool } = useActivePools();
  const { txFees, txFeesValid } = useTxFees();
  const { getTransferOptions } = useTransferOptions();

  const controller = getBondedAccount(activeAccount);
  const controllerNotImported = getControllerNotImported(controller);
  const { minNominatorBond: minNominatorBondBn } = staking;
  const { minJoinBond: minJoinBondBn, minCreateBond: minCreateBondBn } = stats;
  const { bondDuration } = consts;

  let { unclaimedRewards } = selectedActivePool || {};
  unclaimedRewards = unclaimedRewards ?? new BigNumber(0);
  unclaimedRewards = planckToUnit(unclaimedRewards, network.units);

  const isStaking = bondFor === 'nominator';
  const isPooling = bondFor === 'pool';

  const allTransferOptions = getTransferOptions(activeAccount);
  const { active: activeBn } = isPooling
    ? allTransferOptions.pool
    : allTransferOptions.nominate;

  // convert BigNumber values to number
  const freeToUnbond = planckToUnit(activeBn, units);
  const minJoinBond = planckToUnit(minJoinBondBn, units);
  const minCreateBond = planckToUnit(minCreateBondBn, units);
  const minNominatorBond = planckToUnit(minNominatorBondBn, units);

  // local bond value
  const [bond, setBond] = useState<{ bond: string }>({
    bond: freeToUnbond.toString(),
  });

  // bond valid
  const [bondValid, setBondValid] = useState<boolean>(false);

  // get the max amount available to unbond
  const unbondToMin = isPooling
    ? isDepositor()
      ? BigNumber.max(freeToUnbond.minus(minCreateBond), new BigNumber(0))
      : BigNumber.max(freeToUnbond.minus(minJoinBond), new BigNumber(0))
    : BigNumber.max(freeToUnbond.minus(minNominatorBond), new BigNumber(0));

  // unbond some validation
  const isValid = isPooling ? true : !controllerNotImported;

  // update bond value on task change
  useEffect(() => {
    setBond({ bond: unbondToMin.toString() });
    setBondValid(isValid);
  }, [freeToUnbond.toString(), isValid]);

  // modal resize on form update
  useEffect(() => {
    setResize();
  }, [bond]);

  // tx to submit
  const getTx = () => {
    let tx = null;
    if (!bondValid || !api || !activeAccount) {
      return tx;
    }
    // stake unbond: controller must be imported
    if (isStaking && controllerNotImported) {
      return tx;
    }

    const bondToSubmit = unitToPlanck(bond.bond, units);
    const bondAsString = bondToSubmit.isNaN() ? '0' : bondToSubmit.toString();

    // determine tx
    if (isPooling) {
      tx = api.tx.nominationPools.unbond(activeAccount, bondAsString);
    } else if (isStaking) {
      tx = api.tx.staking.unbond(bondAsString);
    }
    return tx;
  };

  const signingAccount = isPooling ? activeAccount : controller;

  const { submitTx, submitting } = useSubmitExtrinsic({
    tx: getTx(),
    from: signingAccount,
    shouldSubmit: bondValid,
    callbackSubmit: () => {
      setModalStatus(2);
    },
    callbackInBlock: () => {},
  });

  const nominatorActiveBelowMin =
    bondFor === 'nominator' &&
    !activeBn.isZero() &&
    activeBn.isLessThan(minNominatorBondBn);

  const poolToMinBn = isDepositor() ? minCreateBondBn : minJoinBondBn;
  const poolActiveBelowMin =
    bondFor === 'pool' && activeBn.isLessThan(poolToMinBn);

  const warnings = [];
  if (!accountHasSigner(activeAccount)) {
    warnings.push(t('readOnly'));
  }

  if (unclaimedRewards > 0 && bondFor === 'pool') {
    warnings.push(
      `${t('unbondingWithdraw')} ${unclaimedRewards} ${network.unit}.`
    );
  }
  if (nominatorActiveBelowMin) {
    warnings.push(
      t('unbondErrorBelowMinimum', {
        bond: minNominatorBond,
        unit: network.unit,
      })
    );
  }
  if (poolActiveBelowMin) {
    warnings.push(
      t('unbondErrorBelowMinimum', {
        bond: planckToUnit(poolToMinBn, units),
        unit: network.unit,
      })
    );
  }
  if (activeBn.isZero()) {
    warnings.push(t('unbondErrorNoFunds', { unit: network.unit }));
  }

  return (
    <>
      <Title title={`${t('removeBond')}`} icon={faMinus} />
      <PaddingWrapper>
        {warnings.map((err: string, i: number) => (
          <Warning key={`unbond_error_${i}`} text={err} />
        ))}
        <UnbondFeedback
          bondFor={bondFor}
          listenIsValid={setBondValid}
          setters={[
            {
              set: setBond,
              current: bond,
            },
          ]}
          txFees={txFees}
        />
        <NotesWrapper>
          {bondFor === 'pool' ? (
            <>
              {isDepositor() ? (
                <p>
                  {t('notePoolDepositorMinBond', {
                    context: 'depositor',
                    bond: minCreateBond,
                    unit: network.unit,
                  })}
                </p>
              ) : (
                <p>
                  {t('notePoolDepositorMinBond', {
                    context: 'member',
                    bond: minCreateBond,
                    unit: network.unit,
                  })}
                </p>
              )}
            </>
          ) : null}
          <p>{t('onceUnbonding', { bondDuration })}</p>
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
                submitting ||
                !(bondValid && accountHasSigner(signingAccount) && txFeesValid)
              }
            />
          </div>
        </FooterWrapper>
      </PaddingWrapper>
    </>
  );
};
