import Image from 'next/image';
import { Button } from './ui/button';

export const AppHeader = () => {
  return (
    <header className="bg-white border-b p-2">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Image src="/logo_ntf.png" alt="Niki Tuttofare Logo" width={40} height={40} />
          <span className="ml-2 font-semibold text-lg">Niki Tuttofare</span>
        </div>
        <Button variant="urgent" className="h-12 px-6">Chiama Urgente</Button>
      </div>
    </header>
  );
};
