import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";

interface AppLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    showHeader?: boolean;
    showBottomNav?: boolean;
}

/**
 * AppLayout - Layout principal do app com header e footer FIXOS
 * 
 * Estrutura:
 * ┌─────────────────────────┐
 * │   🔒 HEADER FIXO        │  ← Safe area + Logo
 * ├─────────────────────────┤
 * │                         │
 * │   📜 CONTEÚDO          │  ← Área scrollável
 * │      SCROLLÁVEL         │
 * │                         │
 * ├─────────────────────────┤
 * │   🔒 BOTTOM NAV FIXA   │  ← Início/Treinos/Perfil
 * └─────────────────────────┘
 */
export const AppLayout = ({
    children,
    activeTab,
    onTabChange,
    showHeader = true,
    showBottomNav = true
}: AppLayoutProps) => {
    return (
        <div className="app-layout">
            {/* Header - Relative position in flex container */}
            {showHeader && (
                <header className="app-header">
                    <div className="app-header-content">
                        <img
                            src="/cod-logo.png"
                            alt="COD System"
                            className="app-logo"
                        />
                    </div>
                </header>
            )}

            {/* Scrollable Content Area - ÚNICO elemento com scroll */}
            {/* BUILD 64: Usando classe CSS ao invés de inline style para considerar safe-area */}
            <main className={`app-content ${showBottomNav ? 'has-bottom-nav' : ''}`}>
                {children}
            </main>

            {/* Fixed Bottom Navigation - position: fixed via inline styles */}
            {showBottomNav && (
                <BottomNavigation
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                />
            )}
        </div>
    );
};
