/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// Mock the server action
const mockSaveAction = vi.fn().mockResolvedValue({ success: true });

// Mock date pickers — render a simplified version
vi.mock('@mui/x-date-pickers/StaticDatePicker', () => ({
  StaticDatePicker: (props: Record<string, unknown>) => (
    <div data-testid="static-date-picker">
      {props.value instanceof Date && (
        <span data-testid="date-value">{props.value.toISOString()}</span>
      )}
      <button
        type="button"
        data-testid="pick-date"
        onClick={() => {
          if (typeof props.onChange === 'function') {
            props.onChange(new Date(Date.UTC(2026, 2, 15)));
          }
        }}
      >
        Pick date
      </button>
    </div>
  ),
}));

vi.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: class {},
}));

import NegotiationResultForm from '@/components/participation/NegotiationResultForm';

describe('NegotiationResultForm', () => {
  const defaultProps = {
    bookingId: 'booking-1',
    saveAction: mockSaveAction,
  };

  beforeEach(() => {
    mockSaveAction.mockClear();
  });

  it('renders date picker, partner options and outcome textarea', () => {
    render(<NegotiationResultForm {...defaultProps} />);
    expect(screen.getByTestId('static-date-picker')).toBeInTheDocument();
    expect(screen.getByText('Mit meiner Führungskraft')).toBeInTheDocument();
    expect(screen.getByText('Mit der Führungskraft meiner Führungskraft')).toBeInTheDocument();
    expect(screen.getByText('Mit der Personalabteilung')).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /verhandlungsergebnis/i })
    ).toBeInTheDocument();
  });

  it('date picker is visible on initial render', () => {
    render(<NegotiationResultForm {...defaultProps} />);
    expect(screen.getByTestId('static-date-picker')).toBeVisible();
  });

  it('card selector shows 3 options', () => {
    render(<NegotiationResultForm {...defaultProps} />);
    const group = screen.getByRole('radiogroup');
    const radios = screen.getAllByRole('radio');
    expect(group).toBeInTheDocument();
    expect(radios).toHaveLength(3);
  });

  it('clicking a card selects it', () => {
    render(<NegotiationResultForm {...defaultProps} />);
    const card = screen.getByRole('radio', { name: /mit meiner führungskraft$/i });
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-checked', 'true');
  });

  it('textarea accepts input', () => {
    render(<NegotiationResultForm {...defaultProps} />);
    const textarea = screen.getByRole('textbox', { name: /verhandlungsergebnis/i });
    fireEvent.change(textarea, { target: { value: 'Gehaltserhöhung erhalten' } });
    expect(textarea).toHaveValue('Gehaltserhöhung erhalten');
  });

  it('submit calls save action with correct data', async () => {
    render(<NegotiationResultForm {...defaultProps} />);

    // Pick a date
    fireEvent.click(screen.getByTestId('pick-date'));

    // Select partner
    const card = screen.getByRole('radio', { name: /mit der personalabteilung/i });
    fireEvent.click(card);

    // Type outcome
    const textarea = screen.getByRole('textbox', { name: /verhandlungsergebnis/i });
    fireEvent.change(textarea, { target: { value: 'Erfolg' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /verhandlungsergebnis speichern/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSaveAction).toHaveBeenCalledWith({
        bookingId: 'booking-1',
        resultDate: '2026-03-15',
        resultNegotiationPartner: 'HR_DEPARTMENT',
        resultOutcome: 'Erfolg',
      });
    });
  });

  it('renders initial values when provided', () => {
    render(
      <NegotiationResultForm
        {...defaultProps}
        initialValues={{
          resultDate: new Date(Date.UTC(2026, 1, 20)),
          resultNegotiationPartner: 'HR_DEPARTMENT',
          resultOutcome: 'Bestehend',
        }}
      />
    );
    const hrCard = screen.getByRole('radio', { name: /mit der personalabteilung/i });
    expect(hrCard).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('textbox', { name: /verhandlungsergebnis/i })
    ).toHaveValue('Bestehend');
    // Assert initial date is rendered
    const dateValue = screen.getByTestId('date-value');
    expect(dateValue).toHaveTextContent('2026-02-20T00:00:00.000Z');
  });

  it('shows error message when save action fails', async () => {
    mockSaveAction.mockResolvedValueOnce({
      success: false,
      error: { code: 'INVALID_DATE', message: 'Ungültiges Datum' },
    });
    render(<NegotiationResultForm {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /verhandlungsergebnis speichern/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSaveAction).toHaveBeenCalled();
      expect(screen.getByText('Ungültiges Datum')).toBeInTheDocument();
    });
  });
});
