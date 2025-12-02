// @ts-nocheck
// Test dependencies not installed - run: npm install -D @testing-library/react @types/jest jest
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from '../ZoomControls';

describe('ZoomControls', () => {
  const mockCallbacks = {
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onFitToView: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all three zoom buttons', () => {
    render(<ZoomControls {...mockCallbacks} zoom={1} />);

    expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fit to view/i)).toBeInTheDocument();
  });

  it('should display current zoom percentage', () => {
    render(<ZoomControls {...mockCallbacks} zoom={2.5} />);

    expect(screen.getByText('250%')).toBeInTheDocument();
  });

  it('should call onZoomIn when zoom in button is clicked', () => {
    render(<ZoomControls {...mockCallbacks} zoom={1} />);

    const zoomInButton = screen.getByLabelText(/zoom in/i);
    fireEvent.click(zoomInButton);

    expect(mockCallbacks.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('should call onZoomOut when zoom out button is clicked', () => {
    render(<ZoomControls {...mockCallbacks} zoom={2} />);

    const zoomOutButton = screen.getByLabelText(/zoom out/i);
    fireEvent.click(zoomOutButton);

    expect(mockCallbacks.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('should call onFitToView when fit to view button is clicked', () => {
    render(<ZoomControls {...mockCallbacks} zoom={1} />);

    const fitButton = screen.getByLabelText(/fit to view/i);
    fireEvent.click(fitButton);

    expect(mockCallbacks.onFitToView).toHaveBeenCalledTimes(1);
  });

  it('should disable zoom in button at maximum zoom', () => {
    render(<ZoomControls {...mockCallbacks} zoom={8} />);

    const zoomInButton = screen.getByLabelText(/zoom in/i);
    expect(zoomInButton).toBeDisabled();
  });

  it('should disable zoom out button at minimum zoom', () => {
    render(<ZoomControls {...mockCallbacks} zoom={0.5} />);

    const zoomOutButton = screen.getByLabelText(/zoom out/i);
    expect(zoomOutButton).toBeDisabled();
  });

  it('should enable both zoom buttons at mid-range zoom', () => {
    render(<ZoomControls {...mockCallbacks} zoom={2} />);

    const zoomInButton = screen.getByLabelText(/zoom in/i);
    const zoomOutButton = screen.getByLabelText(/zoom out/i);

    expect(zoomInButton).not.toBeDisabled();
    expect(zoomOutButton).not.toBeDisabled();
  });

  it('should format zoom percentage correctly', () => {
    const { rerender } = render(<ZoomControls {...mockCallbacks} zoom={0.5} />);
    expect(screen.getByText('50%')).toBeInTheDocument();

    rerender(<ZoomControls {...mockCallbacks} zoom={1.5} />);
    expect(screen.getByText('150%')).toBeInTheDocument();

    rerender(<ZoomControls {...mockCallbacks} zoom={8} />);
    expect(screen.getByText('800%')).toBeInTheDocument();
  });
});
