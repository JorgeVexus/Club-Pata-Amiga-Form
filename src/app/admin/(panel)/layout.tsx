import AdminShellLayout from '@/components/Admin/Shell/AdminShellLayout';
import '@/styles/admin-globals.css';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
    return <AdminShellLayout>{children}</AdminShellLayout>;
}
