// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';
import { MaxPayoutDays } from 'consts';
import { usePlugins } from 'contexts/Plugins';
import { useStaking } from 'contexts/Staking';
import { useSubscan } from 'contexts/Subscan';
import { useUi } from 'contexts/UI';
import { format, fromUnixTime } from 'date-fns';
import { PayoutBar } from 'library/Graphs/PayoutBar';
import { PayoutLine } from 'library/Graphs/PayoutLine';
import { formatSize } from 'library/Graphs/Utils';
import {
  CardHeaderWrapper,
  CardWrapper,
  GraphWrapper,
} from 'library/Graphs/Wrappers';
import { useSize } from 'library/Hooks/useSize';
import { OpenHelpIcon } from 'library/OpenHelpIcon';
import { PageTitle } from 'library/PageTitle';
import { StatBoxList } from 'library/StatBoxList';
import { StatusLabel } from 'library/StatusLabel';
import { SubscanButton } from 'library/SubscanButton';
import { locales } from 'locale';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnySubscan } from 'types';
import { PageRowWrapper } from 'Wrappers';
import { PageProps } from '../types';
import { PayoutList } from './PayoutList';
import { LastEraPayoutStat } from './Stats/LastEraPayout';

export const Payouts = (props: PageProps) => {
  const { payouts, poolClaims } = useSubscan();
  const { isSyncing } = useUi();
  const { plugins } = usePlugins();
  const { inSetup } = useStaking();
  const notStaking = !isSyncing && inSetup();
  const { i18n, t } = useTranslation();

  const [payoutsList, setPayoutLists] = useState<AnySubscan>();
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();

  const { page } = props;
  const { key } = page;

  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref.current);
  const { width, height, minHeight } = formatSize(size, 300);

  useEffect(() => {
    // take non-zero rewards in most-recent order
    let pList: AnySubscan = [
      ...payouts.concat(poolClaims).filter((p: AnySubscan) => p.amount > 0),
    ].slice(0, MaxPayoutDays);

    // re-order rewards based on block timestamp
    pList = pList.sort((a: AnySubscan, b: AnySubscan) => {
      const x = new BigNumber(a.block_timestamp);
      const y = new BigNumber(b.block_timestamp);
      return y.minus(x);
    });
    setPayoutLists(pList);
  }, [payouts]);

  useEffect(() => {
    // calculate the earliest and latest payout dates if they exist.
    if (payoutsList?.length) {
      setFromDate(
        format(
          fromUnixTime(
            payoutsList[Math.min(MaxPayoutDays - 2, payoutsList.length - 1)]
              .block_timestamp
          ),
          'do MMM',
          {
            locale: locales[i18n.resolvedLanguage],
          }
        )
      );

      // latest payout date
      setToDate(
        format(fromUnixTime(payoutsList[0].block_timestamp), 'do MMM', {
          locale: locales[i18n.resolvedLanguage],
        })
      );
    }
  }, [payoutsList?.length]);

  return (
    <>
      <PageTitle title={t(key, { ns: 'base' })} />
      <StatBoxList>
        <LastEraPayoutStat />
      </StatBoxList>
      <PageRowWrapper className="page-padding" noVerticalSpacer>
        <GraphWrapper>
          <SubscanButton />
          <CardHeaderWrapper padded>
            <h4>
              {t('payouts.payoutHistory', { ns: 'pages' })}
              <OpenHelpIcon helpKey="Payout History" />
            </h4>
            <h2>
              {payouts.length ? (
                <>
                  {fromDate}
                  {toDate !== fromDate && <>&nbsp;-&nbsp;{toDate}</>}
                </>
              ) : (
                t('payouts.none', { ns: 'pages' })
              )}
            </h2>
          </CardHeaderWrapper>
          <div className="inner" ref={ref} style={{ minHeight }}>
            {!plugins.includes('subscan') ? (
              <StatusLabel
                status="active_service"
                statusFor="subscan"
                title={t('payouts.subscanDisabled', { ns: 'pages' })}
                topOffset="30%"
              />
            ) : (
              <StatusLabel
                status="sync_or_setup"
                title={t('payouts.notStaking', { ns: 'pages' })}
                topOffset="30%"
              />
            )}

            <div
              className="graph"
              style={{
                height: `${height}px`,
                width: `${width}px`,
                position: 'absolute',
                opacity: notStaking ? 0.75 : 1,
                transition: 'opacity 0.5s',
              }}
            >
              <PayoutBar days={MaxPayoutDays} height="165px" />
              <PayoutLine days={MaxPayoutDays} average={10} height="65px" />
            </div>
          </div>
        </GraphWrapper>
      </PageRowWrapper>
      {!payoutsList?.length ? (
        <></>
      ) : (
        <PageRowWrapper className="page-padding" noVerticalSpacer>
          <CardWrapper>
            <PayoutList
              title={t('payouts.recentPayouts', { ns: 'pages' })}
              payouts={payoutsList}
              pagination
            />
          </CardWrapper>
        </PageRowWrapper>
      )}
    </>
  );
};
