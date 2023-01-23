// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCheckCircle, faClock } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ButtonSubmit } from '@rossbulat/polkadot-dashboard-ui';
import BigNumber from 'bignumber.js';
import { useApi } from 'contexts/Api';
import { useNetworkMetrics } from 'contexts/Network';
import { useErasToTimeLeft } from 'library/Hooks/useErasToTimeLeft';
import { fromNow, timeleftAsString } from 'library/Hooks/useTimeLeft/utils';
import { useUnstaking } from 'library/Hooks/useUnstaking';
import { StatsWrapper, StatWrapper } from 'library/Modal/Wrappers';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { planckToUnit } from 'Utils';
import { NotesWrapper, Separator } from '../Wrappers';
import { ChunkWrapper, ContentWrapper } from './Wrappers';

export const Overview = forwardRef(
  ({ unlocking, bondFor, setSection, setUnlock, setTask }: any, ref: any) => {
    const { network, consts } = useApi();
    const { activeEra } = useNetworkMetrics();
    const { bondDuration } = consts;
    const { units } = network;
    const { isFastUnstaking } = useUnstaking();
    const { t } = useTranslation('modals');

    const { getTimeLeftFromEras } = useErasToTimeLeft();
    const durationSeconds = getTimeLeftFromEras(bondDuration);
    const durationFormatted = timeleftAsString(
      t,
      fromNow(durationSeconds),
      true
    );

    const isStaking = bondFor === 'nominator';

    let withdrawAvailable = new BigNumber(0);
    let totalUnbonding = new BigNumber(0);
    for (const _chunk of unlocking) {
      const { era, value } = _chunk;
      const left = era - activeEra.index;

      totalUnbonding = totalUnbonding.plus(value);
      if (left <= 0) {
        withdrawAvailable = withdrawAvailable.plus(value);
      }
    }

    return (
      <ContentWrapper ref={ref}>
        <StatsWrapper>
          <StatWrapper>
            <div className="inner">
              <h4>
                <FontAwesomeIcon icon={faCheckCircle} className="icon" />{' '}
                {t('unlocked')}
              </h4>
              <h2>
                {planckToUnit(withdrawAvailable, units)
                  .decimalPlaces(3)
                  .toFormat()}{' '}
                {network.unit}
              </h2>
            </div>
          </StatWrapper>
          <StatWrapper>
            <div className="inner">
              <h4>
                <FontAwesomeIcon icon={faClock} className="icon" />{' '}
                {t('unbonding')}
              </h4>
              <h2>
                {planckToUnit(totalUnbonding.minus(withdrawAvailable), units)
                  .decimalPlaces(3)
                  .toFormat()}{' '}
                {network.unit}
              </h2>
            </div>
          </StatWrapper>
          <StatWrapper>
            <div className="inner">
              <h4>{t('total')}</h4>
              <h2>
                {planckToUnit(totalUnbonding, units)
                  .decimalPlaces(3)
                  .toFormat()}{' '}
                {network.unit}
              </h2>
            </div>
          </StatWrapper>
        </StatsWrapper>

        {withdrawAvailable.toNumber() > 0 && (
          <div style={{ margin: '1rem 0 0.5rem 0' }}>
            <ButtonSubmit
              disabled={isFastUnstaking}
              text={t('withdrawUnlocked')}
              onClick={() => {
                setTask('withdraw');
                setUnlock({
                  era: 0,
                  value: withdrawAvailable,
                });
                setSection(1);
              }}
            />
          </div>
        )}

        {unlocking.map((chunk: any, i: number) => {
          const { era, value } = chunk;
          const left = era - activeEra.index;

          return (
            <ChunkWrapper key={`unlock_chunk_${i}`}>
              <div>
                <section>
                  <h2>{`${planckToUnit(value, units)} ${network.unit}`}</h2>
                  <h4>
                    {left <= 0
                      ? t('unlocked')
                      : `${t('unlocksAfterEra')} ${era}`}
                  </h4>
                </section>
                {isStaking && (
                  <section>
                    <div>
                      <ButtonSubmit
                        text={t('rebond')}
                        disabled={isFastUnstaking}
                        onClick={() => {
                          setTask('rebond');
                          setUnlock(chunk);
                          setSection(1);
                        }}
                      />
                    </div>
                  </section>
                )}
              </div>
              {i === unlocking.length - 1 ? null : <Separator />}
            </ChunkWrapper>
          );
        })}
        <NotesWrapper>
          <p>
            {t('unlockTake', { durationFormatted })}
            {isStaking ? `${t('rebondUnlock')}` : null}
          </p>
          {!isStaking ? <p>{t('unlockChunk')}</p> : null}
        </NotesWrapper>
      </ContentWrapper>
    );
  }
);
