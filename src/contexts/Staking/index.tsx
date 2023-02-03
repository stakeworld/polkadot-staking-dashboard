// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';
import { ExternalAccount, ImportedAccount } from 'contexts/Connect/types';
import { PayeeConfig, PayeeOptions } from 'contexts/Setup/types';
import {
  EraStakers,
  NominationStatuses,
  StakingContextInterface,
  StakingMetrics,
  StakingTargets,
} from 'contexts/Staking/types';
import React, { useEffect, useRef, useState } from 'react';
import { AnyApi, MaybeAccount } from 'types';
import { greaterThanZero, localStorageOrDefault, setStateWithRef } from 'Utils';
// eslint-disable-next-line import/no-unresolved
import Worker from 'worker-loader!../../workers/stakers';
import { useApi } from '../Api';
import { useBalances } from '../Balances';
import { useConnect } from '../Connect';
import { useNetworkMetrics } from '../Network';
import * as defaults from './defaults';

export const StakingContext = React.createContext<StakingContextInterface>(
  defaults.defaultStakingContext
);

export const useStaking = () => React.useContext(StakingContext);

const worker = new Worker();

export const StakingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    activeAccount,
    accounts: connectAccounts,
    getActiveAccount,
  } = useConnect();
  const { isReady, api, consts, apiStatus, network } = useApi();
  const { activeEra } = useNetworkMetrics();
  const {
    accounts,
    getBondedAccount,
    getLedgerForStash,
    getAccountNominations,
  } = useBalances();
  const { maxNominatorRewardedPerValidator } = consts;

  // Store staking metrics in state.
  const [stakingMetrics, setStakingMetrics] = useState<StakingMetrics>(
    defaults.stakingMetrics
  );

  // Store unsub object fro staking metrics.
  const [unsub, setUnsub] = useState<{ (): void } | null>(null);
  const unsubRef = useRef(unsub);

  // Store eras stakers in state.
  const [eraStakers, setEraStakers] = useState<EraStakers>(defaults.eraStakers);
  const eraStakersRef = useRef(eraStakers);

  // Flags whether `eraStakers` is resyncing.
  const [erasStakersSyncing, setErasStakersSyncing] = useState(false);
  const erasStakersSyncingRef = useRef(erasStakersSyncing);

  // Store target validators for the active account.
  const [targets, _setTargets] = useState<StakingTargets>(
    localStorageOrDefault<StakingTargets>(
      `${activeAccount ?? ''}_targets`,
      defaults.targets,
      true
    ) as StakingTargets
  );

  useEffect(() => {
    if (apiStatus === 'connecting') {
      setStateWithRef(defaults.eraStakers, setEraStakers, eraStakersRef);
      setStakingMetrics(defaults.stakingMetrics);
    }
  }, [apiStatus]);

  // handle staking metrics subscription
  useEffect(() => {
    if (isReady) {
      unsubscribeMetrics();
      subscribeToStakingkMetrics();
    }
    return () => {
      unsubscribeMetrics();
    };
  }, [isReady, activeEra, activeAccount]);

  // Handle metrics unsubscribe.
  const unsubscribeMetrics = () => {
    if (unsubRef.current !== null) {
      unsubRef.current();
      setUnsub(null);
    }
  };

  // handle syncing with eraStakers
  useEffect(() => {
    if (isReady) {
      fetchEraStakers();
    }
  }, [isReady, activeEra.index, activeAccount]);

  useEffect(() => {
    if (activeAccount) {
      // set account's targets
      _setTargets(
        localStorageOrDefault(
          `${activeAccount}_targets`,
          defaults.targets,
          true
        ) as StakingTargets
      );
    }
  }, [isReady, accounts, activeAccount, eraStakersRef.current?.stakers]);

  worker.onmessage = (message: MessageEvent) => {
    if (message) {
      const { data } = message;
      const { task } = data;
      if (task !== 'initialise_exposures') {
        return;
      }
      const {
        stakers,
        totalStaked,
        totalActiveNominators,
        activeValidators,
        minActiveBond,
        activeAccountOwnStake,
        who,
      } = data;

      // finish sync
      setStateWithRef(false, setErasStakersSyncing, erasStakersSyncingRef);

      // check if account hasn't changed since worker started
      if (getActiveAccount() === who) {
        setStateWithRef(
          {
            ...eraStakersRef.current,
            stakers,
            totalStaked: new BigNumber(totalStaked),
            minActiveBond: new BigNumber(minActiveBond),
            // nominators,
            totalActiveNominators,
            activeValidators,
            activeAccountOwnStake,
          },
          setEraStakers,
          eraStakersRef
        );
      }
    }
  };

  const subscribeToStakingkMetrics = async () => {
    if (api !== null && isReady && activeEra.index !== 0) {
      const previousEra = activeEra.index - 1;

      const u = await api.queryMulti<AnyApi>(
        [
          api.query.staking.counterForNominators,
          api.query.staking.counterForValidators,
          api.query.staking.maxValidatorsCount,
          api.query.staking.validatorCount,
          [api.query.staking.erasValidatorReward, previousEra],
          [api.query.staking.erasTotalStake, previousEra],
          api.query.staking.minNominatorBond,
          [api.query.staking.payee, activeAccount],
        ],
        (q: AnyApi) => {
          setStakingMetrics({
            totalNominators: new BigNumber(q[0].toString()),
            totalValidators: new BigNumber(q[1].toString()),
            maxValidatorsCount: new BigNumber(q[2].toString()),
            validatorCount: new BigNumber(q[3].toString()),
            lastReward: new BigNumber(q[4].toString()),
            lastTotalStake: new BigNumber(q[5].toString()),
            minNominatorBond: new BigNumber(q[6].toString()),
            payee: processPayee(q[7]),
          });
        }
      );

      setUnsub(u);
    }
  };

  // process raw payee object from API. payee with `Account` type is returned as an key value pair,
  // with all others strings. This function handles both cases and formats into a unified structure.
  const processPayee = (rawPayee: AnyApi) => {
    const payeeHuman = rawPayee.toHuman();

    let payeeFinal: PayeeConfig;
    if (typeof payeeHuman === 'string') {
      const destination = payeeHuman as PayeeOptions;
      payeeFinal = {
        destination,
        account: null,
      };
    } else {
      const payeeEntry = Object.entries(payeeHuman);
      const destination = `${payeeEntry[0][0]}` as PayeeOptions;
      const account = `${payeeEntry[0][1]}` as MaybeAccount;
      payeeFinal = {
        destination,
        account,
      };
    }
    return payeeFinal;
  };

  /*
   * Fetches the active nominator set.
   * The top 256 nominators get rewarded. Nominators may have their bond  spread
   * among multiple nominees.
   * the minimum nominator bond is calculated by summing a particular bond of a nominator.
   */
  const fetchEraStakers = async () => {
    if (!isReady || activeEra.index === 0 || !api) {
      return;
    }
    const exposuresRaw = await api.query.staking.erasStakers.entries(
      activeEra.index
    );

    // flag eraStakers is recyncing
    setStateWithRef(true, setErasStakersSyncing, erasStakersSyncingRef);

    // humanise exposures to send to worker
    const exposures = exposuresRaw.map(([keys, val]: AnyApi) => {
      return {
        keys: keys.toHuman(),
        val: val.toHuman(),
      };
    });

    // worker to calculate stats
    worker.postMessage({
      task: 'initialise_exposures',
      activeAccount,
      units: network.units,
      exposures,
      maxNominatorRewardedPerValidator,
    });
  };

  /*
   * Get the status of nominations.
   * Possible statuses: waiting, inactive, active.
   */
  const getNominationsStatus = () => {
    if (inSetup()) {
      return defaults.nominationStatus;
    }
    if (!activeAccount) {
      return defaults.nominationStatus;
    }
    const nominations = getAccountNominations(activeAccount);
    const statuses: NominationStatuses = {};

    for (const nomination of nominations) {
      const s = eraStakersRef.current.stakers.find(
        (_n) => _n.address === nomination
      );

      if (s === undefined) {
        statuses[nomination] = 'waiting';
        continue;
      }
      const exists = (s.others ?? []).find(
        (_o: any) => _o.who === activeAccount
      );
      if (exists === undefined) {
        statuses[nomination] = 'inactive';
        continue;
      }
      statuses[nomination] = 'active';
    }

    return statuses;
  };

  /* Sets an account's stored target validators */
  const setTargets = (_targets: StakingTargets) => {
    localStorage.setItem(`${activeAccount}_targets`, JSON.stringify(_targets));
    _setTargets(_targets);
    return [];
  };

  /*
   * Helper function to determine whether the active account
   * has set a controller account.
   */
  const hasController = () => {
    if (!activeAccount) {
      return false;
    }
    return getBondedAccount(activeAccount) !== null;
  };

  /*
   * Gets the nomination statuses of passed in nominations
   */
  const getNominationsStatusFromTargets = (
    who: MaybeAccount,
    _targets: Array<any>
  ) => {
    const statuses: { [key: string]: string } = {};

    if (!_targets.length) {
      return statuses;
    }

    for (const target of _targets) {
      const s = eraStakersRef.current.stakers.find(
        (_n: any) => _n.address === target
      );

      if (s === undefined) {
        statuses[target] = 'waiting';
        continue;
      }
      const exists = (s.others ?? []).find((_o: any) => _o.who === who);
      if (exists === undefined) {
        statuses[target] = 'inactive';
        continue;
      }
      statuses[target] = 'active';
    }
    return statuses;
  };

  /*
   * Helper function to determine whether the controller account
   * has been imported.
   */
  const getControllerNotImported = (address: MaybeAccount) => {
    if (address === null || !activeAccount) {
      return false;
    }
    // check if controller is imported
    const exists = connectAccounts.find(
      (acc: ImportedAccount) => acc.address === address
    );
    if (exists === undefined) {
      return true;
    }

    if (Object.prototype.hasOwnProperty.call(exists, 'addedBy')) {
      const externalAccount = exists as ExternalAccount;
      if (externalAccount.addedBy === 'user') {
        return false;
      }
    }

    return !Object.prototype.hasOwnProperty.call(exists, 'signer');
  };

  /*
   * Helper function to determine whether the active account
   * is bonding, or is yet to start.
   */
  const isBonding = () => {
    if (!hasController() || !activeAccount) {
      return false;
    }
    return greaterThanZero(getLedgerForStash(activeAccount).active);
  };

  /*
   * Helper function to determine whether the active account
   * has funds unlocking.
   */
  const isUnlocking = () => {
    if (!hasController() || !activeAccount) {
      return false;
    }
    const ledger = getLedgerForStash(activeAccount);
    return ledger.unlocking.length;
  };

  /*
   * Helper function to determine whether the active account
   * is nominating, or is yet to start.
   */
  const isNominating = () => {
    if (!activeAccount) {
      return false;
    }
    const nominations = getAccountNominations(activeAccount);
    return nominations.length > 0;
  };

  /*
   * Helper function to determine whether the active account
   * is nominating, or is yet to start.
   */
  const inSetup = () => {
    return (
      !activeAccount ||
      (!hasController() && !isBonding() && !isNominating() && !isUnlocking())
    );
  };

  return (
    <StakingContext.Provider
      value={{
        getNominationsStatus,
        getNominationsStatusFromTargets,
        setTargets,
        hasController,
        getControllerNotImported,
        isBonding,
        isNominating,
        inSetup,
        staking: stakingMetrics,
        eraStakers: eraStakersRef.current,
        erasStakersSyncing: erasStakersSyncingRef.current,
        targets,
      }}
    >
      {children}
    </StakingContext.Provider>
  );
};
