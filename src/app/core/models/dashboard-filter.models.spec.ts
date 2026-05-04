import { calculateDateRange } from './dashboard-filter.models';

describe('calculateDateRange', () => {
  const mockDate = new Date(2024, 5, 15); // 15 June 2024

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return this month range', () => {
    const result = calculateDateRange('thisMonth');
    expect(result.startDate).toBe('2024-06-01');
    expect(result.endDate).toBe('2024-06-15');
  });

  it('should return last month range', () => {
    const result = calculateDateRange('lastMonth');
    expect(result.startDate).toBe('2024-05-01');
    expect(result.endDate).toBe('2024-05-31');
  });

  it('should return last 3 months range', () => {
    const result = calculateDateRange('last3Months');
    expect(result.startDate).toBe('2024-04-01');
    expect(result.endDate).toBe('2024-06-15');
  });

  it('should return last 6 months range', () => {
    const result = calculateDateRange('last6Months');
    expect(result.startDate).toBe('2024-01-01');
    expect(result.endDate).toBe('2024-06-15');
  });

  it('should return this year range', () => {
    const result = calculateDateRange('thisYear');
    expect(result.startDate).toBe('2024-01-01');
    expect(result.endDate).toBe('2024-06-15');
  });

  it('should return custom range when provided', () => {
    const result = calculateDateRange('custom', '2024-02-10', '2024-03-20');
    expect(result.startDate).toBe('2024-02-10');
    expect(result.endDate).toBe('2024-03-20');
  });

  it('should fallback to today for custom range when dates are missing', () => {
    const result = calculateDateRange('custom');
    expect(result.startDate).toBe('2024-06-15');
    expect(result.endDate).toBe('2024-06-15');
  });

  it('should handle January for lastMonth', () => {
    vi.setSystemTime(new Date(2024, 0, 10)); // 10 Jan 2024
    const result = calculateDateRange('lastMonth');
    expect(result.startDate).toBe('2023-12-01');
    expect(result.endDate).toBe('2023-12-31');
  });
});
