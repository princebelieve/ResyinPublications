export default function AuthLoadingScreen({ message = "Checking your account…" }) {
  return (
    <main className="auth-loading-screen" aria-live="polite" aria-busy="true">
      <div className="auth-loading-card">
        <span className="auth-loading-spinner" aria-hidden="true" />
        <p>{message}</p>
      </div>
    </main>
  );
}
