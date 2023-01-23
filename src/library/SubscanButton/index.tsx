// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useApi } from 'contexts/Api';
import { usePlugins } from 'contexts/Plugins';
import { useTheme } from 'contexts/Themes';
import styled from 'styled-components';
import { defaultThemes, networkColors } from 'theme/default';
import { WrapperProps } from './types';

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 0.9rem;
  border-radius: 0.3rem;
  padding: 0.25rem 0.4rem;
  color: ${(props) => props.color};
  opacity: ${(props) => props.opacity};
  z-index: 2;
`;

export const SubscanButton = () => {
  const { network } = useApi();
  const { mode } = useTheme();
  const { plugins } = usePlugins();

  return (
    <Wrapper
      color={
        plugins.includes('subscan')
          ? networkColors[`${network.name}-${mode}`]
          : defaultThemes.text.secondary[mode]
      }
      opacity={plugins.includes('subscan') ? 1 : 0.5}
    >
      <FontAwesomeIcon
        icon={faProjectDiagram}
        transform="shrink-2"
        style={{ marginRight: '0.3rem' }}
      />
      Subscan
    </Wrapper>
  );
};
