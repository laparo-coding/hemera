/** @jest-environment jsdom */

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
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

import { UserPageContainer } from '../../../components/dashboard/UserPageContainer';

describe('UserPageContainer', () => {
  it('renders title, subtitle, action area, and children', () => {
    render(
      <UserPageContainer
        title='Dein Profil'
        subtitle='Verwalte deine persönlichen Daten'
        actions={<button type='button'>Speichern</button>}
        breadcrumbs={[{ href: '/dashboard/profile', label: 'Profil', current: true }]}
      >
        <section>Profilinhalt</section>
      </UserPageContainer>
    );

    expect(screen.getByRole('heading', { name: 'Dein Profil' })).toBeVisible();
    expect(screen.getByText('Verwalte deine persönlichen Daten')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeVisible();
    expect(screen.getByText('Profilinhalt')).toBeVisible();
    const breadcrumb = screen.getByLabelText('Breadcrumb-Navigation');
    const dashboardLink = within(breadcrumb).getByRole('link', {
      name: 'Dashboard',
    });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(within(breadcrumb).getByText('Profil')).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});