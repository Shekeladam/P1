export default function PrivacyPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-8 max-w-[720px] w-full mx-auto flex flex-col gap-4 text-sm text-zinc-300">
      <h1 className="text-xl font-semibold text-zinc-100 mb-1">Privacy Policy</h1>
      <p className="text-xs text-zinc-500">Last updated: 2026</p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">What we collect</h2>
      <p>
        If you create an account, we store your email address, a securely hashed version of your password
        (or nothing at all, if you sign in with Google), your display name, and your simulated trading
        activity (holdings, trades, cash balance). If you subscribe to the email digest, we store your
        email address and an unsubscribe token.
      </p>
      <p>
        We don&apos;t collect payment information, phone numbers, or physical addresses — none of that is
        needed, since no real money is ever involved.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">How we use it</h2>
      <p>
        Your account data is used only to run your NovaX account: signing you in, tracking your simulated
        portfolio, showing your rank on the leaderboard, and sending the crypto digest email if you
        subscribed to it. We don&apos;t sell your data or share it with advertisers.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">Sign in with Google</h2>
      <p>
        If you sign in with Google, we receive your email address and name from Google to create or match
        your NovaX account. We never see or store your Google password.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">Cookies</h2>
      <p>
        NovaX uses a single session cookie to keep you signed in, and a short-lived cookie during sign-in
        with Google to prevent forged login attempts. We don&apos;t use tracking or advertising cookies.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">Your data, your control</h2>
      <p>
        You can change your display name, set or change your password, or permanently delete your account
        and all associated data at any time from the Settings page.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">Contact</h2>
      <p>Questions about your data? Reach out via the email address you used to subscribe or sign up.</p>
    </main>
  );
}
