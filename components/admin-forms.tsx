"use client";

// The small pieces of the admin page that need the browser: showing "Saving…" while a form is sent,
// and showing the message an action returns (wrong password, "Sent to 12 phones").
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, sendAnnouncement } from "@/app/admin/actions";

// A submit button that greys out and says "Saving…" while its form is being sent.
export function SubmitButton({ children, quiet }: { children: React.ReactNode; quiet?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={quiet ? "button-quiet" : "button"} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="admin-form">
      <label className="field">
        Password
        <input type="password" name="password" autoComplete="current-password" required autoFocus />
      </label>
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Log in</SubmitButton>
    </form>
  );
}

export function AnnouncementForm() {
  const [state, action] = useActionState(sendAnnouncement, null);
  return (
    <form action={action} className="admin-form" key={state?.ok ? state.message : "form"}>
      <label className="field">
        Title
        <input name="title" maxLength={80} required placeholder="Lunch moved to 12:30" />
      </label>
      <label className="field">
        Message
        <textarea name="body" maxLength={500} required rows={3} placeholder="Meet in the Lobby first." />
      </label>
      {state && (
        <p className={state.ok ? "form-ok" : "form-error"} role="status">
          {state.message}
        </p>
      )}
      <SubmitButton>Post and notify everyone</SubmitButton>
    </form>
  );
}
