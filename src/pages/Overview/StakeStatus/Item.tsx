// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faChevronRight, faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ButtonInvertRounded } from '@rossbulat/polkadot-dashboard-ui';
import { useTheme } from 'contexts/Themes';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { defaultThemes } from 'theme/default';
import { applyWidthAsPadding } from 'Utils';
import { ItemProps } from './types';
import { StatusRowWrapper } from './Wrappers';

export const Item = ({ text, ctaText, onClick, leftIcon }: ItemProps) => {
  const { mode } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);

  const handleAdjustLayout = () => {
    applyWidthAsPadding(subjectRef, containerRef);
  };

  useLayoutEffect(() => {
    handleAdjustLayout();
  });

  useEffect(() => {
    window.addEventListener('resize', handleAdjustLayout);
    return () => {
      window.removeEventListener('resize', handleAdjustLayout);
    };
  }, []);

  return (
    <StatusRowWrapper leftIcon={leftIcon?.show}>
      <div>
        <div className="content">
          <div className="text" ref={containerRef}>
            {leftIcon ? (
              leftIcon.show ? (
                <FontAwesomeIcon
                  icon={faCircle}
                  transform="shrink-6"
                  className="bull"
                  style={{
                    opacity: leftIcon.status === 'off' ? 0.1 : 1,
                    color:
                      leftIcon.status === 'active'
                        ? defaultThemes.text.success[mode]
                        : leftIcon.status === 'inactive'
                        ? defaultThemes.text.warning[mode]
                        : 'inherit',
                  }}
                />
              ) : null
            ) : null}
            {text}
            <span className="cta" ref={subjectRef}>
              {ctaText ? (
                <ButtonInvertRounded
                  text={ctaText}
                  iconRight={faChevronRight}
                  iconTransform="shrink-4"
                  lg
                  onClick={() => {
                    if (typeof onClick === 'function') onClick();
                  }}
                />
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </StatusRowWrapper>
  );
};
