<script setup lang="ts">
// AuthWorkspaceIllustration.vue - A premium interactive workspace illustration rendered in CSS/HTML
</script>

<template>
  <div class="workspace-canvas select-none">
    <!-- Monitor Stand -->
    <div class="monitor-stand-neck" />
    <div class="monitor-stand-base" />

    <!-- Monitor Screen -->
    <div class="monitor-screen-wrapper">
      <div class="monitor-screen">
        <!-- Sidebar -->
        <div class="monitor-sidebar">
          <div class="monitor-sidebar-logo">
            <UIcon name="i-lucide-sparkles" class="w-2.5 h-2.5" />
          </div>
          <div class="monitor-sidebar-item active">
            <UIcon name="i-lucide-house" class="w-2 h-2" />
          </div>
          <div class="monitor-sidebar-item">
            <UIcon name="i-lucide-calendar" class="w-2 h-2" />
          </div>
          <div class="monitor-sidebar-item">
            <UIcon name="i-lucide-check-square" class="w-2 h-2" />
          </div>
          <div class="monitor-sidebar-item">
            <UIcon name="i-lucide-bar-chart-3" class="w-2 h-2" />
          </div>
          <div class="monitor-sidebar-item">
            <UIcon name="i-lucide-settings" class="w-2 h-2" />
          </div>
        </div>

        <!-- Main Content -->
        <div class="monitor-content">
          <!-- Header -->
          <div class="monitor-header">
            <div>
              <h4 class="monitor-greeting">Good morning, Alex! 👋</h4>
              <p class="monitor-subgreeting">Here's your plan for today.</p>
            </div>
            <div class="monitor-header-actions">
              <span class="monitor-pill-btn">View <UIcon name="i-lucide-chevron-down" class="w-1 h-1 inline ml-0.5" /></span>
            </div>
          </div>

          <!-- Dashboard Grid -->
          <div class="monitor-grid">
            <!-- Schedule Column -->
            <div class="monitor-schedule">
              <div class="monitor-schedule-header">
                <span class="monitor-schedule-title">Today's Schedule</span>
                <span class="monitor-schedule-date">May 20, Tuesday</span>
              </div>
              <div class="monitor-schedule-list">
                <!-- 9 AM -->
                <div class="schedule-row">
                  <span class="schedule-time">9 AM</span>
                  <div class="schedule-pill schedule-pill-purple">
                    <span class="pill-title">Calculus</span>
                    <span class="pill-desc">Integrals & Applications</span>
                  </div>
                </div>
                <!-- 10 AM -->
                <div class="schedule-row">
                  <span class="schedule-time">10 AM</span>
                  <div class="schedule-pill schedule-pill-blue">
                    <span class="pill-title">Physics</span>
                    <span class="pill-desc">Thermodynamics</span>
                  </div>
                </div>
                <!-- 12 PM -->
                <div class="schedule-row">
                  <span class="schedule-time">12 PM</span>
                  <div class="schedule-pill schedule-pill-yellow">
                    <span class="pill-title font-semibold">Break</span>
                    <span class="pill-desc">Lunch & Relax</span>
                  </div>
                </div>
                <!-- 2 PM -->
                <div class="schedule-row">
                  <span class="schedule-time">2 PM</span>
                  <div class="schedule-pill schedule-pill-green">
                    <span class="pill-title">Chemistry</span>
                    <span class="pill-desc">Organic Reactions</span>
                  </div>
                </div>
                <!-- 3 PM -->
                <div class="schedule-row">
                  <span class="schedule-time">3 PM</span>
                  <div class="schedule-pill schedule-pill-purple">
                    <span class="pill-title">Focus Session</span>
                    <span class="pill-desc">Problem Solving</span>
                  </div>
                </div>
                <!-- 5 PM -->
                <div class="schedule-row">
                  <span class="schedule-time">5 PM</span>
                  <div class="schedule-pill schedule-pill-blue">
                    <span class="pill-title">Review & Notes</span>
                    <span class="pill-desc font-normal">Wrap up</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column Cards -->
            <div class="monitor-cards">
              <!-- AI Suggestion -->
              <div class="monitor-card ai-suggestion-card">
                <span class="ai-suggestion-title">
                  <UIcon name="i-lucide-sparkles" class="w-1.5 h-1.5 text-indigo-500 mr-0.5 shrink-0" />
                  AI Suggestion
                </span>
                <p class="ai-suggestion-text">You perform best in the morning. Focus on deep work until 12 PM.</p>
                <button type="button" class="ai-suggestion-btn">Apply Suggestion</button>
              </div>

              <!-- Daily Progress -->
              <div class="monitor-card progress-card">
                <span class="progress-title">Daily Progress</span>
                <div class="radial-gauge-container">
                  <svg viewBox="0 0 36 36" class="circular-chart">
                    <path class="circle-bg"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path class="circle"
                      stroke-dasharray="76, 100"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div class="radial-gauge-text">
                    <span class="percentage">76%</span>
                    <span class="subtext">Completed</span>
                  </div>
                </div>
                <span class="progress-stat">6 of 8 tasks done</span>
                
                <!-- Tiny Bar Chart -->
                <div class="mini-bar-chart">
                  <div class="bar-col"><div class="bar-fill" style="height: 40%"></div><span class="bar-lbl">M</span></div>
                  <div class="bar-col"><div class="bar-fill" style="height: 65%"></div><span class="bar-lbl">T</span></div>
                  <div class="bar-col"><div class="bar-fill active" style="height: 76%"></div><span class="bar-lbl active">W</span></div>
                  <div class="bar-col"><div class="bar-fill" style="height: 50%"></div><span class="bar-lbl">T</span></div>
                  <div class="bar-col"><div class="bar-fill" style="height: 85%"></div><span class="bar-lbl">F</span></div>
                  <div class="bar-col"><div class="bar-fill" style="height: 30%"></div><span class="bar-lbl">S</span></div>
                  <div class="bar-col"><div class="bar-fill" style="height: 20%"></div><span class="bar-lbl">S</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating AI Study Plan Card -->
    <div class="floating-plan-card">
      <div class="plan-card-header">
        <span class="plan-card-icon">
          <UIcon name="i-lucide-sparkles" class="w-2 h-2 text-purple-600" />
        </span>
        <span class="plan-card-title">AI Study Plan</span>
      </div>
      <p class="plan-card-desc">Exam in 14 days. We generated a plan tailored for you.</p>
      
      <div class="plan-card-checklist">
        <label class="checklist-item checked">
          <span class="checkbox-box"><UIcon name="i-lucide-check" class="w-1.5 h-1.5" /></span>
          <span>Mathematics</span>
        </label>
        <label class="checklist-item checked">
          <span class="checkbox-box"><UIcon name="i-lucide-check" class="w-1.5 h-1.5" /></span>
          <span>Physics</span>
        </label>
        <label class="checklist-item checked">
          <span class="checkbox-box"><UIcon name="i-lucide-check" class="w-1.5 h-1.5" /></span>
          <span>Chemistry</span>
        </label>
        <label class="checklist-item">
          <span class="checkbox-box"></span>
          <span>English Literature</span>
        </label>
      </div>

      <button type="button" class="plan-card-btn">View Full Plan</button>
    </div>

    <!-- Stack of Books -->
    <div class="books-stack">
      <!-- Calculus Book (Top) -->
      <div class="book-spine book-purple hover-lift">
        <span class="book-title">CALCULUS</span>
      </div>
      <!-- Physics Book (Middle) -->
      <div class="book-spine book-blue hover-lift">
        <span class="book-title">PHYSICS</span>
      </div>
      <!-- Chemistry Book (Bottom) -->
      <div class="book-spine book-navy hover-lift">
        <span class="book-title">CHEMISTRY</span>
      </div>
    </div>

    <!-- Stylus / Pen -->
    <div class="workspace-stylus" />

    <!-- Tablet / Notebook -->
    <div class="workspace-tablet">
      <div class="tablet-screen">
        <div class="tablet-header">Study Notes</div>
        <div class="tablet-canvas">
          <!-- Graph vector paths -->
          <svg viewBox="0 0 100 60" class="tablet-svg">
            <line x1="10" y1="50" x2="90" y2="50" stroke="#cbd5e1" stroke-width="0.75" />
            <line x1="10" y1="10" x2="10" y2="50" stroke="#cbd5e1" stroke-width="0.75" />
            <path d="M 10 45 Q 30 15 50 35 T 90 10" fill="none" stroke="#6366f1" stroke-width="1.2" stroke-linecap="round" />
            <circle cx="50" cy="35" r="1.5" fill="#f43f5e" />
            <text x="55" y="38" font-size="4" fill="#94a3b8" font-family="sans-serif">f(x)</text>
          </svg>
        </div>
      </div>
    </div>

    <!-- Glass Cup / Mug -->
    <div class="glass-mug">
      <div class="mug-handle" />
      <div class="mug-content">
        <span class="mug-text">FOCUS</span>
        <span class="mug-text">PLAN</span>
        <span class="mug-text">ACHIEVE</span>
      </div>
    </div>

    <!-- Small Plant -->
    <div class="plant-pot">
      <!-- Leaf SVGs -->
      <svg viewBox="0 0 40 50" class="plant-leaves">
        <path d="M 20 35 Q 20 15 5 12 Q 15 25 20 35" fill="#10b981" />
        <path d="M 20 35 Q 18 10 12 5 Q 22 18 20 35" fill="#059669" />
        <path d="M 20 35 Q 22 5 28 4 Q 24 18 20 35" fill="#10b981" />
        <path d="M 20 35 Q 25 15 35 15 Q 25 27 20 35" fill="#34d399" />
        <path d="M 20 35 Q 20 20 20 8 Q 23 21 20 35" fill="#047857" />
      </svg>
      <div class="pot-body" />
    </div>
  </div>
