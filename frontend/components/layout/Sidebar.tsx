import Link from 'next/link';

export default function Sidebar() {
  // This would be replaced with actual auth state
  const isLoggedIn = false;
  
  if (!isLoggedIn) return null;
  
  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <nav className="mt-8">
        <ul className="space-y-2">
          <li>
            <Link href="/dashboard" className="block py-2 px-4 rounded hover:bg-gray-700">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/portfolio" className="block py-2 px-4 rounded hover:bg-gray-700">
              Portfolio
            </Link>
          </li>
          <li>
            <Link href="/predictions" className="block py-2 px-4 rounded hover:bg-gray-700">
              Predictions
            </Link>
          </li>
          <li>
            <Link href="/profile" className="block py-2 px-4 rounded hover:bg-gray-700">
              Profile
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}