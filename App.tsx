import React, { useState, useEffect } from 'react';
import { useVanish } from './hooks/useVanish';
import { AppView } from './types';
import { ActiveTasks } from './components/ActiveTasks';
import { TargetEngaged } from './components/TargetEngaged';
import { ExpiredNotice } from './components/ExpiredNotice';
import { DestructSequence } from './components/DestructSequence';
import { DestructedTerminal } from './components/DestructedTerminal';
import { StatsOverlay } from './components/StatsOverlay';
import { Onboarding } from './components/Onboarding';
import { IncomingCall } from './components/IncomingCall';
import { StealthMode } from './components/StealthMode';
import { IncomingDirectiveModal } from './components/IncomingDirectiveModal';
import { GlobalWipeSequence } from './components/GlobalWipeSequence';
import { LandingPage } from './components/LandingPage';

const App: React.FC = () => {
  const {
    view,
    tasks,
    stats,
    expiredCount,
    completedSessionCount,
    isConnected,
    activeNodes,
    networkIp,
    coprocessor,
    destructReason,
    handlerMessage,
    incomingCallText,
    isDeployed,
    activeTargetId,
    syndicateMode,
    squadIntegrity,
    squadNodes,
    incomingDirective,
    globalWipeCulprit,
    addTask,
    completeTask,
    deleteTask,
    deployOperation,
    engageTarget,
    disengageTarget,
    acknowledgeExpiry,
    keepApp,
    letItGo,
    finishGlobalWipe,
    manualPanic,
    terminateServer,
    enterOnboarding,
    finishOnboarding,
    acknowledgeCall,
    setManualIp,
    acceptDirective,
    rejectDirective,
    verifyKill,
    denyKill
  } = useVanish();

  const [isStealth, setIsStealth] = useState(false);

  // Stealth Mode / Boss Key Logic (Double Tap Escape)
  useEffect(() => {
    let lastEsc = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEsc < 400) { 
          setIsStealth(prev => !prev);
          lastEsc = 0;
        } else {
          lastEsc = now;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isStealth) {
    return <StealthMode />;
  }

  if (view === AppView.LANDING) {
    return <LandingPage onEnter={enterOnboarding} />;
  }

  if (view === AppView.IDENTIFY) {
    return <Onboarding onComplete={finishOnboarding} />;
  }

  if (view === AppView.INCOMING_CALL) {
    return <IncomingCall taskText={incomingCallText} onAcknowledge={acknowledgeCall} />;
  }

  if (view === AppView.INCOMING_DIRECTIVE && incomingDirective) {
    return (
      <IncomingDirectiveModal 
        task={incomingDirective} 
        onAccept={() => acceptDirective(incomingDirective)} 
        onReject={() => rejectDirective(incomingDirective)} 
      />
    );
  }

  if (view === AppView.GLOBAL_WIPE) {
    return (
      <GlobalWipeSequence 
        culprit={globalWipeCulprit} 
        onComplete={finishGlobalWipe} 
      />
    );
  }

  if (view === AppView.ENGAGED && activeTargetId) {
    const targetTask = tasks.find(t => t.id === activeTargetId);
    if (targetTask) {
      return (
        <TargetEngaged 
          task={targetTask} 
          onComplete={completeTask} 
          onAbort={disengageTarget} 
        />
      );
    }
  }

  if (view === AppView.DESTRUCTED) {
    return <DestructedTerminal reason={destructReason} terminateServer={terminateServer} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 py-4 md:py-8 lg:py-12 px-4 sm:px-8 md:px-12 lg:px-20 flex justify-center">
      <div className="w-full max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl flex flex-col min-h-full transition-all duration-700 ease-in-out">
        <main className="flex-grow flex flex-col w-full">
          {view === AppView.TASKS && (
            <ActiveTasks
              tasks={tasks}
              isConnected={isConnected}
              activeNodes={activeNodes}
              networkIp={networkIp}
              coprocessor={coprocessor}
              handlerMessage={handlerMessage}
              isDeployed={isDeployed}
              syndicateMode={syndicateMode}
              squadIntegrity={squadIntegrity}
              squadNodes={squadNodes}
              onAddTask={addTask}
              onCompleteTask={completeTask}
              onDeleteTask={deleteTask}
              onDeploy={deployOperation}
              onEngage={engageTarget}
              onPanic={manualPanic}
              onSetManualIp={setManualIp}
              verifyKill={verifyKill}
              denyKill={denyKill}
            />
          )}

          {view === AppView.EXPIRED_NOTICE && (
            <ExpiredNotice count={expiredCount} onAcknowledge={acknowledgeExpiry} />
          )}

          {view === AppView.DESTRUCTING && (
            <DestructSequence
              completedCount={completedSessionCount}
              reason={destructReason}
              onKeep={keepApp}
              onDestruct={letItGo}
            />
          )}
        </main>

        {view === AppView.TASKS && <StatsOverlay stats={stats} />}
      </div>
      
      {/* Global CSS overrides for animations specific to app states */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        @keyframes completedDrop {
          0% { transform: scale(0.97) translateX(-10px); opacity: 0; filter: blur(3px); color: #ef4444; }
          40% { color: #dc2626; opacity: 1; }
          100% { transform: scale(1) translateX(0); opacity: 0.7; filter: blur(0); }
        }
        .animate-completed-drop {
          animation: completedDrop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
