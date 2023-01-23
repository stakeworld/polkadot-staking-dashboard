// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useHelp } from 'contexts/Help';
import { ReactComponent as IconSVG } from 'img/info-outline.svg';
import { OpenHelpIconProps } from './types';
import { Wrapper } from './Wrapper';

export const OpenHelpIcon = (props: OpenHelpIconProps) => {
  const { openHelpWith } = useHelp();

  const { helpKey } = props;

  const size = props.size ?? '1.3em';

  return (
    <Wrapper
      onClick={() => {
        openHelpWith(helpKey, {});
      }}
      className="help-icon"
      style={{ width: size, height: size }}
      light={props.light ?? false}
    >
      <IconSVG />
    </Wrapper>
  );
};
