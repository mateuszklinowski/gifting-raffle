import React from 'react';

import { render, fireEvent, getByText } from 'test';
import { Login } from './Login';

describe('LoginContainer', () => {
  // TODO say about snapshot
  it('Show error message for invalid email', () => {
    const { container } = render(<Login onSubmit={jest.fn()} />);

    expect(container.querySelector('.error')).toBeFalsy();

    const loginInput = container.querySelector('[name="email"]') as any;
    fireEvent.change(loginInput, { target: { value: 'incorrectEmail' } });

    expect(container.querySelector('.error')).toBeTruthy();
    expect(getByText(container, 'validation.email')).toBeTruthy();
  });

  it('Invoke on submit with correct values', () => {
    const onSubmit = jest.fn(() => new Promise(res => res({})));

    const { container } = render(<Login onSubmit={onSubmit} />);

    const email = 'testLogin@foo.bar';
    const password = 'testPass';

    const loginInput = container.querySelector('[name="email"]') as any;
    fireEvent.change(loginInput, { target: { value: email } });

    const passwordInput = container.querySelector('[name="password"]') as any;
    fireEvent.change(passwordInput, { target: { value: password } });

    const loginButton = container.querySelector('button[type="submit"]') as any;
    fireEvent.click(loginButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      email,
      password,
    });
  });

  it('Disable submit button if form has errors', () => {
    const onSubmit = jest.fn(() => new Promise(res => res({})));

    const { container } = render(<Login onSubmit={onSubmit} />);

    const email = 'testLogin@foo.bar';
    const password = '';

    const loginInput = container.querySelector('[name="email"]') as any;
    fireEvent.change(loginInput, { target: { value: email } });

    const passwordInput = container.querySelector('[name="password"]')as any;
    fireEvent.change(passwordInput, { target: { value: password } });

    const loginButton = container.querySelector('button[type="submit"]') as any;
    fireEvent.click(loginButton);

    expect(onSubmit).toHaveBeenCalledTimes(0);
    expect(loginButton.disabled).toBeTruthy()
  });
});
