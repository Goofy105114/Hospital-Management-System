import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

describe('UI Component Library (shadcn/ui + Tailwind)', () => {
  it('renders Badge with default variant and content', () => {
    render(<Badge>Active Session</Badge>);
    const badge = screen.getByText('Active Session');
    expect(badge).toBeInTheDocument();
  });

  it('renders Badge with role-specific variants', () => {
    const { rerender } = render(<Badge variant="doctor">Doctor</Badge>);
    expect(screen.getByText('Doctor')).toBeInTheDocument();

    rerender(<Badge variant="patient">Patient</Badge>);
    expect(screen.getByText('Patient')).toBeInTheDocument();

    rerender(<Badge variant="staff">Staff</Badge>);
    expect(screen.getByText('Staff')).toBeInTheDocument();
  });

  it('renders Button with label and handles disabled state', () => {
    render(<Button disabled>Processing</Button>);
    const button = screen.getByRole('button', { name: /processing/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('renders Card with header, title, and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Cardiology Department</CardTitle>
        </CardHeader>
        <CardContent>Room 204 OPD Queue</CardContent>
      </Card>
    );

    expect(screen.getByText('Cardiology Department')).toBeInTheDocument();
    expect(screen.getByText('Room 204 OPD Queue')).toBeInTheDocument();
  });
});
