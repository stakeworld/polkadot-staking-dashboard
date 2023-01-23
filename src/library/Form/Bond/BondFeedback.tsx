// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';
import { useApi } from 'contexts/Api';
import { useConnect } from 'contexts/Connect';
import { useActivePools } from 'contexts/Pools/ActivePools';
import { usePoolsConfig } from 'contexts/Pools/PoolsConfig';
import { useStaking } from 'contexts/Staking';
import { useTransferOptions } from 'contexts/TransferOptions';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { planckToUnit, unitToPlanck } from 'Utils';
import { BondFeedbackProps } from '../types';
import { Warning } from '../Warning';
import { Spacer } from '../Wrappers';
import { BondInput } from './BondInput';

export const BondFeedback = ({
  bondFor,
  inSetup = false,
  warnings = [],
  setters = [],
  listenIsValid = () => {},
  disableTxFeeUpdate = false,
  defaultBond,
  txFees,
  maxWidth,
  syncing = false,
}: BondFeedbackProps) => {
  const { network } = useApi();
  const { activeAccount } = useConnect();
  const { staking } = useStaking();
  const { getTransferOptions } = useTransferOptions();
  const { isDepositor } = useActivePools();
  const { stats } = usePoolsConfig();
  const { minJoinBond, minCreateBond } = stats;
  const { units, unit } = network;
  const { minNominatorBond } = staking;
  const { t } = useTranslation('library');
  const allTransferOptions = getTransferOptions(activeAccount);

  const defaultBondStr = defaultBond ? String(defaultBond) : '';

  // get bond options for either staking or pooling.
  const { freeBalance: freeBalanceBn } = allTransferOptions;

  // if we are bonding, subtract tx fees from bond amount
  const freeBondAmount = !disableTxFeeUpdate
    ? BigNumber.max(freeBalanceBn.minus(txFees), new BigNumber(0))
    : freeBalanceBn;

  // the default bond balance
  const freeBalance = planckToUnit(freeBondAmount, units);

  // store errors
  const [errors, setErrors] = useState<Array<string>>([]);

  // local bond state
  const [bond, setBond] = useState<{ bond: string }>({
    bond: defaultBondStr,
  });

  // current bond value BigNumber
  const bondBn = unitToPlanck(bond.bond, units);

  // whether bond is disabled
  const [bondDisabled, setBondDisabled] = useState(false);

  // bond minus tx fees if too much
  const enoughToCoverTxFees: boolean = freeBondAmount
    .minus(bondBn)
    .isGreaterThan(txFees);

  const bondAfterTxFees = enoughToCoverTxFees
    ? bondBn
    : BigNumber.max(bondBn.minus(txFees), new BigNumber(0));

  // update bond on account change
  useEffect(() => {
    setBond({
      bond: defaultBondStr,
    });
  }, [activeAccount]);

  // handle errors on input change
  useEffect(() => {
    handleErrors();
  }, [bond, txFees]);

  // update max bond after txFee sync
  useEffect(() => {
    if (!disableTxFeeUpdate) {
      if (bondBn.isGreaterThan(freeBondAmount)) {
        setBond({ bond: String(freeBalance) });
      }
    }
  }, [txFees]);

  // add this component's setBond to setters
  setters.push({
    set: setBond,
    current: bond,
  });

  // bond amount to minimum threshold
  const minBondBn =
    bondFor === 'pool'
      ? inSetup || isDepositor()
        ? minCreateBond
        : minJoinBond
      : minNominatorBond;
  const minBondUnit = planckToUnit(minBondBn, units);

  // handle error updates
  const handleErrors = () => {
    let disabled = false;
    const newErrors = warnings;
    const decimals = bond.bond.toString().split('.')[1]?.length ?? 0;

    // bond errors
    if (freeBondAmount.isEqualTo(new BigNumber(0))) {
      disabled = true;
      newErrors.push(`${t('noFree', { unit })}`);
    }

    // bond amount must not surpass freeBalalance
    if (bondBn.isGreaterThan(freeBondAmount)) {
      newErrors.push(t('moreThanBalance'));
    }

    // bond amount must not be smaller than 1 planck
    if (bond.bond !== '' && bondBn.isLessThan(new BigNumber(1))) {
      newErrors.push(t('tooSmall'));
    }

    // check bond after transaction fees is still valid
    if (bond.bond !== '' && bondAfterTxFees.isLessThan(new BigNumber(0))) {
      newErrors.push(`${t('notEnoughAfter', { unit })}`);
    }

    // cbond amount must not surpass network supported units
    if (decimals > units) {
      newErrors.push(`${t('bondDecimalsError', { units })}`);
    }

    if (inSetup) {
      if (freeBondAmount.isLessThan(minBondBn)) {
        disabled = true;
        newErrors.push(`${t('notMeet')} ${minBondUnit} ${unit}.`);
      }
      // bond amount must be more than minimum required bond
      if (bond.bond !== '' && bondBn.isLessThan(minBondBn)) {
        newErrors.push(`${t('atLeast')} ${minBondUnit} ${unit}.`);
      }
    }

    const bondValid = !newErrors.length && bond.bond !== '';
    setBondDisabled(disabled);
    listenIsValid(bondValid);
    setErrors(newErrors);
  };

  return (
    <>
      {errors.map((err: string, i: number) => (
        <Warning key={`setup_error_${i}`} text={err} />
      ))}
      <Spacer />
      <div
        style={{
          width: '100%',
          maxWidth: maxWidth ? '500px' : '100%',
        }}
      >
        <BondInput
          value={String(bond.bond)}
          defaultValue={defaultBondStr}
          syncing={syncing}
          disabled={bondDisabled}
          setters={setters}
          freeBalance={freeBalance}
          disableTxFeeUpdate={disableTxFeeUpdate}
        />
      </div>
    </>
  );
};
