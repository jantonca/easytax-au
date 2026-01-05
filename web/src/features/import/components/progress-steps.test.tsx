import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressSteps } from './progress-steps';

describe('ProgressSteps', () => {
  it('renders all three steps', () => {
    render(<ProgressSteps currentStep="upload" />);

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('highlights upload step when current step is upload', () => {
    render(<ProgressSteps currentStep="upload" />);

    const uploadStep = screen.getByText('Upload').closest('div');
    const previewStep = screen.getByText('Preview').closest('div');
    const importStep = screen.getByText('Import').closest('div');

    expect(uploadStep).toHaveClass('text-emerald-400');
    expect(previewStep).toHaveClass('text-slate-500');
    expect(importStep).toHaveClass('text-slate-500');
  });

  it('highlights preview step when current step is preview', () => {
    render(<ProgressSteps currentStep="preview" />);

    const uploadStep = screen.getByText('Upload').closest('div');
    const previewStep = screen.getByText('Preview').closest('div');
    const importStep = screen.getByText('Import').closest('div');

    expect(uploadStep).toHaveClass('text-slate-500');
    expect(previewStep).toHaveClass('text-emerald-400');
    expect(importStep).toHaveClass('text-slate-500');
  });

  it('highlights import step when current step is progress', () => {
    render(<ProgressSteps currentStep="progress" />);

    const uploadStep = screen.getByText('Upload').closest('div');
    const previewStep = screen.getByText('Preview').closest('div');
    const importStep = screen.getByText('Import').closest('div');

    expect(uploadStep).toHaveClass('text-slate-500');
    expect(previewStep).toHaveClass('text-slate-500');
    expect(importStep).toHaveClass('text-emerald-400');
  });

  it('displays step numbers 1, 2, 3', () => {
    render(<ProgressSteps currentStep="upload" />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies active styling to step indicators', () => {
    render(<ProgressSteps currentStep="preview" />);

    const uploadIndicator = screen.getByText('1').closest('div');
    const previewIndicator = screen.getByText('2').closest('div');
    const importIndicator = screen.getByText('3').closest('div');

    expect(uploadIndicator).not.toHaveClass('border-emerald-500');
    expect(previewIndicator).toHaveClass('border-emerald-500');
    expect(previewIndicator).toHaveClass('bg-emerald-500/10');
    expect(importIndicator).not.toHaveClass('border-emerald-500');
  });
});
