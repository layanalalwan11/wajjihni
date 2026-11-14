import ar from '@/lib/ar.json';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-6 mt-8">
      <div className="container mx-auto px-4 text-center space-y-2">
        <p className="text-sm">⚠️ {ar.disclaimer}</p>
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} {ar.siteName}
        </p>
      </div>
    </footer>
  );
}
