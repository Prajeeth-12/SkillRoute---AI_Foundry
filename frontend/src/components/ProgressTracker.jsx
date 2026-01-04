import React from 'react';
import { Flame, Trophy, Calendar, ArrowRight, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const ProgressTracker = ({ progress, phases }) => {
  if (!progress) return null;

  const { completed_phases, total_phases, streak_days, last_activity_date } = progress;
  const percentage = total_phases > 0 ? Math.round((completed_phases / total_phases) * 100) : 0;

  // Find the first non-completed phase
  const currentPhase = phases?.find(phase => phase.status !== 'completed');
  const nextPhase = phases?.find((phase, index) => {
    const phaseIndex = phases.indexOf(currentPhase);
    return index === phaseIndex + 1;
  });

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Card */}
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-full">
              <Flame className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Streak</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{streak_days} Days</h3>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-full">
              <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Progress</p>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2.5">
                <div 
                  className="bg-black dark:bg-white h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Active Card */}
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-full">
              <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Active</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {last_activity_date ? new Date(last_activity_date).toLocaleDateString() : 'Today'}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Focus / Next Step Card */}
      {currentPhase && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border-indigo-100 dark:border-zinc-800 shadow-sm dark:shadow-none dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-full mt-1">
                  <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Current Focus</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">• Phase {phases.indexOf(currentPhase) + 1} of {phases.length}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{currentPhase.phase_name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl">
                    {currentPhase.topics?.slice(0, 3).join(', ')}
                    {currentPhase.topics?.length > 3 && ` +${currentPhase.topics.length - 3} more`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 pl-14 md:pl-0">
                {nextPhase && (
                  <div className="hidden md:block text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Up Next</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{nextPhase.phase_name}</p>
                  </div>
                )}
                <div className="h-10 w-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm dark:shadow-none border border-indigo-100 dark:border-zinc-700">
                  <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressTracker;
