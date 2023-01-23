// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SelectWrapper } from 'library/ListItem/Wrappers';
import { useTheme } from 'styled-components';
import { defaultThemes } from 'theme/default';
import { useList } from '../../List/context';
import { SelectProps } from '../types';

export const Select = (props: SelectProps) => {
  const { item } = props;

  const { mode }: any = useTheme();
  const { addToSelected, removeFromSelected, selected } = useList();

  const isSelected = selected.includes(item);

  return (
    <SelectWrapper
      onClick={() => {
        if (isSelected) {
          removeFromSelected([item]);
        } else {
          addToSelected(item);
        }
      }}
    >
      {isSelected && (
        <FontAwesomeIcon
          icon={faCheck as IconProp}
          transform="shrink-2"
          color={defaultThemes.text.primary[mode]}
        />
      )}
    </SelectWrapper>
  );
};
