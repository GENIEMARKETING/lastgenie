import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/header';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Header Component', () => {
  it('renders the Genie logo', () => {
    render(<Header />);
    
    const logo = screen.getByText('Genie');
    expect(logo).toBeInTheDocument();
  });

  it('renders main navigation links', () => {
    render(<Header />);
    
    expect(screen.getByText('Shop')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('The Science')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders cart icon with count', () => {
    render(<Header />);
    
    // Cart count should show 0 by default
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    render(<Header />);
    
    const scienceLink = screen.getByText('The Science').closest('a');
    expect(scienceLink).toHaveAttribute('href', '/science');
    
    const aboutLink = screen.getByText('About').closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });
});