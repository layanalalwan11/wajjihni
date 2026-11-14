import ar from '@/lib/ar.json';

export default function Disclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8">
      <p className="text-amber-800 text-sm text-center font-medium">
        ⚠️ {ar.disclaimer}
      </p>
    </div>
  );
}
