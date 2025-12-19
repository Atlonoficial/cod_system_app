import { Home, Dumbbell, User } from "lucide-react";
import { useEffect } from "react";
import { useKeyboardState } from "@/hooks/useKeyboardState";
import { useBottomNavGestures } from "@/hooks/useBottomNavGestures";
import { useIsMobileApp } from "@/hooks/useIsMobileApp";

const navItems = [
  { id: 'home', icon: Home, label: 'Início' },
  { id: 'workouts', icon: Dumbbell, label: 'Treinos' },
  { id: 'profile', icon: User, label: 'Perfil' },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const { isVisible: keyboardVisible } = useKeyboardState();
  const { isMobileApp } = useIsMobileApp();
  const gestures = useBottomNavGestures({
    activeTab,
    tabs: navItems,
    onTabChange
  });

  // ✅ BUILD 31: Anti-duplicação removida - CSS já previne duplicação via .bottom-nav-container ~ .bottom-nav-container

  // Se o teclado estiver visível, não renderizar a barra de navegação
  if (keyboardVisible) {
    return null;
  }

  return (
    <nav
      {...(isMobileApp ? gestures : {})}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50, // Reduzido de 999999 para um valor sensato, mas acima de conteúdo normal
        touchAction: 'none',
        paddingBottom: 'env(safe-area-inset-bottom)', // Garante padding nativo
      }}
      className="
        bottom-nav-container
        bg-card/95 backdrop-blur-lg
        border-t border-border
        w-full
        shadow-lg
      "
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="
        bottom-nav-wrapper
        w-full
        md:max-w-md md:mx-auto
        lg:max-w-lg
      ">
        <div className="
          flex justify-around items-center
          px-2 py-2
          h-[72px]
        ">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  nav-item ripple-effect touch-feedback-light
                  ${isActive ? 'active' : ''} 
                  flex-1 
                  min-w-[48px] max-w-[88px]
                  min-h-[48px]
                  relative
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card
                  transition-all duration-200
                  flex flex-col items-center justify-center gap-1
                `}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={0}
              >
                <Icon
                  size={22}
                  className={`
                    transition-all duration-300
                    ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}
                  `}
                  aria-hidden="true"
                />
                <span
                  className={`
                    text-[10px] xs:text-[11px] font-medium
                    transition-all duration-300
                    text-center leading-tight
                    ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}
                    line-clamp-1
                  `}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
