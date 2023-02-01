// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';
import {
  ActivePool,
  ActivePoolsContextState,
  BondedPool,
  PoolAddresses,
} from 'contexts/Pools/types';
import { useStaking } from 'contexts/Staking';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnyApi, Sync } from 'types';
import { localStorageOrDefault, rmCommas, setStateWithRef } from 'Utils';
import { useApi } from '../../Api';
import { useConnect } from '../../Connect';
import { useBondedPools } from '../BondedPools';
import { usePoolMembers } from '../PoolMembers';
import { usePoolMemberships } from '../PoolMemberships';
import { usePoolsConfig } from '../PoolsConfig';
import * as defaults from './defaults';

export const ActivePoolsContext = React.createContext<ActivePoolsContextState>(
  defaults.defaultActivePoolContext
);

export const useActivePools = () => React.useContext(ActivePoolsContext);

export const ActivePoolsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { api, network, isReady, consts } = useApi();
  const { eraStakers } = useStaking();
  const { activeAccount } = useConnect();
  const { createAccounts } = usePoolsConfig();
  const { membership } = usePoolMemberships();
  const { getAccountPools, bondedPools } = useBondedPools();
  const { getPoolMember } = usePoolMembers();

  // determine active pools to subscribe to.
  const accountPools = useMemo(() => {
    const _accountPools = Object.keys(getAccountPools(activeAccount));
    const p = membership?.poolId ? String(membership.poolId) : '-1';

    if (membership?.poolId && !_accountPools.includes(p || '-1')) {
      _accountPools.push(String(membership.poolId));
    }
    return _accountPools;
  }, [activeAccount, bondedPools, membership]);

  // stores member's active pools
  const [activePools, setActivePools] = useState<Array<ActivePool>>([]);
  const activePoolsRef = useRef(activePools);

  // store active pools unsubs
  const [unsubActivePools, setUnsubActivePools] = useState<Array<AnyApi>>([]);
  const unsubActivePoolsRef = useRef(unsubActivePools);

  // store active pools nominations.
  const [poolNominations, setPoolNominations] = useState<{
    [key: number]: any;
  }>({});
  const poolNominationsRef = useRef(poolNominations);

  // store pool nominations unsubs
  const [unsubNominations, setUnsubNominations] = useState<Array<AnyApi>>([]);
  const unsubNominationsRef = useRef(unsubNominations);

  // store account target validators
  const [targets, _setTargets] = useState<{
    [key: number]: any;
  }>({});
  const targetsRef = useRef(targets);

  // store whether active pool data has been synced.
  // this will be true if no active pool exists for the active account.
  // We just need confirmation this is the case.
  const [synced, setSynced] = useState<Sync>('unsynced');
  const syncedRef = useRef(synced);

  // store the currently selected active pool for the UI.
  // Should default to the membership pool (if present).
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  // re-sync when number of accountRoles change.
  // this can happen when bondedPools sync, when roles
  // are edited within the dashboard, or when pool
  // membership changes.
  useEffect(() => {
    unsubscribeActivePools();
    unsubscribePoolNominations();

    setStateWithRef('unsynced', setSynced, syncedRef);
  }, [activeAccount, accountPools.length]);

  // subscribe to pool that the active account is a member of.
  useEffect(() => {
    if (isReady && syncedRef.current === 'unsynced') {
      setStateWithRef('syncing', setSynced, syncedRef);
      handlePoolSubscriptions();
    }
  }, [network, isReady, syncedRef.current]);

  const getActivePoolMembership = () => {
    // get the activePool that the active account
    return (
      activePoolsRef.current.find((a: ActivePool) => {
        const p = membership?.poolId ? String(membership.poolId) : '0';
        return String(a.id) === p;
      }) || null
    );
  };

  const getSelectedActivePool = () => {
    return (
      activePoolsRef.current.find(
        (a: ActivePool) => a.id === Number(selectedPoolId)
      ) || null
    );
  };

  const getSelectedPoolNominations = () => {
    return (
      poolNominationsRef.current[Number(selectedPoolId) ?? -1] ||
      defaults.poolNominations
    );
  };

  const getSelectedPoolTargets = () => {
    return targetsRef.current[Number(selectedPoolId) ?? -1] || defaults.targets;
  };

  // unsubscribe all on component unmount
  useEffect(() => {
    return () => {
      unsubscribeActivePools();
      unsubscribePoolNominations();
    };
  }, [network]);

  // re-calculate unclaimed payout when membership changes
  useEffect(() => {
    const acitvePoolMembership = getActivePoolMembership();

    if (acitvePoolMembership && membership && isReady) {
      const unclaimedRewards = calculatePayout(
        acitvePoolMembership.bondedPool ?? defaults.bondedPool,
        acitvePoolMembership.rewardPool ?? defaults.rewardPool,
        acitvePoolMembership.rewardAccountBalance ?? new BigNumber(0)
      );
      updateUnclaimedRewards(unclaimedRewards, acitvePoolMembership?.id || 0);
    }
  }, [
    network,
    isReady,
    getActivePoolMembership()?.bondedPool,
    getActivePoolMembership()?.rewardPool,
    membership,
  ]);

  // when we are subscribed to all active pools, syncing is considered
  // completed.
  useEffect(() => {
    if (unsubNominationsRef.current.length === accountPools.length) {
      setStateWithRef('synced', setSynced, syncedRef);
    }
  }, [unsubNominationsRef.current]);

  // handle active pool subscriptions
  const handlePoolSubscriptions = async () => {
    if (accountPools.length) {
      Promise.all(accountPools.map((p) => subscribeToActivePool(Number(p))));
    } else {
      setStateWithRef('synced', setSynced, syncedRef);
    }

    // assign default pool immediately if active pool not currently selected
    const defaultSelected = membership?.poolId || accountPools[0] || null;
    const activePoolSelected =
      activePoolsRef.current.find(
        (a: ActivePool) => String(a.id) === String(selectedPoolId)
      ) || null;

    if (defaultSelected && !activePoolSelected) {
      setSelectedPoolId(String(defaultSelected));
    }
  };

  // unsubscribe and reset poolNominations
  const unsubscribePoolNominations = () => {
    if (unsubNominationsRef.current.length) {
      for (const unsub of unsubNominationsRef.current) {
        unsub();
      }
    }
    setStateWithRef({}, setPoolNominations, poolNominationsRef);
    setStateWithRef([], setUnsubNominations, unsubNominationsRef);
  };

  // unsubscribe and reset activePool and poolNominations
  const unsubscribeActivePools = () => {
    if (unsubActivePoolsRef.current.length) {
      for (const unsub of unsubActivePoolsRef.current) {
        unsub();
      }
      setStateWithRef([], setActivePools, activePoolsRef);
      setStateWithRef([], setUnsubActivePools, unsubActivePoolsRef);
    }
  };

  const subscribeToActivePool = async (poolId: number) => {
    if (!api) {
      return;
    }

    const addresses: PoolAddresses = createAccounts(poolId);

    // new active pool subscription
    const subscribeActivePool = async (_poolId: number) => {
      const unsub: () => void = await api.queryMulti<[AnyApi, AnyApi, AnyApi]>(
        [
          [api.query.nominationPools.bondedPools, _poolId],
          [api.query.nominationPools.rewardPools, _poolId],
          [api.query.system.account, addresses.reward],
        ],
        async ([bondedPool, rewardPool, accountData]): Promise<void> => {
          const balance = accountData.data;
          bondedPool = bondedPool?.unwrapOr(undefined)?.toHuman();
          rewardPool = rewardPool?.unwrapOr(undefined)?.toHuman();
          if (rewardPool && bondedPool) {
            const rewardAccountBalance = balance?.free;
            const unclaimedRewards = calculatePayout(
              bondedPool,
              rewardPool,
              rewardAccountBalance
            );

            const pool = {
              id: _poolId,
              addresses,
              bondedPool,
              rewardPool,
              rewardAccountBalance,
              unclaimedRewards,
            };

            // remove pool if it already exists
            const _activePools = activePoolsRef.current.filter(
              (a: ActivePool) => a.id !== pool.id
            );
            // set active pool state
            setStateWithRef(
              [..._activePools, pool],
              setActivePools,
              activePoolsRef
            );

            // get pool target nominations and set in state
            const _targets = localStorageOrDefault(
              `${addresses.stash}_pool_targets`,
              defaults.targets,
              true
            );

            // add or replace current pool targets in targetsRef
            const _poolTargets = { ...targetsRef.current };
            _poolTargets[poolId] = _targets;

            // set pool staking targets
            setStateWithRef(_poolTargets, _setTargets, targetsRef);

            // subscribe to pool nominations
            subscribeToPoolNominations(poolId, addresses.stash);
          } else {
            // set default targets for pool
            const _poolTargets = { ...targetsRef.current };
            _poolTargets[poolId] = defaults.targets;
            setStateWithRef(_poolTargets, _setTargets, targetsRef);
          }
        }
      );
      return unsub;
    };

    // initiate subscription, add to unsubs.
    await Promise.all([subscribeActivePool(poolId)]).then((unsubs: any) => {
      setStateWithRef(
        [...unsubActivePoolsRef.current, ...unsubs],
        setUnsubActivePools,
        unsubActivePoolsRef
      );
    });
  };

  const subscribeToPoolNominations = async (
    poolId: number,
    poolBondAddress: string
  ) => {
    if (!api) return;
    const subscribePoolNominations = async (_poolBondAddress: string) => {
      const unsub = await api.query.staking.nominators(
        _poolBondAddress,
        (nominations: AnyApi) => {
          // set pool nominations
          let _nominations = nominations.unwrapOr(null);
          if (_nominations === null) {
            _nominations = defaults.poolNominations;
          } else {
            _nominations = {
              targets: _nominations.targets.toHuman(),
              submittedIn: _nominations.submittedIn.toHuman(),
            };
          }

          // add or replace current pool nominations in poolNominations
          const _poolNominations = { ...poolNominationsRef.current };
          _poolNominations[poolId] = _nominations;

          // set pool nominations state
          setStateWithRef(
            _poolNominations,
            setPoolNominations,
            poolNominationsRef
          );
        }
      );
      return unsub;
    };

    // initiate subscription, add to unsubs.
    await Promise.all([subscribePoolNominations(poolBondAddress)]).then(
      (unsubs: any) => {
        setStateWithRef(
          [...unsubNominationsRef.current, ...unsubs],
          setUnsubNominations,
          unsubNominationsRef
        );
      }
    );
  };

  // Utility functions
  /*
   * updateUnclaimedRewards
   * A helper function to set the unclaimed rewards of an active pool.
   */
  const updateUnclaimedRewards = (amount: BigNumber, poolId: number) => {
    if (!poolId) return;

    // update the active pool the account is a member of
    const _activePools = [...activePoolsRef.current].map((a: ActivePool) => {
      if (a.id === poolId) {
        return {
          ...a,
          unclaimedRewards: amount,
        };
      }
      return a;
    });
    setStateWithRef(_activePools, setActivePools, activePoolsRef);
  };

  /*
   * setTargets
   * Sets currently selected pool's target validators in storage.
   */
  const setTargets = (_targets: any) => {
    if (!selectedPoolId) {
      return;
    }

    const stashAddress = getPoolBondedAccount();
    if (stashAddress) {
      localStorage.setItem(
        `${stashAddress}_pool_targets`,
        JSON.stringify(_targets)
      );
      // inject targets into targets object
      const _poolTargets = { ...targetsRef.current };
      _poolTargets[Number(selectedPoolId)] = _targets;

      setStateWithRef(_poolTargets, _setTargets, targetsRef);
    }
  };

  /*
   * isBonding
   * Returns whether active pool exists
   */
  const isBonding = () => {
    return !!getSelectedActivePool();
  };

  /*
   * isNominator
   * Returns whether the active account is
   * the nominator in the active pool.
   */
  const isNominator = () => {
    const roles = getSelectedActivePool()?.bondedPool?.roles;
    if (!activeAccount || !roles) {
      return false;
    }
    const result = activeAccount === roles?.nominator;
    return result;
  };

  /*
   * isOwner
   * Returns whether the active account is
   * the owner of the active pool.
   */
  const isOwner = () => {
    const roles = getSelectedActivePool()?.bondedPool?.roles;
    if (!activeAccount || !roles) {
      return false;
    }
    const result = activeAccount === roles?.root;
    return result;
  };

  /*
   * isMember
   * Returns whether the active account is
   * a member of the active pool.
   */
  const isMember = () => {
    const selectedPool = getSelectedActivePool();
    const p = selectedPool ? String(selectedPool.id) : '-1';
    return getPoolMember(activeAccount)?.poolId === p;
  };

  /*
   * isDepositor
   * Returns whether the active account is
   * the depositor of the active pool.
   */
  const isDepositor = () => {
    const roles = getSelectedActivePool()?.bondedPool?.roles;
    if (!activeAccount || !roles) {
      return false;
    }
    const result = activeAccount === roles?.depositor;
    return result;
  };

  /*
   * isStateToggler
   * Returns whether the active account is
   * the depositor of the active pool.
   */
  const isStateToggler = () => {
    const roles = getSelectedActivePool()?.bondedPool?.roles;
    if (!activeAccount || !roles) {
      return false;
    }
    const result = activeAccount === roles?.stateToggler;
    return result;
  };

  /*
   * getPoolBondedAccount
   * get the stash address of the bonded pool
   * that the member is participating in.
   */
  const getPoolBondedAccount = () => {
    return getSelectedActivePool()?.addresses?.stash || null;
  };

  /*
   * Get the status of nominations.
   * Possible statuses: waiting, inactive, active.
   */
  const getNominationsStatus = () => {
    const nominations = getSelectedPoolNominations().nominations?.targets || [];
    const statuses: { [key: string]: string } = {};

    for (const nomination of nominations) {
      const s = eraStakers.stakers.find((_n: any) => _n.address === nomination);

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

  /*
   * getPoolRoles
   * Returns the active pool's roles or a default roles object.
   */
  const getPoolRoles = () => {
    const roles = getSelectedActivePool()?.bondedPool?.roles ?? null;
    if (!roles) {
      return defaults.poolRoles;
    }
    return roles;
  };

  const getPoolUnlocking = () => {
    const membershipPoolId = membership?.poolId
      ? String(membership.poolId)
      : '-1';

    // exit early if the currently selected pool is not membership pool
    if (selectedPoolId !== membershipPoolId) {
      return [];
    }
    return membership?.unlocking || [];
  };

  const calculatePayout = (
    bondedPool: BondedPool,
    rewardPool: any,
    rewardAccountBalance: BigNumber
  ): BigNumber => {
    const membershipPoolId = membership?.poolId
      ? String(membership.poolId)
      : '-1';

    // exit early if the currently selected pool is not membership pool
    if (selectedPoolId !== membershipPoolId || !membership) {
      return new BigNumber(0);
    }

    const rewardCounterUnit = new BigNumber(10).exponentiatedBy(
      new BigNumber(18)
    );

    // convert needed values into BigNumbers
    const totalRewardsClaimed = new BigNumber(
      rmCommas(rewardPool.totalRewardsClaimed)
    );
    const lastRecordedTotalPayouts = new BigNumber(
      rmCommas(rewardPool.lastRecordedTotalPayouts)
    );
    const memberLastRecordedRewardCounter = new BigNumber(
      rmCommas(membership.lastRecordedRewardCounter)
    );
    const poolLastRecordedRewardCounter = new BigNumber(
      rmCommas(rewardPool.lastRecordedRewardCounter)
    );
    const bondedPoolPoints = new BigNumber(rmCommas(bondedPool.points));
    const memberPoints = new BigNumber(rmCommas(membership.points));

    // calculate the latest reward account balance minus the existential deposit
    const rewardPoolBalance = BigNumber.max(
      new BigNumber(0),
      new BigNumber(rewardAccountBalance).minus(consts.existentialDeposit)
    );

    // calculate the current reward counter
    const payoutsSinceLastRecord = rewardPoolBalance
      .plus(totalRewardsClaimed)
      .minus(lastRecordedTotalPayouts);

    const currentRewardCounter = (
      bondedPoolPoints.isEqualTo(new BigNumber(0))
        ? new BigNumber(0)
        : payoutsSinceLastRecord
            .multipliedBy(rewardCounterUnit)
            .dividedBy(bondedPoolPoints)
    ).plus(poolLastRecordedRewardCounter);

    const pendingRewards = currentRewardCounter
      .minus(memberLastRecordedRewardCounter)
      .multipliedBy(memberPoints)
      .dividedBy(rewardCounterUnit);

    return pendingRewards;
  };

  return (
    <ActivePoolsContext.Provider
      value={{
        isNominator,
        isOwner,
        isMember,
        isDepositor,
        isStateToggler,
        isBonding,
        getPoolBondedAccount,
        getPoolUnlocking,
        getPoolRoles,
        setTargets,
        getNominationsStatus,
        setSelectedPoolId,
        synced: syncedRef.current,
        selectedActivePool: getSelectedActivePool(),
        targets: getSelectedPoolTargets(),
        poolNominations: getSelectedPoolNominations(),
      }}
    >
      {children}
    </ActivePoolsContext.Provider>
  );
};
