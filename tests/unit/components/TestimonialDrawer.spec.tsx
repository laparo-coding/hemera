/** @jest-environment jsdom */
/**
 * TestimonialDrawer unit tests (T011 — TDD Red phase)
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock TestimonialForm
jest.mock('../../../components/testimonial/TestimonialForm', () => {
  return function MockTestimonialForm(props: Record<string, unknown>) {
    return (
      <div data-testid="testimonial-form">
        <span data-testid="form-booking-id">{String(props.bookingId)}</span>
        <span data-testid="form-course-name">{String(props.courseName)}</span>
      </div>
    );
  };
});

// Mock Clerk useUser
const mockUseUser = jest.fn().mockReturnValue({
  isSignedIn: true,
  isLoaded: true,
  user: { id: 'user-1' },
});
jest.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
}));

// Mock MUI useTheme
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    breakpoints: {
      up: (bp: string) => {
        const map: Record<string, string> = {
          xs: '0px',
          sm: '600px',
          md: '900px',
          lg: '1200px',
          xl: '1536px',
        };
        return `(min-width: ${map[bp] ?? '0px'})`;
      },
    },
  }),
}));

import TestimonialDrawer from '../../../components/dashboard/TestimonialDrawer';

type TestWindow = Window & {
  __clerk_publishable_key?: string;
};

const baseProps = {
  open: true,
  onClose: jest.fn(),
  bookingId: 'booking-123',
  courseName: 'Gehaltsverhandlung Kompakt',
  userProfile: {
    firstName: 'Anna',
    lastName: 'Müller',
    imageUrl: 'https://example.com/avatar.jpg',
    city: 'Berlin',
  },
};

describe('TestimonialDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem(
      'clerk-session',
      JSON.stringify({
        user: {
          id: 'user-1',
          firstName: 'Anna',
          lastName: 'Müller',
          role: 'user',
        },
      })
    );
    (window as TestWindow).__clerk_publishable_key = 'pk_test_123';
    mockUseUser.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: { id: 'user-1' },
    });
  });

  afterEach(() => {
    delete (window as TestWindow).__clerk_publishable_key;
  });

  it('renders drawer when open=true', () => {
    render(<TestimonialDrawer {...baseProps} />);
    expect(screen.getByText('Erfahrungsbericht')).toBeInTheDocument();
  });

  it('does not render content when open=false', () => {
    render(<TestimonialDrawer {...baseProps} open={false} />);
    expect(screen.queryByText('Erfahrungsbericht')).not.toBeInTheDocument();
  });

  it('shows TestimonialForm inside drawer', async () => {
    render(<TestimonialDrawer {...baseProps} />);
    expect(await screen.findByTestId('testimonial-form')).toBeInTheDocument();
  });

  it('passes bookingId and courseName to form', async () => {
    render(<TestimonialDrawer {...baseProps} />);
    await screen.findByTestId('testimonial-form');
    expect(screen.getByTestId('form-booking-id')).toHaveTextContent(
      'booking-123'
    );
    expect(screen.getByTestId('form-course-name')).toHaveTextContent(
      'Gehaltsverhandlung Kompakt'
    );
  });

  it('calls onClose on X button click', () => {
    render(<TestimonialDrawer {...baseProps} />);
    const closeButton = screen.getByLabelText('Schließen');
    fireEvent.click(closeButton);
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders drawer paper element when open', () => {
    render(<TestimonialDrawer {...baseProps} />);
    const drawer = screen.getByTestId('testimonial-drawer');
    expect(drawer).toBeInTheDocument();
  });

  it('shows error alert when user is not authenticated', () => {
    window.localStorage.removeItem('clerk-session');
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true, user: null });
    render(<TestimonialDrawer {...baseProps} />);
    expect(screen.getByText(/Du musst angemeldet sein/)).toBeInTheDocument();
    expect(screen.queryByTestId('testimonial-form')).not.toBeInTheDocument();
  });
});
