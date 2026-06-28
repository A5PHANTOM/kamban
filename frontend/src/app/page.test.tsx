import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import KanbanBoard from './page';

describe('Kanban Board App', () => {
  test('renders board title and 5 default columns', () => {
    render(<KanbanBoard />);
    
    // Check main title
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('KanbanFlow');

    // Check columns
    const columns = screen.getAllByRole('region');
    expect(columns).toHaveLength(5);
  });

  test('allows renaming columns', () => {
    render(<KanbanBoard />);
    
    // Find the Backlog input
    const backlogInput = screen.getByLabelText('Rename Backlog column') as HTMLInputElement;
    expect(backlogInput.value).toBe('Backlog');

    // Change title
    fireEvent.change(backlogInput, { target: { value: 'New Backlog Title' } });
    expect(backlogInput.value).toBe('New Backlog Title');
  });

  test('allows adding a new card to a column', () => {
    render(<KanbanBoard />);
    
    // Find column region for Todo and click its add card button
    const todoColumn = screen.getAllByRole('region')[1];
    const addBtn = within(todoColumn).getByRole('button', { name: /\+ Add Card/i });
    fireEvent.click(addBtn);

    // Modal should appear
    expect(screen.getByText('Create New Card')).toBeInTheDocument();

    // Fill the inputs
    const titleInput = screen.getByLabelText('Card Title');
    const detailsInput = screen.getByLabelText('Details');
    const submitBtn = screen.getByRole('button', { name: 'Add Card' });

    fireEvent.change(titleInput, { target: { value: 'Verify Tests Run' } });
    fireEvent.change(detailsInput, { target: { value: 'Make sure all jest unit tests are passing.' } });
    fireEvent.click(submitBtn);

    // Modal should be closed and card should appear in the second column
    expect(screen.queryByText('Create New Card')).not.toBeInTheDocument();
    expect(within(todoColumn).getByText('Verify Tests Run')).toBeInTheDocument();
    expect(within(todoColumn).getByText('Make sure all jest unit tests are passing.')).toBeInTheDocument();
  });

  test('allows deleting an existing card', () => {
    render(<KanbanBoard />);
    
    // The Review column initially has "Self-Review Plan" card
    const reviewColumn = screen.getAllByRole('region')[3];
    expect(within(reviewColumn).getByText('Self-Review Plan')).toBeInTheDocument();

    // Find and click delete button on that card
    const deleteBtn = within(reviewColumn).getByRole('button', { name: 'Delete card Self-Review Plan' });
    fireEvent.click(deleteBtn);

    // The card should no longer be present
    expect(within(reviewColumn).queryByText('Self-Review Plan')).not.toBeInTheDocument();
  });

  test('supports card reordering within the same column', () => {
    render(<KanbanBoard />);
    
    const backlogColumn = screen.getAllByRole('region')[0];
    
    // Check initial order
    const cardsBefore = within(backlogColumn).getAllByRole('article');
    expect(cardsBefore[0]).toHaveTextContent('Design UI/UX Mockups');
    expect(cardsBefore[1]).toHaveTextContent('Set up project structure');

    // Drag second card over first card and drop
    fireEvent.dragStart(cardsBefore[1]);
    fireEvent.dragOver(cardsBefore[0]);
    fireEvent.drop(backlogColumn);

    // Verify swapped order
    const cardsAfter = within(backlogColumn).getAllByRole('article');
    expect(cardsAfter[0]).toHaveTextContent('Set up project structure');
    expect(cardsAfter[1]).toHaveTextContent('Design UI/UX Mockups');
  });
});
