// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTheme } from 'contexts/Themes';
import ContentLoader from 'react-content-loader';
import { defaultThemes } from 'theme/default';
import { PageRowWrapper } from 'Wrappers';

export const Stake = () => {
  const { mode } = useTheme();

  return (
    <>
      <PageRowWrapper
        className="page-padding"
        noVerticalSpacer
        style={{ marginTop: '1rem', marginBottom: '1rem' }}
      >
        <ContentLoader
          height={80}
          width="100%"
          backgroundColor={defaultThemes.loader.background[mode]}
          foregroundColor={defaultThemes.loader.foreground[mode]}
          opacity={0.2}
          style={{ maxWidth: 275, marginRight: '1rem' }}
        >
          <rect
            x="0"
            y="0"
            rx="0.75rem"
            ry="0.75rem"
            width="100%"
            height="100%"
          />
        </ContentLoader>
        <ContentLoader
          height={80}
          width="100%"
          backgroundColor={defaultThemes.loader.background[mode]}
          foregroundColor={defaultThemes.loader.foreground[mode]}
          opacity={0.2}
          style={{ maxWidth: 275, marginRight: '1rem' }}
        >
          <rect
            x="0"
            y="0"
            rx="0.75rem"
            ry="0.75rem"
            width="100%"
            height="100%"
          />
        </ContentLoader>
        <ContentLoader
          height={80}
          width="100%"
          backgroundColor={defaultThemes.loader.background[mode]}
          foregroundColor={defaultThemes.loader.foreground[mode]}
          opacity={0.2}
          style={{ maxWidth: 275 }}
        >
          <rect
            x="0"
            y="0"
            rx="0.75rem"
            ry="0.75rem"
            width="100%"
            height="100%"
          />
        </ContentLoader>
      </PageRowWrapper>
      <PageRowWrapper
        className="page-padding"
        noVerticalSpacer
        style={{ marginBottom: '1rem' }}
      >
        <ContentLoader
          height={60}
          width="100%"
          backgroundColor={defaultThemes.loader.background[mode]}
          foregroundColor={defaultThemes.loader.foreground[mode]}
          opacity={0.2}
        >
          <rect
            x="0"
            y="0"
            rx="0.75rem"
            ry="0.75rem"
            width="100%"
            height="100%"
          />
        </ContentLoader>
      </PageRowWrapper>
      <PageRowWrapper
        className="page-padding"
        noVerticalSpacer
        style={{ marginBottom: '1rem' }}
      >
        <ContentLoader
          height={60}
          width="100%"
          backgroundColor={defaultThemes.loader.background[mode]}
          foregroundColor={defaultThemes.loader.foreground[mode]}
          opacity={0.2}
        >
          <rect
            x="0"
            y="0"
            rx="0.75rem"
            ry="0.75rem"
            width="100%"
            height="100%"
          />
        </ContentLoader>
      </PageRowWrapper>
      <PageRowWrapper className="page-padding" noVerticalSpacer>
        <ContentLoader
          height={60}
          width="100%"
          backgroundColor={defaultThemes.loader.background[mode]}
          foregroundColor={defaultThemes.loader.foreground[mode]}
          opacity={0.2}
        >
          <rect
            x="0"
            y="0"
            rx="0.75rem"
            ry="0.75rem"
            width="100%"
            height="100%"
          />
        </ContentLoader>
      </PageRowWrapper>
    </>
  );
};
