import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';

const mount = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <ThemeProvider><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></ThemeProvider>
  </MemoryRouter>,
);
const T = { timeout: 4000 };

describe('public pages (demo mode)', () => {
  it('home shows hero, notices and events from data layer', async () => {
    mount('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Electronics/i);
    expect(await screen.findByText(/Welcome to Academic Year/i, {}, T)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Technical Workshop/i }, T)).toBeInTheDocument();
  });

  it('faculty directory searches and filters', async () => {
    mount('/faculty');
    expect(await screen.findByText('Dr J.J Chopda', {}, T)).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), 'embedded');
    expect(await screen.findByText('Demo Faculty A', {}, T)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Dr J.J Chopda')).not.toBeInTheDocument(), T);
  });

  it('notices page shows pinned notice first and empty state for no match', async () => {
    mount('/notices');
    const items = await screen.findAllByRole('heading', { level: 2 }, T);
    expect(items[0]).toHaveTextContent(/Welcome to Academic Year/i);
    await userEvent.type(screen.getByRole('searchbox'), 'zzzzqqq');
    expect(await screen.findByText(/No notices found/i, {}, T)).toBeInTheDocument();
  });

  it('contact form shows inline validation errors and does not submit', async () => {
    mount('/contact');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText(/Please enter your name/i)).toBeInTheDocument();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(screen.queryByText(/has been received/i)).not.toBeInTheDocument();
  });

  it('contact form submits when valid', async () => {
    mount('/contact');
    await userEvent.type(screen.getByLabelText('Your name'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Subject'), 'Hello');
    await userEvent.type(screen.getByLabelText('Message'), 'This is a long enough message.');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText(/has been received/i, {}, T)).toBeInTheDocument();
  });

  it('event registration works once and blocks the duplicate', async () => {
    mount('/events');
    await screen.findByRole('heading', { name: /Technical Workshop/i }, T);
    const reg = async () => {
      await userEvent.click(screen.getAllByRole('button', { name: /register now/i })[0]);
      const dlg = screen.getByRole('dialog');
      await userEvent.type(within(dlg).getByLabelText('Full name'), 'Dup Tester');
      await userEvent.type(within(dlg).getByLabelText('Email'), 'dup@example.com');
      await userEvent.click(within(dlg).getByRole('button', { name: /confirm registration/i }));
    };
    await reg();
    expect(await screen.findByRole('dialog', { name: /Registration confirmed/i }, T)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^close$/i }));
    await reg();
    await waitFor(() => expect(screen.getAllByText(/already registered/i).length).toBeGreaterThan(0), T);
  });
});

describe('auth and access control (demo mode)', () => {
  it('redirects anonymous users from /admin to login', async () => {
    mount('/admin');
    expect(await screen.findByRole('heading', { name: /sign in/i }, T)).toBeInTheDocument();
  });

  it('rejects wrong password and accepts the admin demo account', async () => {
    mount('/login');
    await userEvent.type(screen.getByLabelText('Email'), 'admin@demo.local');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-pass');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText(/Invalid email or password/i, {}, T)).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Password'));
    await userEvent.type(screen.getByLabelText('Password'), 'demo-admin');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByRole('heading', { name: /^dashboard$/i }, T)).toBeInTheDocument();
  });

  it('student signs in and lands on the portal (not the dashboard)', async () => {
    mount('/login');
    await userEvent.type(screen.getByLabelText('Email'), 'student@demo.local');
    await userEvent.type(screen.getByLabelText('Password'), 'demo-student');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByRole('heading', { name: /Welcome, Demo Student/i }, T)).toBeInTheDocument();
  });

  it('admin can create a faculty record and delete it after confirmation', async () => {
    mount('/login');
    await userEvent.type(screen.getByLabelText('Email'), 'admin@demo.local');
    await userEvent.type(screen.getByLabelText('Password'), 'demo-admin');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await screen.findByRole('heading', { name: /^dashboard$/i }, T);
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Admin' })).getByRole('link', { name: /^Faculty$/ }));
    await screen.findByRole('heading', { name: /^Faculty$/ }, T);
    await userEvent.click(await screen.findByRole('button', { name: /add new/i }, T));
    const dlg = screen.getByRole('dialog');
    await userEvent.click(within(dlg).getByRole('button', { name: /save/i }));
    expect(await within(dlg).findByText(/Name must be at least 2/i)).toBeInTheDocument();
    await userEvent.type(within(dlg).getByLabelText('Full name'), 'Test Professor');
    await userEvent.type(within(dlg).getByLabelText('Qualification'), 'Ph.D.');
    await userEvent.type(within(dlg).getByLabelText('Specialization'), 'Signals');
    await userEvent.type(within(dlg).getByLabelText('Email'), 'tp@example.com');
    await userEvent.click(within(dlg).getByRole('button', { name: /save/i }));
    expect(await screen.findByText('Test Professor', {}, T)).toBeInTheDocument();
    const row = screen.getByText('Test Professor').closest('tr');
    await userEvent.click(within(row).getByRole('button', { name: /delete/i }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(screen.queryByText('Test Professor')).not.toBeInTheDocument(), T);
  }, 25000);
});
