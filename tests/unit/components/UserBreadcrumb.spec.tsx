/** @jest-environment jsdom */

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';

type MockLinkProps = PropsWithChildren<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string }
>;

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: MockLinkProps) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { UserBreadcrumb } from '../../../components/dashboard/UserBreadcrumb';

describe('UserBreadcrumb', () => {
  it('marks the current page crumb for assistive technologies', () => {
    render(
      <UserBreadcrumb
        items={[
          { href: '/dashboard/profile', label: 'Profil', current: true },
        ]}
      />
    );

    expect(screen.getByText('Profil')).toHaveAttribute('aria-current', 'page');
  });
});