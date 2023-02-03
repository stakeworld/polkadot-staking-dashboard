// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';
import { Balance } from 'contexts/Balances/types';
import { ExternalAccount } from 'contexts/Connect/types';
import { ExtensionAccount } from 'contexts/Extensions/types';
import { BondFor } from 'types';

export interface ExtensionAccountItem extends ExtensionAccount {
  active?: boolean;
  alert?: string;
  balance?: Balance;
}
export interface ExternalAccountItem extends ExternalAccount {
  active?: boolean;
  alert?: string;
  balance?: Balance;
}
export type ImportedAccountItem = ExtensionAccountItem | ExternalAccountItem;

export type InputItem = ImportedAccountItem | null;

export interface DropdownInput {
  key: string;
  name: string;
}

export interface AccountDropdownProps {
  items: Array<InputItem>;
  onChange: (o: any) => void;
  placeholder: string;
  value: InputItem;
  current: InputItem;
  height: string | number | undefined;
}

export interface BondFeedbackProps {
  syncing?: boolean;
  setters: any;
  bondFor: BondFor;
  defaultBond: number | null;
  inSetup?: boolean;
  listenIsValid: { (v: boolean): void } | { (): void };
  parentErrors?: Array<string>;
  disableTxFeeUpdate?: boolean;
  setLocalResize?: () => void;
  txFees: BigNumber;
  maxWidth?: boolean;
}

export interface BondInputProps {
  freeBalance: BigNumber;
  value: string;
  defaultValue: string;
  syncing?: boolean;
  setters: any;
  disabled: boolean;
  disableTxFeeUpdate?: boolean;
}

export interface UnbondFeedbackProps {
  setters: any;
  bondFor: BondFor;
  defaultBond?: number;
  inSetup?: boolean;
  listenIsValid: { (v: boolean): void } | { (): void };
  parentErrors?: Array<string>;
  setLocalResize?: () => void;
  txFees: BigNumber;
}

export interface UnbondInputProps {
  active: BigNumber;
  unbondToMin: BigNumber;
  defaultValue: number | string;
  disabled: boolean;
  setters: any;
  value: any;
}

export interface NominateStatusBarProps {
  value: BigNumber;
}

export interface DropdownProps {
  items: Array<DropdownInput>;
  onChange: (o: any) => void;
  label?: string;
  placeholder: string;
  value: DropdownInput;
  current: DropdownInput;
  height: string;
}

export interface WarningProps {
  text: string;
}
