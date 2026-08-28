import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-deep text-deep-fg">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <p className="font-display text-2xl tracking-tightpx">
              Pilates<span className="text-primary">.</span>Studio
            </p>
            <p className="mt-2 max-w-xs text-sm text-deep-fg/70">
              Reformer &amp; mat Pilates. Small classes, real attention, spots
              that go fast.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div className="space-y-2">
              <p className="eyebrow text-deep-fg/50">Studio</p>
              <Link to="/classes" className="block hover:text-primary">
                Classes
              </Link>
              <Link to="/instructors" className="block hover:text-primary">
                Instructors
              </Link>
              <Link to="/pricing" className="block hover:text-primary">
                Pricing
              </Link>
            </div>
            <div className="space-y-2">
              <p className="eyebrow text-deep-fg/50">Account</p>
              <Link to="/login" className="block hover:text-primary">
                Sign in
              </Link>
              <Link to="/register" className="block hover:text-primary">
                Create account
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-12 text-xs text-deep-fg/40">
          © {new Date().getFullYear()} Pilates Studio. Photography placeholders
          from Unsplash.
        </p>
      </div>
    </footer>
  );
}
