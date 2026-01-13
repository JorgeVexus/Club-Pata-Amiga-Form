import AmbassadorForm from '@/components/AmbassadorForm/AmbassadorForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sé Embajador - Club Pata Amiga',
    description: 'Únete a nuestra manada como embajador y gana comisiones por cada referido.',
};

export default function AmbassadorRegistrationPage() {
    return <AmbassadorForm />;
}
