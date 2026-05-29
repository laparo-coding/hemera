/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, jest } from '@/tests/vitest/jest-globals';
import type { ReactNode } from 'react';

vi.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
      ...props
    }: {
      children: ReactNode;
      href: string;
      [key: string]: unknown;
    }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

import DashboardSidebar from '@/components/DashboardSidebar';

describe('DashboardSidebar', () => {
  it('renders all expected routes with localized labels', () => {
    render(<DashboardSidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const myCoursesLink = screen.getByRole('link', { name: /meine kurse/i });
    expect(myCoursesLink).toHaveAttribute('href', '/my-courses');

    const profileLink = screen.getByRole('link', { name: /profil/i });
    expect(profileLink).toHaveAttribute('href', '/user-profile');
  });

  it('does not introduce english localization variants for sidebar routes', () => {
    render(<DashboardSidebar />);

    expect(screen.queryByRole('link', { name: /my courses/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument();
  });
});