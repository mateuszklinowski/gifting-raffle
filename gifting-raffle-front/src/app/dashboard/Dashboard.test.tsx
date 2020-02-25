import React from 'react';
import ReactTestUtils, {SyntheticEventData} from 'react-dom/test-utils';

import { render, fireEvent, waitForElement, getByText } from 'test';
import { Dashboard } from './Dashboard';

const raffleListMock = [
  {
    id: '1',
    name: 'foo',
    isOwner: false,
    finished: false,
  },
  {
    id: '2',
    name: 'faa',
    isOwner: false,
    finished: false,
  },
  {
    id: '3',
    name: 'foa',
    isOwner: false,
    finished: false,
  },
];

describe('Dashboard', () => {
  it('Invoke handler on select', () => {
    const openDetails = jest.fn();
    const { container } = render(<Dashboard loading={false} rafflesList={raffleListMock} openDetails={openDetails} />);

    const select = container.querySelector('.ui.selection.dropdown') as any;
    expect(select.className.includes('active')).toBeFalsy();

    fireEvent.click(select);
    expect(select.className.includes('active')).toBeTruthy();

    fireEvent.click(getByText(select, 'foa'));
    expect(openDetails).toHaveBeenCalledTimes(1);
    expect(openDetails).toHaveBeenCalledWith('3');
  });

  it('Search raffles', async () => {
    const openDetails = jest.fn();
    const { container } = render(<Dashboard loading={false} rafflesList={raffleListMock} openDetails={openDetails} />);

    const search = container.querySelector('.ui.search') as any;
    expect(search.querySelector('.result')).toBeFalsy();

    ReactTestUtils.Simulate.change(search.querySelector('input'), { target: { value: 'fo' } } as SyntheticEventData);

    await waitForElement(() => getByText(search, 'foo'));
    const results = search.querySelectorAll('.result');

    expect(results.length).toEqual(2);
  });

  it('Invoke handler on search', async () => {
    const openDetails = jest.fn();
    const { container } = render(<Dashboard loading={false} rafflesList={raffleListMock} openDetails={openDetails} />);

    const search = container.querySelector('.ui.search') as any;
    expect(search.querySelector('.result')).toBeFalsy();

    ReactTestUtils.Simulate.change(search.querySelector('input'), { target: { value: 'fa' } } as SyntheticEventData);

    const result = await waitForElement(() => getByText(search, 'faa'));
    fireEvent.click(result);

    expect(openDetails).toHaveBeenCalledWith('2');
  });
});
