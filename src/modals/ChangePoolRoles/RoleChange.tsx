// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faAnglesRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Identicon } from 'library/Identicon';
import { clipAddress, remToUnit } from 'Utils';
import { RoleChangeWrapper } from './Wrapper';

export const RoleChange = ({ roleName, oldAddress, newAddress }: any) => {
  return (
    <RoleChangeWrapper>
      <div className="label">{roleName}</div>
      <div className="role-change">
        <div className="input-wrap selected">
          <Identicon value={oldAddress ?? ''} size={remToUnit('2rem')} />
          <input
            className="input"
            disabled
            value={oldAddress ? clipAddress(oldAddress) : ''}
          />
        </div>
        <span>
          <FontAwesomeIcon icon={faAnglesRight} />
        </span>
        <div className="input-wrap selected">
          <Identicon value={newAddress ?? ''} size={remToUnit('2rem')} />
          <input
            className="input"
            disabled
            value={newAddress ? clipAddress(newAddress) : ''}
          />
        </div>
      </div>
    </RoleChangeWrapper>
  );
};
