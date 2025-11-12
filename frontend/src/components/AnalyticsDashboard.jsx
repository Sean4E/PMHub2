import React, { useState, useRef, useEffect } from 'react';
import { Info, TrendingUp, Target, Clock, AlertCircle, CheckCircle, BarChart3, Maximize2, Minimize2, Maximize, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const InfoTooltip = ({ title, description, calculation, insights }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-white/10 rounded-full transition-all"
        title="More info"
      >
        <Info className="w-4 h-4 text-gray-400 hover:text-white" />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-4 shadow-2xl z-60"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-all -mt-1 -mr-1 flex-shrink-0"
              title="Close"
            >
              <X className="w-3 h-3 text-gray-400 hover:text-white" />
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto text-xs">
            <div>
              <h4 className="text-xs font-semibold text-blue-400 mb-1">Description</h4>
              <p className="text-xs text-gray-300">{description}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-purple-400 mb-1">Calculation</h4>
              <p className="text-[10px] text-gray-300 font-mono bg-black/40 p-2 rounded">
                {calculation}
              </p>
            </div>

            {insights && (
              <div>
                <h4 className="text-xs font-semibold text-green-400 mb-1">Insights</h4>
                <ul className="text-xs text-gray-300 space-y-0.5">
                  {insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AnalyticsDashboard = ({ projects, tasks }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFitToScreen, setIsFitToScreen] = useState(false);
  const containerRef = useRef(null);

  // Calculate analytics
  const completedTasks = tasks.filter(t => t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const reviewTasks = tasks.filter(t => t.status === 'review');
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  // On-time completion
  const onTimeCompletion = completedTasks.filter(t => {
    return t.completedDate && t.dueDate && new Date(t.completedDate) <= new Date(t.dueDate);
  }).length;
  const onTimeRate = completedTasks.length > 0 ? (onTimeCompletion / completedTasks.length) * 100 : 0;

  // Estimation accuracy
  const estimationAccuracy = completedTasks.filter(t => {
    if (!t.estimatedHours || !t.actualHours) return false;
    const variance = Math.abs(t.actualHours - t.estimatedHours) / t.estimatedHours;
    return variance <= 0.2;
  }).length;
  const estimationRate = completedTasks.length > 0 ? (estimationAccuracy / completedTasks.length) * 100 : 0;

  // Project metrics
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const planningProjects = projects.filter(p => p.status === 'planning').length;
  const onHoldProjects = projects.filter(p => p.status === 'on-hold').length;

  // Task priority distribution
  const criticalTasks = tasks.filter(t => t.priority === 'critical').length;
  const highTasks = tasks.filter(t => t.priority === 'high').length;
  const mediumTasks = tasks.filter(t => t.priority === 'medium').length;
  const lowTasks = tasks.filter(t => t.priority === 'low').length;

  // Status distribution data for pie chart
  const statusData = [
    { name: 'To Do', value: todoTasks.length, color: '#94a3b8' },
    { name: 'In Progress', value: inProgressTasks.length, color: '#60a5fa' },
    { name: 'Review', value: reviewTasks.length, color: '#fbbf24' },
    { name: 'Done', value: completedTasks.length, color: '#34d399' }
  ].filter(d => d.value > 0);

  // Priority distribution data
  const priorityData = [
    { name: 'Critical', value: criticalTasks, color: '#ef4444' },
    { name: 'High', value: highTasks, color: '#f97316' },
    { name: 'Medium', value: mediumTasks, color: '#fbbf24' },
    { name: 'Low', value: lowTasks, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  // Project progress over time
  const progressData = projects.map(p => ({
    name: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
    progress: p.progress || 0,
    tasks: tasks.filter(t => t.projectId === p.id).length
  }));

  // Lean Six Sigma Metrics
  const cycleTime = tasks.filter(t => t.status === 'done').reduce((acc, t) => {
    if (t.createdAt && t.completedDate) {
      const start = new Date(t.createdAt);
      const end = new Date(t.completedDate);
      return acc + (end - start) / (1000 * 60 * 60 * 24);
    }
    return acc;
  }, 0) / Math.max(completedTasks.length, 1);

  const defectRate = reviewTasks.length / Math.max(totalTasks, 1) * 100;

  const processEfficiency = totalTasks > 0 ?
    ((completedTasks.length / totalTasks) * (onTimeRate / 100) * (estimationRate / 100)) * 100 : 0;

  // Fullscreen handlers
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto' : 'relative'}`}
    >
      {/* Floating Control Buttons */}
      <div className={`fixed ${isFullscreen ? 'top-6' : 'top-20'} right-6 z-40 flex flex-col gap-2`}>
        <button
          onClick={toggleFullscreen}
          className="p-3 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all shadow-lg"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-white" />
          ) : (
            <Maximize2 className="w-5 h-5 text-white" />
          )}
        </button>
        <button
          onClick={() => setIsFitToScreen(!isFitToScreen)}
          className={`p-3 backdrop-blur-xl ${isFitToScreen ? 'bg-blue-500/30' : 'bg-white/10'} hover:bg-white/20 border border-white/20 rounded-xl transition-all shadow-lg`}
          title={isFitToScreen ? "Expand View" : "Fit to Screen"}
        >
          <Maximize className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className={`${isFullscreen ? 'p-8 pt-6' : ''} ${isFitToScreen ? 'h-screen overflow-y-auto p-6 space-y-4' : 'space-y-6'}`}>
        {/* OVERALL PERFORMANCE METRICS */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white">Overall Performance</h2>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${isFitToScreen ? 'mb-4' : ''}`}>
            {/* Completion Rate */}
            <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <InfoTooltip
                  title="Task Completion Rate"
                  description="Measures the percentage of tasks that have been completed out of the total number of tasks."
                  calculation="(Completed Tasks / Total Tasks) × 100"
                  insights={[
                    "Healthy rate: 60-80% indicates good progress",
                    "Below 50% may indicate resource constraints"
                  ]}
                />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{completionRate.toFixed(1)}%</div>
              <p className="text-sm text-gray-400">Completion Rate</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                <span>{completedTasks.length} of {totalTasks} tasks</span>
              </div>
            </div>

            {/* On-Time Delivery */}
            <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <InfoTooltip
                  title="On-Time Delivery Rate"
                  description="Tracks the percentage of completed tasks that were finished before or on their due date."
                  calculation="(Tasks Completed On Time / Total Completed) × 100"
                  insights={[
                    "Industry standard: 80-90% is excellent",
                    "Consider adjusting estimates if consistently late"
                  ]}
                />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{onTimeRate.toFixed(1)}%</div>
              <p className="text-sm text-gray-400">On-Time Delivery</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-400">
                <span>{onTimeCompletion} on-time completions</span>
              </div>
            </div>

            {/* Estimation Accuracy */}
            <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <InfoTooltip
                  title="Estimation Accuracy"
                  description="Measures how accurately the team estimates task duration."
                  calculation="(Tasks Within ±20% / Total Completed) × 100"
                  insights={[
                    "±20% variance is considered accurate",
                    "Track patterns to refine estimation"
                  ]}
                />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{estimationRate.toFixed(1)}%</div>
              <p className="text-sm text-gray-400">Estimation Accuracy</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-purple-400">
                <span>Within 20% variance</span>
              </div>
            </div>

            {/* Process Efficiency */}
            <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <InfoTooltip
                  title="Overall Process Efficiency (OPE)"
                  description="Composite metric combining completion, on-time, and estimation."
                  calculation="(Completion % × On-Time % × Accuracy %) / 100"
                  insights={[
                    "World-class: 85%+ OPE score",
                    "Track monthly for trends"
                  ]}
                />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{processEfficiency.toFixed(1)}%</div>
              <p className="text-sm text-gray-400">Process Efficiency</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-orange-400">
                <span>OPE Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROJECT-BASED METRICS */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white">Project Metrics</h2>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${isFitToScreen ? 'mb-4' : ''}`}>
            <div className="relative z-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5">
              <div className="text-3xl font-bold text-blue-400 mb-1">{activeProjects}</div>
              <p className="text-sm text-gray-400">Active Projects</p>
            </div>
            <div className="relative z-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5">
              <div className="text-3xl font-bold text-green-400 mb-1">{completedProjects}</div>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
            <div className="relative z-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5">
              <div className="text-3xl font-bold text-yellow-400 mb-1">{planningProjects}</div>
              <p className="text-sm text-gray-400">In Planning</p>
            </div>
            <div className="relative z-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5">
              <div className="text-3xl font-bold text-gray-400 mb-1">{onHoldProjects}</div>
              <p className="text-sm text-gray-400">On Hold</p>
            </div>
          </div>
        </div>

        {/* TASK-BASED METRICS */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white">Task Metrics</h2>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${isFitToScreen ? 'mb-4' : ''}`}>
            <div className="relative z-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5">
              <div className="text-3xl font-bold text-gray-400 mb-1">{todoTasks.length}</div>
              <p className="text-sm text-gray-400">To Do</p>
            </div>
            <div className="relative z-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5">
              <div className="text-3xl font-bold text-blue-400 mb-1">{inProgressTasks.length}</div>
              <p className="text-sm text-gray-400">In Progress</p>
            </div>
            <div className="relative z-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5">
              <div className="text-3xl font-bold text-yellow-400 mb-1">{reviewTasks.length}</div>
              <p className="text-sm text-gray-400">In Review</p>
            </div>
            <div className="relative z-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-5">
              <div className="text-3xl font-bold text-green-400 mb-1">{completedTasks.length}</div>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        {!isFitToScreen && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Status Distribution */}
              <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Task Status Distribution</h3>
                    <p className="text-sm text-gray-400 mt-1">Current workflow state</p>
                  </div>
                  <InfoTooltip
                    title="Task Status Distribution"
                    description="Visual breakdown of tasks across different workflow stages."
                    calculation="COUNT(Tasks) GROUP BY status"
                    insights={[
                      "High 'Review' count may indicate bottleneck",
                      "Track trend to identify improvements"
                    ]}
                  />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Status Breakdown Bars */}
                <div className="mt-6 space-y-3">
                  {['todo', 'in-progress', 'review', 'done'].map(status => {
                    const statusLabels = {
                      'todo': 'To Do',
                      'in-progress': 'In Progress',
                      'review': 'Review',
                      'done': 'Done'
                    };
                    const count = tasks.filter(t => t.status === status).length;
                    const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                    const colors = {
                      'todo': 'bg-gray-500',
                      'in-progress': 'bg-blue-500',
                      'review': 'bg-yellow-500',
                      'done': 'bg-green-500'
                    };

                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-300 capitalize">{statusLabels[status]}</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[status]} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Distribution */}
              <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Task Priority Distribution</h3>
                    <p className="text-sm text-gray-400 mt-1">Risk and urgency analysis</p>
                  </div>
                  <InfoTooltip
                    title="Task Priority Distribution"
                    description="Shows distribution of task priorities for resource allocation."
                    calculation="COUNT(Tasks) GROUP BY priority"
                    insights={[
                      "Balance priorities for sustainable pace",
                      "Use for capacity planning"
                    ]}
                  />
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Priority Breakdown Bars */}
                <div className="mt-6 space-y-3">
                  {['critical', 'high', 'medium', 'low'].map(priority => {
                    const count = tasks.filter(t => t.priority === priority).length;
                    const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                    const colors = {
                      'critical': 'bg-red-500',
                      'high': 'bg-orange-500',
                      'medium': 'bg-yellow-500',
                      'low': 'bg-blue-500'
                    };

                    return (
                      <div key={priority}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-300 capitalize">{priority}</span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[priority]} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Project Progress Chart */}
            <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Project Progress Overview</h3>
                  <p className="text-sm text-gray-400 mt-1">Completion status across all projects</p>
                </div>
                <InfoTooltip
                  title="Project Progress Overview"
                  description="Tracks progress percentage for each project."
                  calculation="(Σ Task Completion % / Total Tasks) per project"
                  insights={[
                    "Identify projects needing attention",
                    "Compare velocity across initiatives"
                  ]}
                />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="progress"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorProgress)"
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Lean Six Sigma Metrics */}
            <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Lean Six Sigma Process Metrics</h3>
                  <p className="text-sm text-gray-400 mt-1">Continuous improvement indicators</p>
                </div>
                <InfoTooltip
                  title="Lean Six Sigma Metrics"
                  description="Advanced process metrics based on Lean Six Sigma methodology."
                  calculation="Various statistical process control calculations"
                  insights={[
                    "DMAIC: Define, Measure, Analyze, Improve, Control",
                    "Focus on reducing variation and waste",
                    "Data-driven decision making"
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cycle Time */}
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <InfoTooltip
                      title="Average Cycle Time"
                      description="Average time from task creation to completion."
                      calculation="Σ(Completion - Creation Date) / Total Completed"
                      insights={[
                        "Lower is better - faster delivery",
                        "Target: Reduce by 10-20% quarterly"
                      ]}
                    />
                  </div>
                  <div className="text-2xl font-bold text-white">{cycleTime.toFixed(1)} days</div>
                  <p className="text-xs text-gray-400 mt-1">Average Cycle Time</p>
                </div>

                {/* Defect Rate */}
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <InfoTooltip
                      title="Defect Rate (In Review)"
                      description="Percentage of tasks requiring review/rework."
                      calculation="(Tasks in Review / Total Tasks) × 100"
                      insights={[
                        "Target: Below 5% for Six Sigma quality",
                        "Review root causes for improvement"
                      ]}
                    />
                  </div>
                  <div className="text-2xl font-bold text-white">{defectRate.toFixed(1)}%</div>
                  <p className="text-xs text-gray-400 mt-1">Defect Rate</p>
                </div>

                {/* Process Efficiency */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <InfoTooltip
                      title="Overall Process Efficiency"
                      description="Composite metric combining all performance factors."
                      calculation="(Completion % × On-Time % × Accuracy %) / 100"
                      insights={[
                        "World-class: 85%+ OPE score",
                        "Balanced scorecard approach"
                      ]}
                    />
                  </div>
                  <div className="text-2xl font-bold text-white">{processEfficiency.toFixed(1)}%</div>
                  <p className="text-xs text-gray-400 mt-1">Process Efficiency</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
