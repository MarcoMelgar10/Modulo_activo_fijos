import { render, screen } from '@testing-library/react';
import { Button } from './Button.jsx';

describe('Button (design system)', () => {
  it('renderiza su contenido', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('aplica el estilo de la variante secundaria', () => {
    render(<Button variant="secondary">Cancelar</Button>);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveClass('border-line');
  });
});
