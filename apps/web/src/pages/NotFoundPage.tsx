import { Link } from 'react-router-dom';
import { Seo } from '@/components/site/Seo';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-5 text-center">
      <div>
        <Seo title="Page not found" noindex />
        <p className="eyebrow">404</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight">
          We can't find that page
        </h1>
        <p className="mt-3 text-muted">
          It may have moved, or the link might be off. Here's the way back.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/schedule">Timetable</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
