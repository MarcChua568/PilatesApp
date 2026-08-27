import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { RecurrenceEditor, type RecurrenceValue } from './RecurrenceEditor';

function Harness({ onValue }: { onValue: (v: RecurrenceValue) => void }) {
  const [value, setValue] = useState<RecurrenceValue>({
    daysOfWeek: [],
    startTime: '',
    startDate: '2026-09-01',
    endDate: '2026-12-01',
  });
  return (
    <RecurrenceEditor
      value={value}
      onChange={(v) => {
        setValue(v);
        onValue(v);
      }}
    />
  );
}

describe('RecurrenceEditor', () => {
  it('emits the API recurrence shape as weekdays and time are chosen', async () => {
    let last: RecurrenceValue | undefined;
    render(<Harness onValue={(v) => (last = v)} />);

    await userEvent.click(screen.getByRole('button', { name: 'Tue' }));
    await userEvent.click(screen.getByRole('button', { name: 'Thu' }));
    await userEvent.clear(screen.getByLabelText('Time'));
    await userEvent.type(screen.getByLabelText('Time'), '18:00');

    expect(last).toEqual({
      daysOfWeek: [2, 4],
      startTime: '18:00',
      startDate: '2026-09-01',
      endDate: '2026-12-01',
    });
  });

  it('shows a hint when no weekday is selected', () => {
    render(<Harness onValue={() => {}} />);
    expect(screen.getByText(/pick at least one weekday/i)).toBeInTheDocument();
  });
});