</template>

<style scoped>
.workspace-canvas {
  position: relative;
  width: 100%;
  max-width: 580px;
  height: 480px;
  margin: 0 auto;
}

/* Monitor Stand */
.monitor-stand-neck {
  position: absolute;
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 80px;
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 4px;
  z-index: 1;
}

.monitor-stand-base {
  position: absolute;
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: 130px;
  height: 10px;
  background: linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%);
  border-radius: 12px 12px 6px 6px;
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.08);
  z-index: 1;
}

/* Monitor Screen */
.monitor-screen-wrapper {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 86%;
  height: 64%;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
  border: 1.5px solid #e2e8f0;
  z-index: 2;
  transition: transform var(--transition-normal);
}

.monitor-screen-wrapper:hover {
  transform: translateX(-50%) translateY(-2px);
}

.monitor-screen {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
}

/* Sidebar */
.monitor-sidebar {
  width: 13%;
  background: #0f172a;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 8px;
  flex-shrink: 0;
}

.monitor-sidebar-logo {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 4px;
}

.monitor-sidebar-item {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.monitor-sidebar-item.active,
.monitor-sidebar-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* Screen Content */
.monitor-content {
  flex: 1;
  height: 100%;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.monitor-greeting {
  font-size: 8.5px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.monitor-subgreeting {
  font-size: 5.5px;
  color: #64748b;
  margin-top: 1.5px;
}

.monitor-pill-btn {
  font-size: 5px;
  padding: 1.5px 4px;
  background: white;
  border: 0.5px solid #e2e8f0;
  border-radius: 4px;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

/* Dashboard Grid */
.monitor-grid {
  display: flex;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

/* Schedule */
.monitor-schedule {
  flex: 1.7;
  background: white;
  border-radius: 8px;
  padding: 6px;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.01);
}

.monitor-schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 0.5px solid #f1f5f9;
  padding-bottom: 3px;
  margin-bottom: 4px;
}

.monitor-schedule-title {
  font-size: 6.5px;
  font-weight: 800;
  color: #1e293b;
}

.monitor-schedule-date {
  font-size: 4.5px;
  color: #94a3b8;
}

.monitor-schedule-list {
  display: flex;
  flex-direction: column;
  gap: 3.5px;
  overflow-y: auto;
  flex: 1;
  padding-right: 2px;
}

.schedule-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.schedule-time {
  font-size: 4.5px;
  color: #94a3b8;
  width: 14px;
  text-align: right;
  font-weight: 600;
}

.schedule-pill {
  flex: 1;
  border-radius: 4px;
  padding: 2.5px 4.5px;
  display: flex;
  flex-direction: column;
}

.pill-title {
  font-size: 5px;
  font-weight: 700;
  line-height: 1;
}

.pill-desc {
  font-size: 4px;
  color: #64748b;
  margin-top: 1px;
}

.schedule-pill-purple {
  background: #f5f3ff;
  border-left: 2px solid #8b5cf6;
  color: #6d28d9;
}
.schedule-pill-purple .pill-desc { color: #8b5cf6; }

.schedule-pill-blue {
  background: #eff6ff;
  border-left: 2px solid #3b82f6;
  color: #1d4ed8;
}
.schedule-pill-blue .pill-desc { color: #3b82f6; }

.schedule-pill-yellow {
  background: #fffbeb;
  border-left: 2px solid #f59e0b;
  color: #b45309;
}
.schedule-pill-yellow .pill-desc { color: #d97706; }

.schedule-pill-green {
  background: #ecfdf5;
  border-left: 2px solid #10b981;
  color: #047857;
}
.schedule-pill-green .pill-desc { color: #10b981; }

/* Right Cards */
.monitor-cards {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.monitor-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 5px 6px;
  display: flex;
  flex-direction: column;
}

.ai-suggestion-card {
  background: #f5f3ff;
  border: 1px solid #ede9fe;
}

.ai-suggestion-title {
  font-size: 5.5px;
  font-weight: 800;
  color: #6d28d9;
  display: flex;
  align-items: center;
}

.ai-suggestion-text {
  font-size: 4.5px;
  color: #4c1d95;
  margin-top: 1.5px;
  line-height: 1.3;
}

.ai-suggestion-btn {
  background: #8b5cf6;
  color: white;
  border-radius: 4px;
  font-size: 4.5px;
  padding: 1.5px 0;
  font-weight: 700;
  margin-top: 3px;
  width: 100%;
  text-align: center;
}

.progress-title {
  font-size: 5.5px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 2px;
}

.radial-gauge-container {
  position: relative;
  width: 32px;
  height: 32px;
  margin: 1px auto;
}

.circular-chart {
  display: block;
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: #f1f5f9;
  stroke-width: 3.5;
}

.circle {
  fill: none;
  stroke-linecap: round;
  stroke-width: 3.5;
  stroke: #4f46e5;
}

.radial-gauge-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.percentage {
  font-size: 6.5px;
  font-weight: 800;
  color: #0f172a;
}

.radial-gauge-text .subtext {
  font-size: 2px;
  color: #94a3b8;
  text-transform: uppercase;
  margin-top: 0.5px;
}

.progress-stat {
  font-size: 4px;
  color: #64748b;
  text-align: center;
  margin-top: 1.5px;
}

.mini-bar-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 14px;
  margin-top: 3px;
  gap: 1px;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-fill {
  width: 3px;
  background: #cbd5e1;
  border-radius: 1px 1px 0 0;
}

.bar-fill.active {
  background: #4f46e5;
}

.bar-lbl {
  font-size: 3px;
  color: #94a3b8;
  margin-top: 1px;
  font-weight: 600;
}

.bar-lbl.active {
  color: #4f46e5;
  font-weight: 800;
}

/* Floating Plan Card */
.floating-plan-card {
  position: absolute;
  bottom: 6%;
  left: -2%;
  width: 172px;
  background: white;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  border: 1px solid #f1f5f9;
  z-index: 10;
  transition: transform var(--transition-normal);
}

.floating-plan-card:hover {
  transform: translateY(-2px);
}

.plan-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.plan-card-icon {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: #f5f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plan-card-title {
  font-size: 9px;
  font-weight: 800;
  color: #1e293b;
}

.plan-card-desc {
  font-size: 6.5px;
  color: #64748b;
  line-height: 1.3;
  margin-bottom: 6px;
}

.plan-card-checklist {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 7px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 7px;
  color: #475569;
}

.checkbox-box {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  border: 0.5px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.checklist-item.checked {
  color: #0f172a;
  font-weight: 600;
}

.checklist-item.checked .checkbox-box {
  background: #4f46e5;
  border-color: #4f46e5;
  color: white;
}

.plan-card-btn {
  width: 100%;
  background: #f5f3ff;
  color: #6366f1;
  border-radius: 6px;
  font-size: 7px;
  padding: 3px 0;
  font-weight: 700;
  text-align: center;
  transition: background var(--transition-fast);
}

.plan-card-btn:hover {
  background: #ede9fe;
}

/* Books Stack */
.books-stack {
  position: absolute;
  bottom: 0%;
  left: 2%;
  display: flex;
  flex-direction: column-reverse;
  z-index: 5;
}

.book-spine {
  width: 105px;
  height: 17px;
  border-radius: 2px 4px 4px 2px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding-left: 8px;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.book-spine:not(:first-child) {
  margin-bottom: -5px;
}

.book-title {
  color: white;
  font-size: 5.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

.book-purple {
  background: linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%);
  border-bottom: 2px solid #5b21b6;
}

.book-blue {
  background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%);
  border-bottom: 2px solid #1e40af;
}

.book-navy {
  background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%);
  border-bottom: 2px solid #020617;
}

.hover-lift:hover {
  transform: translateY(-2px) rotate(1deg);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  z-index: 30;
}

/* Stylus */
.workspace-stylus {
  position: absolute;
  bottom: 4%;
  left: 30%;
  width: 55px;
  height: 2px;
  background: #f1f5f9;
  border: 0.5px solid #cbd5e1;
  border-radius: 9999px;
  transform: rotate(20deg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  z-index: 4;
}

/* Tablet */
.workspace-tablet {
  position: absolute;
  bottom: -4%;
  left: 36%;
  width: 120px;
  height: 85px;
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 10px;
  padding: 3px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
  transform: rotate(-4deg);
  z-index: 5;
  transition: transform var(--transition-normal);
}

.workspace-tablet:hover {
  transform: rotate(-2deg) translateY(-1px);
}

.tablet-screen {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  padding: 4px;
  display: flex;
  flex-direction: column;
}

.tablet-header {
  font-size: 5px;
  font-weight: 800;
  color: #94a3b8;
  margin-bottom: 2px;
}

.tablet-canvas {
  flex: 1;
  position: relative;
}

.tablet-svg {
  width: 100%;
  height: 100%;
}

/* Glass Mug */
.glass-mug {
  position: absolute;
  bottom: 0%;
  right: 21%;
  width: 32px;
  height: 38px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 6px 6px 4px 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  z-index: 6;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5px;
  backdrop-filter: blur(2px);
}

.mug-handle {
  position: absolute;
  top: 6px;
  right: -7px;
  width: 8px;
  height: 20px;
  border: 1.5px solid rgba(124, 58, 237, 0.25);
  border-left: 0;
  border-radius: 0 6px 6px 0;
}

.mug-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.mug-text {
  color: #7c3aed;
  font-size: 4px;
  font-weight: 800;
  letter-spacing: 0.2px;
}

/* Plant */
.plant-pot {
  position: absolute;
  bottom: 8%;
  right: 3%;
  width: 44px;
  height: 55px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  z-index: 6;
}

.plant-leaves {
  width: 34px;
  height: 38px;
  margin-bottom: -4px;
}

.pot-body {
  width: 20px;
  height: 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  border: 1px solid #cbd5e1;
  border-radius: 2px 2px 6px 6px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.05);
}

@media (max-width: 1280px) {
  .workspace-canvas {
    transform: scale(0.95);
  }
}

@media (max-width: 1024px) {
  .workspace-canvas {
    transform: scale(0.9);
    height: 400px;
  }
}
</style>
