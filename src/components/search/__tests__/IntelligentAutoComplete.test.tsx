import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntelligentAutoComplete } from '../IntelligentAutoComplete';
import * as searchUtils from '../../../utils/searchUtils';

describe('IntelligentAutoComplete Component - Debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders input with given initial value', () => {
    const onChange = vi.fn();
    const onSearch = vi.fn();

    render(<IntelligentAutoComplete value="react" onChange={onChange} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search for knowledge, authors, or topics...');
    expect(input).toHaveValue('react');
  });

  it('debounces calls to getSearchSuggestions when typing', () => {
    const getSearchSuggestionsSpy = vi.spyOn(searchUtils, 'getSearchSuggestions');
    const onChange = vi.fn();
    const onSearch = vi.fn();

    const { rerender } = render(
      <IntelligentAutoComplete value="" onChange={onChange} onSearch={onSearch} debounceMs={300} />,
    );

    const initialCalls = getSearchSuggestionsSpy.mock.calls.length;

    // Simulate typing multiple characters sequentially
    rerender(<IntelligentAutoComplete value="c" onChange={onChange} onSearch={onSearch} debounceMs={300} />);
    rerender(<IntelligentAutoComplete value="ca" onChange={onChange} onSearch={onSearch} debounceMs={300} />);
    rerender(<IntelligentAutoComplete value="cai" onChange={onChange} onSearch={onSearch} debounceMs={300} />);
    rerender(<IntelligentAutoComplete value="cair" onChange={onChange} onSearch={onSearch} debounceMs={300} />);
    rerender(<IntelligentAutoComplete value="cairo" onChange={onChange} onSearch={onSearch} debounceMs={300} />);

    // Before timer advances, getSearchSuggestions should not have been called for intermediate keystrokes
    expect(getSearchSuggestionsSpy.mock.calls.length).toBe(initialCalls);

    // Advance time by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now getSearchSuggestions should be called once with the final debounced value
    expect(getSearchSuggestionsSpy.mock.calls.length).toBe(initialCalls + 1);
    expect(getSearchSuggestionsSpy).toHaveBeenLastCalledWith('cairo');
  });

  it('triggers onSearch when Enter is pressed without active dropdown selection', () => {
    const onChange = vi.fn();
    const onSearch = vi.fn();

    render(<IntelligentAutoComplete value="starknet" onChange={onChange} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search for knowledge, authors, or topics...');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSearch).toHaveBeenCalledWith('starknet');
  });
});
