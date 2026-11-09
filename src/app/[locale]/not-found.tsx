import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap not-found-copy py-24">
      <p className="kicker">404</p>
      <h1 className="mt-3 text-4xl font-semibold">Página não encontrada · Page not found</h1>
      <p className="mt-6 flex gap-4">
        <Link className="btn btn-primary" href="/pt">Início</Link>
        <Link className="btn" href="/en">Home</Link>
      </p>
    </div>
  );
}
