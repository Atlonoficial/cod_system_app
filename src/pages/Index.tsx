import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Workouts } from "@/components/workouts/Workouts";
import { Profile } from "@/components/profile/Profile";

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleWorkoutClick = () => {
    setActiveTab('workouts');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard onWorkoutClick={handleWorkoutClick} />;
      case 'workouts':
        return <Workouts />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onWorkoutClick={handleWorkoutClick} />;
    }
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      showHeader={true}
      showBottomNav={true}
    >
      <div
        key={activeTab}
        className="animate-in fade-in slide-in-from-bottom-4 duration-300 p-4"
      >
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default Index;

