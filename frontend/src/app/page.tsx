'use client';

import React, { useState, useEffect } from 'react';

interface Card {
  id: string;
  title: string;
  details: string;
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

const INITIAL_COLUMNS: Column[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    cards: [
      { id: 'card-1', title: 'Design UI/UX Mockups', details: 'Create visual designs emphasizing high-end dark navy glassmorphic aesthetic.' },
      { id: 'card-2', title: 'Set up project structure', details: 'Scaffold next.js app, configure typescript and setup folder layout.' }
    ]
  },
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: 'card-3', title: 'Configure Security Headers', details: 'Implement strict CSP and anti-clickjacking guards.' },
      { id: 'card-4', title: 'Add Native Drag & Drop', details: 'Create simple HTML5 drag and drop event handlers without heavy dependencies.' }
    ]
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      { id: 'card-5', title: 'Design global styles', details: 'Add base variables, Outfit typography, and layout rules to globals.css.' }
    ]
  },
  {
    id: 'review',
    title: 'Review',
    cards: [
      { id: 'card-6', title: 'Self-Review Plan', details: 'Verify that requirements of AGENTS.md are fully satisfied.' }
    ]
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      { id: 'card-7', title: 'Read requirements', details: 'Deeply analyze business rules and constraints.' }
    ]
  }
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [draggedCard, setDraggedCard] = useState<{ cardId: string; sourceColumnId: string } | null>(null);
  const [activeDragColumnId, setActiveDragColumnId] = useState<string | null>(null);
  const [targetCardId, setTargetCardId] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalColumnId, setModalColumnId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDetails, setNewCardDetails] = useState('');

  // Handle column rename
  const handleRenameColumn = (columnId: string, newTitle: string) => {
    setColumns(prev =>
      prev.map(col => (col.id === columnId ? { ...col, title: newTitle } : col))
    );
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, cardId: string, sourceColumnId: string) => {
    setDraggedCard({ cardId, sourceColumnId });
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', cardId);
    }
    // Add transparent/dragging class on next tick so item remains visible during drag start
    setTimeout(() => {
      const element = document.getElementById(cardId);
      if (element) {
        element.classList.add('dragging');
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(null);
    setActiveDragColumnId(null);
    setTargetCardId(null);
    const element = document.getElementById(cardId);
    if (element) {
      element.classList.remove('dragging');
    }
  };

  const handleDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (activeDragColumnId !== targetColumnId) {
      setActiveDragColumnId(targetColumnId);
    }
  };

  const handleCardDragOver = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTargetCardId(cardId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setActiveDragColumnId(null);
    
    if (!draggedCard) return;
    
    const { cardId, sourceColumnId } = draggedCard;

    setColumns(prev => {
      // Find card
      const sourceCol = prev.find(col => col.id === sourceColumnId);
      const cardToMove = sourceCol?.cards.find(c => c.id === cardId);
      
      if (!cardToMove) return prev;

      // Handle reordering within same column
      if (sourceColumnId === targetColumnId) {
        return prev.map(col => {
          if (col.id === targetColumnId) {
            const cardsWithoutDragged = col.cards.filter(c => c.id !== cardId);
            if (targetCardId) {
              const targetIdx = cardsWithoutDragged.findIndex(c => c.id === targetCardId);
              if (targetIdx !== -1) {
                const updatedCards = [...cardsWithoutDragged];
                updatedCards.splice(targetIdx, 0, cardToMove);
                return { ...col, cards: updatedCards };
              }
            }
            return { ...col, cards: [...cardsWithoutDragged, cardToMove] };
          }
          return col;
        });
      }

      // Handle moving to a different column
      return prev.map(col => {
        if (col.id === sourceColumnId) {
          return {
            ...col,
            cards: col.cards.filter(c => c.id !== cardId)
          };
        }
        if (col.id === targetColumnId) {
          const targetCards = [...col.cards];
          if (targetCardId) {
            const targetIdx = targetCards.findIndex(c => c.id === targetCardId);
            if (targetIdx !== -1) {
              targetCards.splice(targetIdx, 0, cardToMove);
              return { ...col, cards: targetCards };
            }
          }
          targetCards.push(cardToMove);
          return { ...col, cards: targetCards };
        }
        return col;
      });
    });

    setDraggedCard(null);
    setTargetCardId(null);
  };

  // Card Management
  const openAddCardModal = (columnId: string) => {
    setModalColumnId(columnId);
    setIsModalOpen(true);
  };

  const closeAddCardModal = () => {
    setIsModalOpen(false);
    setModalColumnId(null);
    setNewCardTitle('');
    setNewCardDetails('');
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !modalColumnId) return;

    const newCard: Card = {
      id: `card-${Date.now()}`,
      title: newCardTitle.trim(),
      details: newCardDetails.trim()
    };

    setColumns(prev =>
      prev.map(col =>
        col.id === modalColumnId
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      )
    );

    closeAddCardModal();
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter(c => c.id !== cardId) }
          : col
      )
    );
  };

  return (
    <div className="board-container">
      <header>
        <h1>Kanban<span>Flow</span></h1>
      </header>

      <main className="board-columns" style={{ marginTop: '2rem' }}>
        {columns.map(col => (
          <section 
            key={col.id} 
            className="column"
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            aria-label={`${col.title} column`}
          >
            <div className="column-header">
              <input
                type="text"
                className="column-title-input"
                value={col.title}
                onChange={(e) => handleRenameColumn(col.id, e.target.value)}
                aria-label={`Rename ${col.title} column`}
              />
              <span className="column-count">{col.cards.length}</span>
            </div>

            <div className={`cards-list ${activeDragColumnId === col.id ? 'drag-over' : ''}`}>
              {col.cards.map(card => (
                <article
                  key={card.id}
                  id={card.id}
                  className="card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id, col.id)}
                  onDragEnd={(e) => handleDragEnd(e, card.id)}
                  onDragOver={(e) => handleCardDragOver(e, card.id)}
                >
                  <h2 className="card-title">{card.title}</h2>
                  {card.details && <p className="card-details">{card.details}</p>}
                  <div className="card-actions">
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteCard(col.id, card.id)}
                      aria-label={`Delete card ${card.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <button 
              className="add-card-btn" 
              onClick={() => openAddCardModal(col.id)}
            >
              + Add Card
            </button>
          </section>
        ))}
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeAddCardModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Card</h2>
            <form onSubmit={handleAddCard}>
              <div className="form-group">
                <label className="form-label" htmlFor="card-title">Card Title</label>
                <input
                  id="card-title"
                  className="form-input"
                  type="text"
                  required
                  placeholder="Enter task title"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="card-desc">Details</label>
                <textarea
                  id="card-desc"
                  className="form-textarea"
                  placeholder="Enter details about this task"
                  value={newCardDetails}
                  onChange={(e) => setNewCardDetails(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={closeAddCardModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-submit">
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
