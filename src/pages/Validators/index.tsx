// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useApi } from 'contexts/Api';
import { useValidators } from 'contexts/Validators';
import { CardWrapper } from 'library/Graphs/Wrappers';
import { PageTitle } from 'library/PageTitle';
import { StatBoxList } from 'library/StatBoxList';
import { ValidatorList } from 'library/ValidatorList';
import { useTranslation } from 'react-i18next';
import { PageRowWrapper } from 'Wrappers';
import { PageProps } from '../types';
import { ActiveValidatorsStat } from './Stats/ActiveValidators';
import { AverageCommissionStat } from './Stats/AverageCommission';
import { TotalValidatorsStat } from './Stats/TotalValidators';

export const Validators = (props: PageProps) => {
  const { page } = props;
  const { key } = page;

  const { isReady } = useApi();
  const { validators } = useValidators();
  const { t } = useTranslation();
  const defaultFilters = {
    includes: ['active'],
    excludes: ['all_commission', 'blocked_nominations', 'missing_identity'],
  };

  return (
    <>
      <PageTitle title={t(key, { ns: 'base' })} />
      <StatBoxList>
        <ActiveValidatorsStat />
        <TotalValidatorsStat />
        <AverageCommissionStat />
      </StatBoxList>
      <PageRowWrapper className="page-padding" noVerticalSpacer>
        <CardWrapper>
          {!isReady ? (
            <div className="item">
              <h3>{t('validators.connecting', { ns: 'pages' })}...</h3>
            </div>
          ) : (
            <>
              {validators.length === 0 && (
                <div className="item">
                  <h3>
                    {t('validators.fetchingValidators', { ns: 'pages' })}...
                  </h3>
                </div>
              )}

              {validators.length > 0 && (
                <ValidatorList
                  bondFor="nominator"
                  validators={validators}
                  batchKey="validators_browse"
                  title={t('validators.networkValidators', { ns: 'pages' })}
                  selectable={false}
                  defaultFilters={defaultFilters}
                  allowMoreCols
                  allowFilters
                  allowSearch
                  pagination
                  toggleFavorites
                />
              )}
            </>
          )}
        </CardWrapper>
      </PageRowWrapper>
    </>
  );
};
