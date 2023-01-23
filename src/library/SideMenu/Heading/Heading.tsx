// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { HeadingProps } from '../types';
import { Wrapper } from './Wrapper';

export const Heading = (props: HeadingProps) => {
  const { title, minimised } = props;

  return (
    <Wrapper minimised={minimised}>
      {minimised ? <h5>&bull;</h5> : <h5>{title}</h5>}
    </Wrapper>
  );
};
