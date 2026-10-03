<template>
  <div class="teacher-view page-grid">
    <!-- 顶部概览 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon" style="background: var(--brand-gradient)">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">班级学生数</p>
          <p class="card-value">{{ classData.studentCount }} <span class="unit">人</span></p>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg,#3b82f6,#60a5fa)">
          <el-icon :size="24"><TrendCharts /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">平均正确率</p>
          <p class="card-value">{{ classData.avgCorrectRate }} <span class="unit">%</span></p>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon" style="background: var(--sunset-gradient)">
          <el-icon :size="24"><Clock /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">人均学习时长</p>
          <p class="card-value">{{ classData.avgStudyTime }} <span class="unit">h/周</span></p>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon" style="background: var(--success-gradient)">
          <el-icon :size="24"><Odometer /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">课程进度</p>
          <p class="card-value">{{ classData.progress }} <span class="unit">%</span></p>
        </div>
      </div>
    </div>

    <!-- 教师工作台 -->
    <div class="card workbench-card">
      <el-tabs v-model="activeTab" class="teacher-tabs">
        <!-- ============ 班级总览 ============ -->
        <el-tab-pane label="班级总览" name="overview">
          <div class="tab-content">
            <div class="content-row">
              <div class="sub-card">
                <div class="sub-title">
                  <el-icon class="icon"><Histogram /></el-icon>
                  知识点掌握分布
                  <el-tooltip content="班级各知识点平均掌握度，越低越需重点关注" placement="top">
                    <el-icon class="help"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </div>
                <div ref="heatmapChartRef" class="chart-box"></div>
              </div>
              <div class="sub-card">
                <div class="sub-title">
                  <el-icon class="icon"><DataLine /></el-icon>
                  学生成绩分布
                </div>
                <div ref="distChartRef" class="chart-box"></div>
              </div>
            </div>

            <div class="sub-card">
              <div class="sub-title">
                <el-icon class="icon" style="color:var(--warning-color)"><MagicStick /></el-icon>
                AI 教学建议
                <el-button
                  type="primary"
                  link
                  size="small"
                  style="margin-left:auto"
                  :loading="isRefreshing"
                  @click="refreshSuggestions"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新建议
                </el-button>
              </div>
              <div class="suggestion-list">
                <div
                  v-for="(s, index) in classData.teachingSuggestions"
                  :key="index"
                  class="suggestion-item"
                >
                  <div class="suggestion-icon" :style="{ background: getSuggestionColor(index) }">
                    <el-icon><component :is="getSuggestionIcon(index)" /></el-icon>
                  </div>
                  <p class="suggestion-text">{{ s }}</p>
                  <el-button type="primary" link size="small" @click="applySuggestion(index)">采纳</el-button>
                </div>
              </div>
            </div>

            <div class="sub-card">
              <div class="sub-title">
                <el-icon class="icon" style="color:var(--danger-color)"><Bell /></el-icon>
                需关注学生
                <el-tag type="danger" effect="light" size="small" style="margin-left:auto">
                  {{ atRiskStudents.length }} 人
                </el-tag>
              </div>
              <el-table :data="atRiskStudents" size="small" class="risk-table">
                <el-table-column label="学生" width="120">
                  <template #default="{ row }">
                    <div class="student-cell">
                      <el-avatar :size="28" class="mini-avatar">{{ row.name.charAt(0) }}</el-avatar>
                      <span>{{ row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="score" label="综合分" width="90" />
                <el-table-column label="排名" width="80">
                  <template #default="{ row }">第 {{ row.rank }} 名</template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getRiskType(row.risk)" size="small" effect="light">
                      {{ getRiskText(row.risk) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="viewStudent(row)">查看</el-button>
                    <el-button type="warning" link size="small" @click="sendReminder(row)">提醒</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- ============ 学生管理 ============ -->
        <el-tab-pane label="学生管理" name="students">
          <div class="tab-content">
            <div class="toolbar">
              <el-input
                v-model="studentSearch"
                placeholder="搜索学生姓名 / 学号"
                style="width: 240px"
                clearable
                :prefix-icon="Search"
              />
              <el-select v-model="studentFilter" style="width: 150px">
                <el-option label="全部学生" value="all" />
                <el-option label="优秀（85+）" value="excellent" />
                <el-option label="良好（70-85）" value="good" />
                <el-option label="待提升（<70）" value="weak" />
              </el-select>
              <div class="toolbar-right">
                <el-button @click="sendReminderAll">
                  <el-icon><Bell /></el-icon>
                  批量提醒
                </el-button>
                <el-button type="primary" @click="generateReport">
                  <el-icon><Document /></el-icon>
                  生成班级报告
                </el-button>
              </div>
            </div>

            <el-table :data="filteredStudents" class="student-table" stripe>
              <el-table-column label="学生" min-width="140">
                <template #default="{ row }">
                  <div class="student-cell">
                    <el-avatar :size="32" class="mini-avatar">{{ row.name.charAt(0) }}</el-avatar>
                    <div>
                      <div class="sc-name">{{ row.name }}</div>
                      <div class="sc-id">学号 20240100{{ row.id }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="综合分" width="120">
                <template #default="{ row }">
                  <div class="score-cell">
                    <span class="score-num" :style="{ color: getScoreColor(row.score) }">{{ row.score }}</span>
                    <el-progress
                      :percentage="row.score"
                      :show-text="false"
                      :stroke-width="6"
                      :color="getScoreColor(row.score)"
                      style="flex:1"
                    />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="排名" width="90">
                <template #default="{ row }">第 {{ row.rank }} 名</template>
              </el-table-column>
              <el-table-column label="趋势" width="90">
                <template #default="{ row }">
                  <span class="trend-tag" :class="row.trend">
                    <el-icon v-if="row.trend === 'up'"><Top /></el-icon>
                    <el-icon v-else-if="row.trend === 'down'"><Bottom /></el-icon>
                    <el-icon v-else><Minus /></el-icon>
                    {{ row.trend === 'up' ? '上升' : row.trend === 'down' ? '下降' : '平稳' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="风险" width="100">
                <template #default="{ row }">
                  <el-tag :type="getRiskType(row.risk)" size="small" effect="light">
                    {{ getRiskText(row.risk) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="170" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="viewStudent(row)">学情</el-button>
                  <el-button type="success" link size="small" @click="openMessageDialog(row)">消息</el-button>
                  <el-button type="warning" link size="small" @click="sendReminder(row)">提醒</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- ============ 作业批改 ============ -->
        <el-tab-pane label="作业批改" name="homework">
          <div class="tab-content">
            <div class="toolbar">
              <div class="hw-title">
                <el-icon><Notebook /></el-icon>
                待批改作业 <el-badge :value="pendingHomework.length" type="danger" />
              </div>
              <div class="toolbar-right">
                <el-button @click="batchReview" :loading="isBatchReviewing">
                  <el-icon><MagicStick /></el-icon>
                  AI 批量批改
                </el-button>
                <el-button type="primary" @click="openHomeworkDialog">
                  <el-icon><Plus /></el-icon>
                  布置作业
                </el-button>
              </div>
            </div>

            <div class="homework-grid">
              <div class="hw-card" v-for="hw in homeworkList" :key="hw.id">
                <div class="hw-head">
                  <div class="hw-icon" :style="{ background: hw.bg }">
                    <el-icon :size="20"><Document /></el-icon>
                  </div>
                  <div class="hw-info">
                    <h4>{{ hw.title }}</h4>
                    <p>{{ hw.knowledge }} · 截止 {{ hw.deadline }}</p>
                  </div>
                  <el-tag :type="hw.statusType" effect="light" size="small">{{ hw.statusText }}</el-tag>
                </div>
                <div class="hw-stats">
                  <div class="hw-stat">
                    <span class="stat-num">{{ hw.submitted }}</span>
                    <span class="stat-label">已交</span>
                  </div>
                  <div class="hw-stat">
                    <span class="stat-num" style="color:#f59e0b">{{ hw.pending }}</span>
                    <span class="stat-label">待批</span>
                  </div>
                  <div class="hw-stat">
                    <span class="stat-num" :style="{ color: getScoreColor(hw.avgScore) }">{{ hw.avgScore }}</span>
                    <span class="stat-label">平均分</span>
                  </div>
                </div>
                <el-progress :percentage="hw.reviewProgress" :stroke-width="8" :color="getScoreColor(100)" />
                <div class="hw-foot">
                  <span class="hw-progress-text">批改进度 {{ hw.reviewed }}/{{ hw.submitted }}</span>
                  <el-button type="primary" link size="small" @click="openReviewDialog(hw)">去批改</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- ============ 教学效果分析 ============ -->
        <el-tab-pane label="教学效果分析" name="analysis">
          <div class="tab-content">
            <div class="content-row">
              <div class="sub-card">
                <div class="sub-title">
                  <el-icon class="icon"><TrendCharts /></el-icon>
                  班级成绩趋势
                  <el-select v-model="trendRange" size="small" style="width:120px;margin-left:auto">
                    <el-option label="近 4 周" value="4" />
                    <el-option label="近 8 周" value="8" />
                  </el-select>
                </div>
                <div ref="trendChartRef" class="chart-box"></div>
              </div>
              <div class="sub-card">
                <div class="sub-title">
                  <el-icon class="icon"><Aim /></el-icon>
                  五维能力分布
                </div>
                <div ref="abilityRadarRef" class="chart-box"></div>
              </div>
            </div>
            <div class="content-row">
              <div class="sub-card">
                <div class="sub-title">
                  <el-icon class="icon"><PieChart /></el-icon>
                  学习活跃度构成
                </div>
                <div ref="activityChartRef" class="chart-box"></div>
              </div>
              <div class="sub-card">
                <div class="sub-title">
                  <el-icon class="icon" style="color:var(--success-gradient)"><Medal /></el-icon>
                  教学成果指标
                </div>
                <div class="kpi-grid">
                  <div class="kpi-item" v-for="kpi in kpis" :key="kpi.label">
                    <div class="kpi-ring" :style="{ '--pct': kpi.pct + '%', '--clr': kpi.color }">
                      <span>{{ kpi.value }}</span>
                    </div>
                    <p class="kpi-label">{{ kpi.label }}</p>
                    <p class="kpi-trend" :class="kpi.trend > 0 ? 'up' : 'down'">
                      {{ kpi.trend > 0 ? '↑' : '↓' }} {{ Math.abs(kpi.trend) }}% 环比
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- ============ 资源管理 ============ -->
        <el-tab-pane label="资源管理" name="resources">
          <div class="tab-content">
            <div class="toolbar">
              <el-radio-group v-model="resourceType" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="doc">课件文档</el-radio-button>
                <el-radio-button label="video">视频微课</el-radio-button>
                <el-radio-button label="code">代码案例</el-radio-button>
                <el-radio-button label="exam">试题库</el-radio-button>
              </el-radio-group>
              <div class="toolbar-right">
                <el-button type="primary" @click="uploadResource">
                  <el-icon><Upload /></el-icon>
                  上传资源
                </el-button>
              </div>
            </div>

            <div class="resource-grid">
              <div class="resource-card" v-for="res in filteredResources" :key="res.id">
                <div class="res-preview" :style="{ background: res.bg }">
                  <el-icon :size="30"><component :is="res.icon" /></el-icon>
                  <span class="res-type">{{ res.typeText }}</span>
                </div>
                <div class="res-body">
                  <h4>{{ res.name }}</h4>
                  <p>{{ res.desc }}</p>
                  <div class="res-meta">
                    <span><el-icon><View /></el-icon>{{ res.views }}</span>
                    <span><el-icon><Download /></el-icon>{{ res.downloads }}</span>
                    <span><el-icon><Star /></el-icon>{{ res.stars }}</span>
                  </div>
                </div>
                <div class="res-footer">
                  <span class="res-time">{{ res.time }}</span>
                  <div>
                    <el-tooltip content="预览" placement="top">
                      <el-icon class="res-act" @click="previewResource(res)"><View /></el-icon>
                    </el-tooltip>
                    <el-tooltip content="下载" placement="top">
                      <el-icon class="res-act" @click="previewResource(res)"><Download /></el-icon>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <el-icon class="res-act danger" @click="deleteResource(res)"><Delete /></el-icon>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- ====== 学生学情详情对话框 ====== -->
    <el-dialog v-model="studentDialogVisible" width="600px">
      <template #header>
        <div class="dialog-header">
          <div class="header-icon"><el-icon :size="22"><User /></el-icon></div>
          <div class="header-text">
            <h3>{{ selectedStudent?.name }} · 学情详情</h3>
            <p>学号 20240100{{ selectedStudent?.id }}</p>
          </div>
        </div>
      </template>
      <div v-if="selectedStudent" class="student-detail">
        <div class="detail-overview">
          <div class="do-item">
            <span class="do-value" :style="{ color: getScoreColor(selectedStudent.score) }">{{ selectedStudent.score }}</span>
            <span class="do-label">综合分</span>
          </div>
          <div class="do-item">
            <span class="do-value">{{ selectedStudent.rank }}</span>
            <span class="do-label">班级排名</span>
          </div>
          <div class="do-item">
            <span class="do-value">{{ selectedStudent.trend === 'up' ? '上升' : selectedStudent.trend === 'down' ? '下降' : '平稳' }}</span>
            <span class="do-label">成绩趋势</span>
          </div>
          <div class="do-item">
            <el-tag :type="getRiskType(selectedStudent.risk)" effect="dark" size="large">
              {{ getRiskText(selectedStudent.risk) }}
            </el-tag>
            <span class="do-label">风险等级</span>
          </div>
        </div>
        <div class="detail-section">
          <div class="ds-title">薄弱知识点</div>
          <div class="weak-tags">
            <el-tag v-for="w in studentWeakPoints" :key="w" type="danger" effect="light">{{ w }}</el-tag>
          </div>
        </div>
        <div class="detail-section">
          <div class="ds-title">AI 学情分析与建议</div>
          <div class="ai-analysis">{{ studentAnalysis }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="studentDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="openMessageDialog(selectedStudent)">
          <el-icon><ChatDotRound /></el-icon>
          发送消息
        </el-button>
      </template>
    </el-dialog>

    <!-- ====== 发送消息对话框 ====== -->
    <el-dialog v-model="messageDialogVisible" title="发送消息" width="480px">
      <el-form :model="messageForm" label-position="top">
        <el-form-item label="接收人">
          <el-input v-model="messageForm.to" disabled />
        </el-form-item>
        <el-form-item label="消息类型">
          <el-radio-group v-model="messageForm.type">
            <el-radio-button label="鼓励">鼓励</el-radio-button>
            <el-radio-button label="提醒">提醒</el-radio-button>
            <el-radio-button label="通知">通知</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="消息内容">
          <el-input
            v-model="messageForm.content"
            type="textarea"
            :rows="4"
            placeholder="输入消息内容…"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="messageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendMessage">发送</el-button>
      </template>
    </el-dialog>

    <!-- ====== 布置作业对话框 ====== -->
    <el-dialog v-model="homeworkDialogVisible" title="布置作业" width="520px">
      <el-form :model="homeworkForm" label-position="top">
        <el-form-item label="作业标题">
          <el-input v-model="homeworkForm.title" placeholder="如：循环结构专项练习" />
        </el-form-item>
        <el-form-item label="关联知识点">
          <el-select v-model="homeworkForm.knowledge" style="width:100%">
            <el-option label="基础语法" value="基础语法" />
            <el-option label="流程控制" value="流程控制" />
            <el-option label="函数" value="函数" />
            <el-option label="列表操作" value="列表操作" />
            <el-option label="递归算法" value="递归算法" />
          </el-select>
        </el-form-item>
        <div class="form-row">
          <el-form-item label="截止日期">
            <el-date-picker v-model="homeworkForm.deadline" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="题目数量">
            <el-input-number v-model="homeworkForm.count" :min="1" :max="20" style="width:100%" />
          </el-form-item>
        </div>
        <el-form-item label="作业说明">
          <el-input v-model="homeworkForm.desc" type="textarea" :rows="3" placeholder="补充作业要求…" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="homeworkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHomework">发布作业</el-button>
      </template>
    </el-dialog>

    <!-- ====== 批改对话框 ====== -->
    <el-dialog v-model="reviewDialogVisible" :title="`批改作业 · ${reviewingHomework?.title || ''}`" width="680px">
      <div v-if="reviewingHomework" class="review-dialog">
        <div class="review-student-list">
          <div
            v-for="(sub, i) in reviewSubmissions"
            :key="i"
            class="review-student-item"
            :class="{ active: reviewIndex === i }"
            @click="reviewIndex = i"
          >
            <el-avatar :size="30" class="mini-avatar">{{ sub.name.charAt(0) }}</el-avatar>
            <div class="rs-info">
              <span class="rs-name">{{ sub.name }}</span>
              <span class="rs-score">AI 评分 {{ sub.aiScore }}</span>
            </div>
            <el-tag v-if="sub.confirmed" type="success" size="small" effect="light">已确认</el-tag>
          </div>
        </div>
        <div class="review-detail" v-if="reviewSubmissions[reviewIndex]">
          <div class="rd-header">
            <span>{{ reviewSubmissions[reviewIndex].name }} 的提交</span>
            <el-tag :type="getReviewScoreType(reviewSubmissions[reviewIndex].aiScore)" effect="light">
              AI 建议评分：{{ reviewSubmissions[reviewIndex].aiScore }}
            </el-tag>
          </div>
          <pre class="rd-code">{{ reviewSubmissions[reviewIndex].code }}</pre>
          <div class="rd-ai-comment">
            <div class="rd-comment-title"><el-icon><MagicStick /></el-icon>AI 评语</div>
            <p>{{ reviewSubmissions[reviewIndex].comment }}</p>
          </div>
          <div class="rd-score-row">
            <span>教师评分：</span>
            <el-input-number v-model="reviewSubmissions[reviewIndex].score" :min="0" :max="100" size="small" />
            <el-input v-model="reviewSubmissions[reviewIndex].teacherComment" placeholder="补充教师评语（可选）" size="small" style="flex:1" />
            <el-button type="primary" size="small" @click="confirmReview(reviewIndex)">确认批改</el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- ====== 班级报告对话框 ====== -->
    <el-dialog v-model="reportDialogVisible" title="班级学情分析报告" width="700px">
      <div class="class-report">
        <div class="cr-header">
          <h2>{{ classData.className }}</h2>
          <p>报告生成日期：{{ reportDate }} · 码途智辅 AI 智能生成</p>
        </div>
        <div class="cr-cards">
          <div class="cr-card"><span class="cr-value">{{ classData.studentCount }}</span><span class="cr-label">学生总数</span></div>
          <div class="cr-card"><span class="cr-value">{{ classData.avgCorrectRate }}%</span><span class="cr-label">平均正确率</span></div>
          <div class="cr-card"><span class="cr-value">{{ classData.activeRate }}%</span><span class="cr-label">活跃度</span></div>
          <div class="cr-card"><span class="cr-value">{{ classData.progress }}%</span><span class="cr-label">课程进度</span></div>
        </div>
        <div class="cr-section">
          <div class="cr-title">整体学情分析</div>
          <p class="cr-text">
            本班级共 {{ classData.studentCount }} 名学生，平均正确率 {{ classData.avgCorrectRate }}%，人均每周学习 {{ classData.avgStudyTime }} 小时。
            班级整体学习氛围良好，活跃度达 {{ classData.activeRate }}%。其中「基础语法」「数据类型」掌握较好，
            而「递归算法」「列表操作」为班级共性薄弱点，需重点强化。
          </p>
        </div>
        <div class="cr-section">
          <div class="cr-title">重点关注</div>
          <div class="cr-list">
            <div class="cr-list-item" v-for="s in atRiskStudents" :key="s.id">
              <el-tag type="danger" size="small" effect="light">需关注</el-tag>
              <span>{{ s.name }}（综合分 {{ s.score }}，班级第 {{ s.rank }} 名）</span>
            </div>
          </div>
        </div>
        <div class="cr-section">
          <div class="cr-title">教学改进建议</div>
          <ul class="cr-ul">
            <li v-for="(s, i) in classData.teachingSuggestions" :key="i">{{ s }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="reportDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadReport" :loading="isDownloading">
          <el-icon><Download /></el-icon>
          下载报告
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useUserStore } from '@/stores/user'
import {
  User, TrendCharts, Clock, Odometer, Histogram, DataLine, MagicStick,
  Refresh, Bell, Document, QuestionFilled, Top, Bottom, Minus, Search,
  Notebook, Plus, Aim, PieChart, Medal, Upload, View, Download, Star,
  Delete, ChatDotRound
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const classData = userStore.classData

const activeTab = ref('overview')
const isRefreshing = ref(false)
const isDownloading = ref(false)
const isBatchReviewing = ref(false)

// 学生管理
const studentSearch = ref('')
const studentFilter = ref('all')

// 资源管理
const resourceType = ref('all')

// 教学趋势
const trendRange = ref('4')

// 图表 refs
const heatmapChartRef = ref(null)
const distChartRef = ref(null)
const trendChartRef = ref(null)
const abilityRadarRef = ref(null)
const activityChartRef = ref(null)
let heatmapChart = null, distChart = null, trendChart = null, abilityRadar = null, activityChart = null

// 对话框
const studentDialogVisible = ref(false)
const messageDialogVisible = ref(false)
const homeworkDialogVisible = ref(false)
const reviewDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const selectedStudent = ref(null)
const reviewingHomework = ref(null)
const reviewIndex = ref(0)

const messageForm = ref({ to: '', type: '鼓励', content: '' })
const homeworkForm = ref({ title: '', knowledge: '', deadline: '', count: 5, desc: '' })

const reportDate = new Date().toLocaleDateString('zh-CN')

const atRiskStudents = computed(() =>
  classData.students.filter(s => s.risk === 'high' || s.risk === 'medium')
)

const filteredStudents = computed(() => {
  return classData.students.filter(s => {
    const matchSearch = !studentSearch.value ||
      s.name.includes(studentSearch.value) ||
      String(s.id).includes(studentSearch.value)
    let matchFilter = true
    if (studentFilter.value === 'excellent') matchFilter = s.score >= 85
    else if (studentFilter.value === 'good') matchFilter = s.score >= 70 && s.score < 85
    else if (studentFilter.value === 'weak') matchFilter = s.score < 70
    return matchSearch && matchFilter
  })
})

// ============ 作业数据 ============
const homeworkList = ref([
  {
    id: 1, title: '循环结构专项练习', knowledge: '流程控制', deadline: '09-28',
    bg: 'linear-gradient(135deg,#6366f1,#818cf8)',
    statusType: 'warning', statusText: '批改中',
    submitted: 42, pending: 12, reviewed: 30, avgScore: 78, reviewProgress: 71
  },
  {
    id: 2, title: '函数与递归实战', knowledge: '递归算法', deadline: '09-30',
    bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    statusType: 'warning', statusText: '批改中',
    submitted: 38, pending: 20, reviewed: 18, avgScore: 65, reviewProgress: 47
  },
  {
    id: 3, title: '列表与字典操作', knowledge: '列表操作', deadline: '09-25',
    bg: 'linear-gradient(135deg,#10b981,#34d399)',
    statusType: 'success', statusText: '已完成',
    submitted: 45, pending: 0, reviewed: 45, avgScore: 82, reviewProgress: 100
  },
  {
    id: 4, title: '基础语法综合测试', knowledge: '基础语法', deadline: '09-22',
    bg: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
    statusType: 'success', statusText: '已完成',
    submitted: 45, pending: 0, reviewed: 45, avgScore: 86, reviewProgress: 100
  }
])

const pendingHomework = computed(() => homeworkList.value.filter(h => h.pending > 0))

const reviewSubmissions = ref([])

// ============ 资源数据 ============
const resources = ref([
  { id: 1, name: 'Python 基础语法课件', desc: '变量、运算符与输入输出', type: 'doc', typeText: '课件', icon: 'Document', bg: 'linear-gradient(135deg,#6366f1,#818cf8)', views: 320, downloads: 156, stars: 45, time: '09-20' },
  { id: 2, name: '递归算法微课视频', desc: '递归三要素与经典案例', type: 'video', typeText: '视频', icon: 'VideoPlay', bg: 'linear-gradient(135deg,#f43f5e,#fb7185)', views: 280, downloads: 98, stars: 62, time: '09-19' },
  { id: 3, name: '循环结构代码案例集', desc: 'for/while 循环实例 20 例', type: 'code', typeText: '代码', icon: 'Monitor', bg: 'linear-gradient(135deg,#10b981,#34d399)', views: 210, downloads: 132, stars: 38, time: '09-18' },
  { id: 4, name: '二级考试模拟题库', desc: '近 5 年真题及解析', type: 'exam', typeText: '试题', icon: 'Notebook', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', views: 450, downloads: 320, stars: 88, time: '09-15' },
  { id: 5, name: '函数与模块课件', desc: '函数定义、参数与作用域', type: 'doc', typeText: '课件', icon: 'Document', bg: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', views: 180, downloads: 76, stars: 25, time: '09-14' },
  { id: 6, name: '数据结构动画演示', desc: '列表/字典操作可视化', type: 'video', typeText: '视频', icon: 'VideoPlay', bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)', views: 264, downloads: 88, stars: 51, time: '09-12' }
])

const filteredResources = computed(() => {
  if (resourceType.value === 'all') return resources.value
  return resources.value.filter(r => r.type === resourceType.value)
})

// ============ KPI ============
const kpis = ref([
  { label: '作业完成率', value: '94%', pct: 94, color: '#6366f1', trend: 5 },
  { label: '课程通过率', value: '88%', pct: 88, color: '#10b981', trend: 8 },
  { label: '平均能力提升', value: '12%', pct: 12, color: '#f59e0b', trend: 12 },
  { label: '课堂参与度', value: '91%', pct: 91, color: '#3b82f6', trend: 3 }
])

// ============ 辅助函数 ============
function getScoreColor(score) {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#6366f1'
  if (score >= 60) return '#f59e0b'
  return '#f43f5e'
}
function getRiskType(risk) {
  return { high: 'danger', medium: 'warning', low: 'success', normal: 'info' }[risk] || 'info'
}
function getRiskText(risk) {
  return { high: '高风险', medium: '中风险', low: '优秀', normal: '正常' }[risk] || '正常'
}
function getSuggestionColor(index) {
  const colors = ['linear-gradient(135deg,#f43f5e,#fb7185)', 'linear-gradient(135deg,#f59e0b,#fbbf24)', 'linear-gradient(135deg,#10b981,#34d399)', 'linear-gradient(135deg,#6366f1,#818cf8)']
  return colors[index % colors.length]
}
function getSuggestionIcon(index) {
  return ['Warning', 'Bell', 'CircleCheckFilled', 'MagicStick'][index % 4]
}
function getReviewScoreType(score) {
  if (score >= 85) return 'success'
  if (score >= 70) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// ============ 学生相关操作 ============
function viewStudent(student) {
  selectedStudent.value = student
  studentDialogVisible.value = true
}
function sendReminder(student) {
  ElMessage.success(`已向 ${student.name} 发送学习提醒`)
}
function refreshSuggestions() {
  isRefreshing.value = true
  setTimeout(() => {
    isRefreshing.value = false
    ElMessage.success('AI 教学建议已更新')
  }, 800)
}
function applySuggestion(index) {
  ElMessage.success('已采纳该建议，已加入教学计划')
}
function sendReminderAll() {
  ElMessageBox.confirm('确定向所有待提升学生批量发送学习提醒吗？', '批量提醒', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    ElMessage.success('批量提醒已发送')
  }).catch(() => {})
}
function openMessageDialog(student) {
  messageForm.value = { to: student?.name || '全体学生', type: '鼓励', content: '' }
  studentDialogVisible.value = false
  messageDialogVisible.value = true
}
function sendMessage() {
  if (!messageForm.value.content.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  messageDialogVisible.value = false
  ElMessage.success(`消息已发送给 ${messageForm.value.to}`)
}

const studentWeakPoints = ref(['递归算法', '异常处理', '列表操作'])
const studentAnalysis = ref(
  '该生基础较为扎实，但在递归与异常处理方面存在明显短板。建议：1）加强递归三要素的理解，多画递归调用栈；2）通过实际项目练习异常处理；3) 推荐完成平台「技能训练」中的递归专项题目。'
)

// ============ 作业批改 ============
function openReviewDialog(hw) {
  reviewingHomework.value = hw
  reviewIndex.value = 0
  reviewSubmissions.value = [
    { name: '赵六', aiScore: 92, score: 92, confirmed: false, teacherComment: '', comment: '代码逻辑清晰，边界处理完善，命名规范，是一份优秀的作业。', code: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\n# 递归计算阶乘' },
    { name: '张三', aiScore: 75, score: 75, confirmed: false, teacherComment: '', comment: '思路正确，但缺少对 n 为负数的校验，建议补充边界判断。', code: 'def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)' },
    { name: '钱七', aiScore: 68, score: 68, confirmed: false, teacherComment: '', comment: '实现了基本功能，但递归终止条件不够严谨，且变量命名可读性一般。', code: 'def f(x):\n    if x:\n        return x * f(x - 1)\n    else:\n        return 1' },
    { name: '李四', aiScore: 45, score: 45, confirmed: false, teacherComment: '', comment: '未正确理解递归思想，实现为循环且存在死循环风险，建议重新学习递归三要素。', code: 'def factorial(n):\n    r = 1\n    while n > 0:\n        r *= n\n    return r' }
  ]
  reviewDialogVisible.value = true
}
function confirmReview(index) {
  reviewSubmissions.value[index].confirmed = true
  ElMessage.success(`已确认对 ${reviewSubmissions.value[index].name} 的批改`)
}
function batchReview() {
  isBatchReviewing.value = true
  setTimeout(() => {
    isBatchReviewing.value = false
    homeworkList.value.forEach(h => {
      h.reviewed = h.submitted
      h.pending = 0
      h.reviewProgress = 100
      h.statusType = 'success'
      h.statusText = '已完成'
    })
    ElMessage.success('AI 已批量完成所有作业批改')
  }, 1400)
}
function openHomeworkDialog() {
  homeworkForm.value = { title: '', knowledge: '', deadline: '', count: 5, desc: '' }
  homeworkDialogVisible.value = true
}
function confirmHomework() {
  if (!homeworkForm.value.title.trim()) {
    ElMessage.warning('请输入作业标题')
    return
  }
  homeworkList.value.unshift({
    id: Date.now(),
    title: homeworkForm.value.title,
    knowledge: homeworkForm.value.knowledge || '综合',
    deadline: homeworkForm.value.deadline || '待定',
    bg: 'linear-gradient(135deg,#6366f1,#818cf8)',
    statusType: 'info', statusText: '进行中',
    submitted: 0, pending: 0, reviewed: 0, avgScore: 0, reviewProgress: 0
  })
  // 同步发布到学生端「我的作业」，并推送通知
  userStore.publishAssignment({
    title: homeworkForm.value.title,
    knowledge: homeworkForm.value.knowledge,
    deadline: homeworkForm.value.deadline,
    count: homeworkForm.value.count,
    desc: homeworkForm.value.desc
  })
  homeworkDialogVisible.value = false
  ElMessage.success('作业已发布到学生端')
}

// ============ 资源管理 ============
function uploadResource() {
  ElMessage.info('已打开资源上传面板（演示）')
}
function previewResource(res) {
  ElMessage.success(`正在打开「${res.name}」`)
}
function deleteResource(res) {
  ElMessageBox.confirm(`确定删除资源「${res.name}」吗？`, '删除确认', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const i = resources.value.findIndex(r => r.id === res.id)
    if (i > -1) resources.value.splice(i, 1)
    ElMessage.success('资源已删除')
  }).catch(() => {})
}

// ============ 报告 ============
function generateReport() {
  reportDialogVisible.value = true
}
function downloadReport() {
  isDownloading.value = true
  setTimeout(() => {
    isDownloading.value = false
    const c = classData
    const lines = [
      `班级学情分析报告`,
      `班级：${c.className}`,
      `生成日期：${reportDate}`,
      ``,
      `【整体概况】`,
      `  学生总数：${c.studentCount} 人`,
      `  平均正确率：${c.avgCorrectRate}%`,
      `  人均周学习时长：${c.avgStudyTime} 小时`,
      `  学习活跃度：${c.activeRate}%`,
      `  课程进度：${c.progress}%`,
      ``,
      `【知识点掌握】`,
      ...c.knowledgeHeatmap.map(k => `  ${k.knowledge}：平均掌握度 ${k.avgMastery}%，低分学生 ${k.lowStudents} 人`),
      ``,
      `【需关注学生】`,
      ...atRiskStudents.value.map(s => `  ${s.name}（综合分 ${s.score}，第 ${s.rank} 名）`),
      ``,
      `【教学改进建议】`,
      ...c.teachingSuggestions.map((s, i) => `  ${i + 1}. ${s}`),
      ``,
      `—— 本报告由码途智辅 AI 智能生成，仅供教学参考`
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `班级学情报告_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('报告已下载')
  }, 800)
}

// ============ 图表 ============
function initCharts() {
  // 知识点掌握
  heatmapChart = echarts.init(heatmapChartRef.value)
  heatmapChart.setOption({
    grid: { left: 10, right: 30, top: 20, bottom: 10, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#eef2f7' } }, axisLabel: { color: '#94a3b8' } },
    yAxis: {
      type: 'category',
      data: classData.knowledgeHeatmap.map(k => k.knowledge).reverse(),
      axisLine: { lineStyle: { color: '#e8ecf3' } }, axisLabel: { color: '#64748b', fontSize: 12 }
    },
    series: [{
      type: 'bar', barWidth: 15,
      data: classData.knowledgeHeatmap.map(k => ({
        value: k.avgMastery,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: k.avgMastery >= 70 ? '#10b981' : k.avgMastery >= 55 ? '#6366f1' : '#f43f5e' },
            { offset: 1, color: k.avgMastery >= 70 ? '#34d399' : k.avgMastery >= 55 ? '#818cf8' : '#fb7185' }
          ]),
          borderRadius: [0, 6, 6, 0]
        }
      })).reverse(),
      label: { show: true, position: 'right', formatter: '{c}%', color: '#64748b', fontSize: 11 },
      animationDuration: 900
    }]
  })

  // 成绩分布
  distChart = echarts.init(distChartRef.value)
  distChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, icon: 'circle', textStyle: { color: '#64748b' } },
    series: [{
      type: 'pie', radius: ['48%', '72%'], center: ['50%', '44%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#64748b' },
      data: [
        { value: 12, name: '优秀(85+)', itemStyle: { color: '#10b981' } },
        { value: 15, name: '良好(70-85)', itemStyle: { color: '#6366f1' } },
        { value: 11, name: '中等(60-70)', itemStyle: { color: '#f59e0b' } },
        { value: 7, name: '待提升(<60)', itemStyle: { color: '#f43f5e' } }
      ],
      animationDuration: 900
    }]
  })
}

function initAnalysisCharts() {
  // 趋势
  trendChart = echarts.init(trendChartRef.value)
  const weeks = trendRange.value === '4' ? ['第1周', '第2周', '第3周', '第4周'] : ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周']
  const classAvg = trendRange.value === '4' ? [68, 71, 74, 78] : [62, 65, 68, 71, 74, 76, 78, 82]
  const topLine = classAvg.map(v => Math.min(98, v + 14))
  trendChart.setOption({
    grid: { left: 10, right: 20, top: 30, bottom: 10, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { top: 0, icon: 'roundRect', textStyle: { color: '#64748b' } },
    xAxis: { type: 'category', data: weeks, axisLine: { lineStyle: { color: '#e8ecf3' } }, axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', min: 50, max: 100, splitLine: { lineStyle: { color: '#eef2f7' } }, axisLabel: { color: '#94a3b8' } },
    series: [
      {
        name: '班级平均', type: 'line', smooth: true, data: classAvg,
        lineStyle: { color: '#6366f1', width: 3 },
        itemStyle: { color: '#6366f1' }, symbolSize: 7,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(99,102,241,.25)' }, { offset: 1, color: 'rgba(99,102,241,0)' }
        ]) }
      },
      {
        name: '优秀线', type: 'line', smooth: true, data: topLine,
        lineStyle: { color: '#10b981', width: 2, type: 'dashed' },
        itemStyle: { color: '#10b981' }, symbolSize: 5
      }
    ],
    animationDuration: 900
  })

  // 五维能力
  abilityRadar = echarts.init(abilityRadarRef.value)
  abilityRadar.setOption({
    tooltip: {},
    radar: {
      indicator: [
        { name: '正确性', max: 100 }, { name: '效率', max: 100 }, { name: '规范性', max: 100 },
        { name: '可读性', max: 100 }, { name: '健壮性', max: 100 }
      ],
      radius: '65%', splitNumber: 4,
      axisName: { color: '#64748b', fontSize: 12 },
      splitLine: { lineStyle: { color: '#e8ecf3' } },
      splitArea: { areaStyle: { color: ['#f8fafc', '#fff'] } },
      axisLine: { lineStyle: { color: '#e8ecf3' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [78, 66, 82, 74, 62], name: '班级平均',
        areaStyle: { color: 'rgba(20,184,166,.2)' },
        lineStyle: { color: '#14b8a6', width: 2.5 },
        itemStyle: { color: '#14b8a6' }, symbolSize: 5
      }],
      animationDuration: 900
    }]
  })

  // 活跃度
  activityChart = echarts.init(activityChartRef.value)
  activityChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, icon: 'circle', textStyle: { color: '#64748b' } },
    series: [{
      type: 'pie', radius: ['46%', '70%'], center: ['50%', '44%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
      label: { show: true, formatter: '{d}%', fontSize: 12, color: '#64748b' },
      data: [
        { value: 24, name: '高度活跃', itemStyle: { color: '#10b981' } },
        { value: 13, name: '一般活跃', itemStyle: { color: '#6366f1' } },
        { value: 6, name: '低活跃', itemStyle: { color: '#f59e0b' } },
        { value: 2, name: '不活跃', itemStyle: { color: '#f43f5e' } }
      ],
      animationDuration: 900
    }]
  })
}

function initAllVisible() {
  nextTick(() => {
    if (activeTab.value === 'overview') {
      if (!heatmapChart && heatmapChartRef.value) initCharts()
    }
    if (activeTab.value === 'analysis') {
      if (!trendChart && trendChartRef.value) initAnalysisCharts()
    }
  })
}

function handleResize() {
  ;[heatmapChart, distChart, trendChart, abilityRadar, activityChart].forEach(c => c?.resize())
}

function rebuildTrend() {
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
    nextTick(() => initAnalysisCharts())
  }
}

import { watch } from 'vue'
watch(activeTab, (val) => {
  nextTick(() => {
    if (val === 'overview' && !heatmapChart && heatmapChartRef.value) initCharts()
    if (val === 'analysis' && !trendChart && trendChartRef.value) initAnalysisCharts()
    handleResize()
  })
})
watch(trendRange, () => {
  if (activeTab.value === 'analysis') rebuildTrend()
})

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  ;[heatmapChart, distChart, trendChart, abilityRadar, activityChart].forEach(c => c?.dispose())
})
</script>

<style scoped lang="scss">
.workbench-card { padding: 8px 20px 20px; }
.teacher-tabs {
  :deep(.el-tabs__header) { margin-bottom: 18px; }
  :deep(.el-tabs__item) { font-size: 14.5px; height: 48px; }
}
.tab-content { animation: fadeIn .35s ease both; }

.sub-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  margin-bottom: 16px;
}
.content-row .sub-card { margin-bottom: 0; }
.content-row { margin-bottom: 16px; }
.sub-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 14px;
  .icon { color: var(--primary-color); }
  .help { color: var(--text-light); font-size: 14px; cursor: help; }
}
.chart-box { height: 260px; width: 100%; }

/* 教学建议 */
.suggestion-list { display: flex; flex-direction: column; gap: 10px; }
.suggestion-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; background: var(--bg-primary);
  border: 1px solid var(--border-color); border-radius: 12px;
  transition: all .22s ease;
  &:hover { box-shadow: var(--shadow-sm); border-color: var(--el-color-primary-light-5); }
}
.suggestion-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.suggestion-text { flex: 1; font-size: 13px; color: var(--text-primary); margin: 0; line-height: 1.6; }

/* 表格 */
.risk-table, .student-table { background: transparent; }
.student-cell { display: flex; align-items: center; gap: 10px; }
.mini-avatar { background: var(--brand-gradient); color: #fff; font-weight: 600; font-size: 13px; }
.sc-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
.sc-id { font-size: 11.5px; color: var(--text-light); }
.score-cell { display: flex; align-items: center; gap: 8px; }
.score-num { font-size: 15px; font-weight: 700; width: 30px; }
.trend-tag {
  display: inline-flex; align-items: center; gap: 3px; font-size: 12px;
  &.up { color: #10b981; }
  &.down { color: #f43f5e; }
  &.stable { color: var(--text-light); }
}

/* 工具栏 */
.toolbar {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
}
.toolbar-right { margin-left: auto; display: flex; gap: 10px; }
.hw-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; }

/* 作业卡片 */
.homework-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.hw-card {
  border: 1px solid var(--border-color); border-radius: 14px; padding: 18px;
  background: var(--bg-secondary); transition: all .25s ease;
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
}
.hw-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.hw-icon {
  width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.hw-info { flex: 1; }
.hw-info h4 { font-size: 14.5px; margin: 0 0 4px; color: var(--text-primary); }
.hw-info p { font-size: 12px; color: var(--text-secondary); margin: 0; }
.hw-stats { display: flex; gap: 20px; margin-bottom: 14px; }
.hw-stat { display: flex; flex-direction: column; }
.stat-num { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.stat-label { font-size: 11.5px; color: var(--text-light); }
.hw-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.hw-progress-text { font-size: 12px; color: var(--text-secondary); }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kpi-item { text-align: center; }
.kpi-ring {
  width: 84px; height: 84px; margin: 0 auto 10px; border-radius: 50%;
  background: conic-gradient(var(--clr) var(--pct), #eef2f7 0);
  display: flex; align-items: center; justify-content: center; position: relative;
  &::before { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: var(--bg-secondary); }
  span { position: relative; font-size: 17px; font-weight: 800; color: var(--clr); }
}
.kpi-label { font-size: 12.5px; color: var(--text-secondary); margin: 0; }
.kpi-trend { font-size: 11px; margin: 4px 0 0; &.up { color: #10b981; } &.down { color: #f43f5e; } }

/* 资源 */
.resource-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.resource-card {
  border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;
  background: var(--bg-secondary); transition: all .25s ease;
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }
}
.res-preview {
  height: 96px; display: flex; align-items: center; justify-content: center;
  color: #fff; position: relative;
}
.res-type {
  position: absolute; top: 10px; right: 10px;
  font-size: 11px; padding: 2px 10px; border-radius: 8px;
  background: rgba(255,255,255,.25); color: #fff; backdrop-filter: blur(4px);
}
.res-body { padding: 14px; }
.res-body h4 { font-size: 14px; margin: 0 0 6px; color: var(--text-primary); }
.res-body p { font-size: 12px; color: var(--text-secondary); margin: 0 0 10px; }
.res-meta {
  display: flex; gap: 14px; font-size: 11.5px; color: var(--text-light);
  span { display: flex; align-items: center; gap: 3px; }
}
.res-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-top: 1px solid var(--border-color);
}
.res-time { font-size: 11.5px; color: var(--text-light); }
.res-act {
  font-size: 15px; color: var(--text-secondary); cursor: pointer;
  margin-left: 12px; transition: color .2s;
  &:hover { color: var(--primary-color); }
  &.danger:hover { color: var(--danger-color); }
}

/* 学生详情 */
.student-detail { display: flex; flex-direction: column; gap: 18px; }
.detail-overview {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  padding: 16px; background: var(--bg-secondary); border-radius: 14px;
}
.do-item { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.do-value { font-size: 24px; font-weight: 800; color: var(--text-primary); }
.do-label { font-size: 12px; color: var(--text-light); }
.detail-section { }
.ds-title {
  font-size: 14px; font-weight: 600; margin-bottom: 10px;
  padding-left: 9px; border-left: 3px solid var(--primary-color);
}
.weak-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.ai-analysis {
  font-size: 13px; line-height: 1.8; color: var(--text-secondary);
  background: var(--bg-secondary); padding: 14px; border-radius: 12px;
}

/* 批改对话框 */
.review-dialog { display: flex; gap: 16px; height: 460px; }
.review-student-list {
  width: 190px; flex-shrink: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: 8px;
}
.review-student-item {
  display: flex; align-items: center; gap: 9px; padding: 10px;
  border-radius: 10px; cursor: pointer; border: 1px solid var(--border-color);
  transition: all .2s;
  &.active { background: var(--el-color-primary-light-9); border-color: var(--el-color-primary-light-5); }
  &:hover { border-color: var(--el-color-primary-light-5); }
}
.rs-info { flex: 1; display: flex; flex-direction: column; }
.rs-name { font-size: 13px; font-weight: 600; }
.rs-score { font-size: 11px; color: var(--text-light); }
.review-detail { flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.rd-header { display: flex; align-items: center; justify-content: space-between; }
.rd-code {
  background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 10px;
  font-family: 'JetBrains Mono', Consolas, monospace; font-size: 12.5px;
  line-height: 1.7; max-height: 160px; overflow: auto; margin: 0;
}
.rd-ai-comment { background: var(--el-color-primary-light-9); border-radius: 10px; padding: 12px; }
.rd-comment-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--primary-color); }
.rd-ai-comment p { font-size: 12.5px; color: var(--text-secondary); margin: 0; line-height: 1.6; }
.rd-score-row { display: flex; align-items: center; gap: 10px; }
.rd-score-row > span { font-size: 13px; color: var(--text-secondary); }

/* 班级报告 */
.class-report { display: flex; flex-direction: column; gap: 16px; }
.cr-header { text-align: center; padding-bottom: 14px; border-bottom: 1px solid var(--border-color); }
.cr-header h2 { margin: 0 0 6px; font-size: 19px; }
.cr-header p { font-size: 12px; color: var(--text-light); margin: 0; }
.cr-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.cr-card {
  text-align: center; padding: 14px; border-radius: 12px;
  background: var(--bg-secondary); border: 1px solid var(--border-color);
}
.cr-value { display: block; font-size: 22px; font-weight: 800; color: var(--primary-color); }
.cr-label { font-size: 12px; color: var(--text-light); }
.cr-title {
  font-size: 14px; font-weight: 600; margin-bottom: 10px;
  padding-left: 9px; border-left: 3px solid var(--primary-color);
}
.cr-text { font-size: 13px; line-height: 1.8; color: var(--text-secondary); margin: 0; }
.cr-list { display: flex; flex-direction: column; gap: 8px; }
.cr-list-item {
  display: flex; align-items: center; gap: 10px; font-size: 13px;
  color: var(--text-secondary); padding: 9px 12px;
  background: var(--bg-secondary); border-radius: 10px;
}
.cr-ul { padding-left: 18px; margin: 0; }
.cr-ul li { font-size: 13px; color: var(--text-secondary); line-height: 1.9; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
</style>
