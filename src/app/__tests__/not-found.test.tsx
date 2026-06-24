import { render, screen } from '@testing-library/react';
import NotFoundPage from '../not-found';

describe('NotFoundPage', () => {
  it('renders a helpful 404 experience with recovery options', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByText(/the page you were looking for doesn['’]t exist/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go back home/i })).toHaveAttribute('href', '/');
  });
});
