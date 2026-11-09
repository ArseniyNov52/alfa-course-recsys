import { useState, useEffect } from 'react';
import {
  Sparkles,
  Scale,
  TrendingUp,
  Layers,
  CheckCircle2,
  ArrowRight,
  Clock,
  Star,
  AlertCircle,
  RefreshCw,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  UserProfile,
  RecommendationResponse,
  BenchmarkComparisonResponse,
  ABTestSimulationResult,
} from './types';
import {
  fetchProfiles,
  fetchRecommendations,
  fetchColdStart,
  fetchBenchmark,
  simulateABTest,
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'showcase' | 'benchmark' | 'ab_test' | 'architecture'>('showcase');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [customTask, setCustomTask] = useState<string>('');
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Benchmark state
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkComparisonResponse | null>(null);
  const [benchLoading, setBenchLoading] = useState<boolean>(false);

  // A/B test simulation state
  const [abParams, setAbParams] = useState({
    daily_visitors: 5000,
    baseline_cr_percent: 2.5,
    expected_uplift_percent: 35.0,
    avg_order_value_rub: 4900,
    test_duration_days: 14,
  });
  const [abResult, setAbResult] = useState<ABTestSimulationResult | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      const loadedProfiles = await fetchProfiles();
      setProfiles(loadedProfiles);
      if (loadedProfiles.length > 0) {
        const initial = loadedProfiles[0];
        setSelectedProfile(initial);
        setCustomTask(initial.current_task);
        const recs = await fetchRecommendations(initial, 5);
        setRecommendations(recs);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectProfile(p: UserProfile) {
    setSelectedProfile(p);
    setCustomTask(p.current_task);
    setLoading(true);
    try {
      const recs = await fetchRecommendations(p, 5);
      setRecommendations(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyCustomQuery() {
    if (!selectedProfile) return;
    const updated: UserProfile = {
      ...selectedProfile,
      current_task: customTask,
    };
    setSelectedProfile(updated);
    setLoading(true);
    try {
      const recs = await fetchRecommendations(updated, 5);
      setRecommendations(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleColdStartTrigger() {
    setLoading(true);
    try {
      const coldRecs = await fetchColdStart();
      setRecommendations(coldRecs);
      setSelectedProfile({
        user_id: 'guest',
        name: 'Новый предприниматель (Холодный старт)',
        stage: null,
        domain: null,
        current_task: '',
        experience_years: 0,
        view_history: [],
        completed_materials: [],
      });
      setCustomTask('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadBenchmark() {
    setBenchLoading(true);
    try {
      const data = await fetchBenchmark();
      setBenchmarkData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBenchLoading(false);
    }
  }

  async function handleRunABSim() {
    try {
      const res = await simulateABTest(abParams);
      setAbResult(res);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (activeTab === 'benchmark' && !benchmarkData) {
      handleLoadBenchmark();
    }
    if (activeTab === 'ab_test' && !abResult) {
      handleRunABSim();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F2229] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF3124] flex items-center justify-center text-white font-black text-xl shadow-md shadow-red-200">
              А
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-gray-900">Альфа-Курс</span>
                <span className="bg-red-50 text-[#EF3124] text-xs font-semibold px-2 py-0.5 rounded-full border border-red-100">
                  Рекомендации
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Хакатон Hack&Change 2026 • Трек 1</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('showcase')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'showcase'
                  ? 'bg-white text-[#EF3124] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Витрина рекомендаций</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'benchmark'
                  ? 'bg-white text-[#EF3124] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Сравнение с бейзлайном</span>
            </button>

            <button
              onClick={() => setActiveTab('ab_test')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'ab_test'
                  ? 'bg-white text-[#EF3124] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>A/B эксперимент</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'architecture'
                  ? 'bg-white text-[#EF3124] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Архитектура</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'showcase' && (
          <div className="space-y-6">
            {/* Profile Selection & Onboarding Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <span>Сценарии экспертной проверки жюри</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    Выберите эталонный профиль предпринимателя или задайте произвольный запрос
                  </p>
                </div>
                <button
                  onClick={handleColdStartTrigger}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#EF3124]" />
                  <span>Сбросить в холодный старт</span>
                </button>
              </div>

              {/* Profiles Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {profiles.map((p) => {
                  const isSelected = selectedProfile?.user_id === p.user_id;
                  return (
                    <button
                      key={p.user_id}
                      onClick={() => handleSelectProfile(p)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#EF3124] bg-red-50/50 shadow-sm ring-1 ring-[#EF3124]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900">{p.name.split(' ')[0]}</span>
                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          {p.stage ? p.stage.replace('_', ' ') : 'новый'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {p.current_task || 'Без указания задачи (холодный вход)'}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Task Input */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Текущая задача или вопрос предпринимателя (свободный текст):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder="Например: как выбрать систему налогов для открытия точки фастфуда..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#EF3124] focus:bg-white transition"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomQuery()}
                  />
                  <button
                    onClick={handleApplyCustomQuery}
                    disabled={loading}
                    className="bg-[#EF3124] hover:bg-[#CC190D] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm flex items-center space-x-1.5"
                  >
                    <span>Подобрать</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Interpretation Banner */}
            {recommendations && (
              <div className="bg-gradient-to-r from-red-50 to-white p-4 rounded-xl border border-red-100 flex items-start space-x-3">
                <Info className="w-5 h-5 text-[#EF3124] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Интерпретация ситуации</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{recommendations.profile_summary}</p>
                </div>
              </div>
            )}

            {/* Recommendations Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">
                  Рекомендованные материалы «Альфа-Курс»
                </h3>
                <span className="text-xs font-medium text-gray-500">
                  {recommendations ? `Показано ${recommendations.recommendations.length} из ${recommendations.total_found}` : ''}
                </span>
              </div>

              {loading ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-8 h-8 text-[#EF3124] animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">
                    Ранжирование материалов и генерация персонализированных объяснений...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recommendations?.recommendations.map((rec) => {
                    const m = rec.material;
                    const isFree = m.price_type === 'free';
                    return (
                      <div
                        key={m.id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                      >
                        <div className="p-5 space-y-3">
                          {/* Badges Bar */}
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`font-bold px-2.5 py-1 rounded-lg ${
                                isFree
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {isFree ? 'Бесплатно' : `${m.price_rub} ₽`}
                            </span>

                            <div className="flex items-center space-x-2 text-gray-500 font-medium">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{m.effort_minutes} мин</span>
                              </span>
                              <span className="flex items-center space-x-1 text-amber-600 font-semibold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{m.rating}</span>
                              </span>
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="font-bold text-base text-gray-900 leading-snug line-clamp-2">
                            {m.title}
                          </h4>

                          {/* Description */}
                          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                            {m.description}
                          </p>

                          {/* XAI: Why Recommended */}
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                              <Sparkles className="w-3.5 h-3.5 text-[#EF3124]" />
                              <span>Почему подходит именно вам:</span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">
                              {rec.explanation.why_recommended}
                            </p>

                            {/* Fit Factors Tags */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {rec.explanation.fit_factors.map((factor, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-white text-gray-600 border border-gray-200 px-2 py-0.5 rounded-md"
                                >
                                  {factor}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Next Step Box */}
                          <div className="bg-red-50/60 rounded-xl p-3 border border-red-100">
                            <span className="text-[11px] font-bold text-[#EF3124] block uppercase tracking-wider mb-1">
                              Следующий шаг:
                            </span>
                            <p className="text-xs text-gray-800 leading-snug">
                              {rec.explanation.next_step}
                            </p>
                          </div>
                        </div>

                        {/* Card Bottom CTA */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-gray-500">
                            Ранжирование: <b className="text-gray-800">{(rec.score * 100).toFixed(0)}%</b>
                          </span>
                          <a
                            href={m.alfa_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#EF3124] hover:text-[#CC190D] transition"
                          >
                            <span>Открыть на платформе</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benchmark Tab */}
        {activeTab === 'benchmark' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-[#EF3124]" />
                    <span>Сравнение с простым бейзлайном (Тематический подбор)</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    Согласно требованию хакатона: сравнение с подборкой по ключевым словам и популярности
                  </p>
                </div>
                <button
                  onClick={handleLoadBenchmark}
                  disabled={benchLoading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#EF3124] hover:bg-[#CC190D] text-white transition shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${benchLoading ? 'animate-spin' : ''}`} />
                  <span>Пересчитать метрики</span>
                </button>
              </div>

              {/* Summary KPIs */}
              {benchmarkData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-medium block">Средний NDCG@5 (Модель)</span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-black text-gray-900">
                        {benchmarkData.summary.average_model_ndcg_at_5}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        {benchmarkData.summary.ndcg_uplift_percent}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      Бейзлайн: {benchmarkData.summary.average_baseline_ndcg_at_5}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-medium block">Stage Match Rate (Модель)</span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-black text-gray-900">
                        {benchmarkData.summary.average_model_stage_match_rate}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        {benchmarkData.summary.stage_match_uplift_percent}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      Бейзлайн: {benchmarkData.summary.average_baseline_stage_match_rate}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-medium block">Профилей протестировано</span>
                    <span className="text-2xl font-black text-gray-900 block mt-1">
                      {benchmarkData.summary.total_profiles_evaluated}
                    </span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">Полное покрытие стадий</span>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-medium block">Критический результат</span>
                    <span className="text-xs font-bold text-emerald-950 block mt-1">
                      0 ошибок несоответствия стадии
                    </span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5 leading-snug">
                      Бейзлайн регулярно рекомендует финдиректора новичкам
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Comparison Cards */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-900">
                Детальный Side-by-Side разбор по тестовым профилям
              </h3>

              {benchLoading ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-8 h-8 text-[#EF3124] animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">Запуск бенчмарка и расчет NDCG...</p>
                </div>
              ) : (
                benchmarkData?.profiles.map((p) => (
                  <div key={p.profile_id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-2">
                      <div>
                        <h4 className="font-bold text-base text-gray-900">{p.profile_name}</h4>
                        <p className="text-xs text-gray-500 italic mt-0.5">«{p.task_description}»</p>
                      </div>
                      <div className="flex space-x-3 text-xs">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg font-medium text-gray-700">
                          NDCG: Бейзлайн <b>{p.baseline_ndcg_at_5}</b> vs Модель <b>{p.model_ndcg_at_5}</b>
                        </span>
                        <span className="bg-red-50 text-[#EF3124] px-3 py-1 rounded-lg font-bold border border-red-100">
                          Stage Match: {p.model_stage_match_rate * 100}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Baseline Column */}
                      <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                            Простой бейзлайн (По темам и популярности)
                          </span>
                          <span className="text-[11px] font-semibold text-amber-800">
                            Точность: {p.baseline_stage_match_rate * 100}%
                          </span>
                        </div>
                        <ol className="list-decimal list-inside text-xs text-gray-700 space-y-1.5 pt-1">
                          {p.baseline_recommendations.map((title, i) => (
                            <li key={i} className="line-clamp-1">
                              {title}
                            </li>
                          ))}
                        </ol>

                        <div className="pt-2 border-t border-amber-200">
                          <span className="text-[11px] font-bold text-red-600 block mb-1">
                            Выявленные проблемы бейзлайна:
                          </span>
                          {p.baseline_issues.map((issue, idx) => (
                            <p key={idx} className="text-xs text-red-700 flex items-center space-x-1.5">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{issue}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Our Model Column */}
                      <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                            Гибридная модель «Альфа-Курс» (Двухстадийная)
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-800">
                            Точность: {p.model_stage_match_rate * 100}%
                          </span>
                        </div>
                        <ol className="list-decimal list-inside text-xs text-gray-700 space-y-1.5 pt-1">
                          {p.model_recommendations.map((title, i) => (
                            <li key={i} className="line-clamp-1 font-medium text-emerald-950">
                              {title}
                            </li>
                          ))}
                        </ol>

                        <div className="pt-2 border-t border-emerald-200">
                          <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                            Преимущества нашего решения:
                          </span>
                          {p.model_advantages.map((adv, idx) => (
                            <p key={idx} className="text-xs text-emerald-800 flex items-center space-x-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>{adv}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* A/B Testing Tab */}
        {activeTab === 'ab_test' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#EF3124]" />
                  <span>Дизайн и симулятор A/B-тестирования после внедрения</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  План проверки влияния персональных рекомендаций на бизнес-метрики платформы (Критерий 6)
                </p>
              </div>

              {/* Simulation Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Ежедневные посетители (DAU): <b className="text-[#EF3124]">{abParams.daily_visitors}</b>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={abParams.daily_visitors}
                    onChange={(e) => setAbParams({ ...abParams, daily_visitors: Number(e.target.value) })}
                    className="w-full accent-[#EF3124]"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">Охват платформы «Альфа-Курс»</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Ожидаемый прирост конверсии (MDE): <b className="text-[#EF3124]">+{abParams.expected_uplift_percent}%</b>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={abParams.expected_uplift_percent}
                    onChange={(e) => setAbParams({ ...abParams, expected_uplift_percent: Number(e.target.value) })}
                    className="w-full accent-[#EF3124]"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">Minimum Detectable Effect</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Длительность эксперимента: <b className="text-[#EF3124]">{abParams.test_duration_days} дней</b>
                  </label>
                  <input
                    type="range"
                    min="7"
                    max="30"
                    step="7"
                    value={abParams.test_duration_days}
                    onChange={(e) => setAbParams({ ...abParams, test_duration_days: Number(e.target.value) })}
                    className="w-full accent-[#EF3124]"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">Стандартный двухнедельный спринт</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRunABSim}
                  className="bg-[#EF3124] hover:bg-[#CC190D] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Пересчитать экономический эффект
                </button>
              </div>

              {/* Simulation Results Display */}
              {abResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* Traffic & Power */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                      Статистический дизайн
                    </span>
                    <div className="space-y-1.5 text-xs text-gray-700">
                      <div className="flex justify-between">
                        <span>Суммарный объем выборки:</span>
                        <b className="text-gray-900">{abResult.traffic.total_visitors.toLocaleString()} юзеров</b>
                      </div>
                      <div className="flex justify-between">
                        <span>Группы А / B:</span>
                        <b className="text-gray-900">50% / 50%</b>
                      </div>
                      <div className="flex justify-between">
                        <span>Уровень значимости (α):</span>
                        <b className="text-gray-900">0.05 (95% CI)</b>
                      </div>
                      <div className="flex justify-between">
                        <span>Мощность теста (1 - β):</span>
                        <b className="text-gray-900">80%</b>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 font-medium">
                      ✓ {abResult.statistical_design.recommendation}
                    </div>
                  </div>

                  {/* Conversion Uplift */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                      Конверсия в покупку (Primary KPI)
                    </span>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Группа А (Контроль / Бейзлайн):</span>
                          <b>{abResult.conversion_rates.baseline_cr}</b>
                        </div>
                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-gray-400 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-gray-900 mb-1">
                          <span className="font-bold">Группа B (Гибридный RecSys):</span>
                          <b className="text-emerald-600">{abResult.conversion_rates.expected_test_cr}</b>
                        </div>
                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '38%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-gray-500 border-t border-gray-100 flex justify-between">
                      <span>Относительный Uplift:</span>
                      <b className="text-emerald-600 font-bold">{abResult.conversion_rates.relative_uplift}</b>
                    </div>
                  </div>

                  {/* Business & Revenue Impact */}
                  <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-xl border border-red-100 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-[#EF3124] uppercase tracking-wider block">
                      Бизнес-эффект для Альфа-Банка
                    </span>
                    <div>
                      <span className="text-xs text-gray-500">Дополнительная выручка за тест ({abResult.traffic.duration_days} дн):</span>
                      <p className="text-2xl font-black text-gray-900 mt-1">
                        +{abResult.business_impact.test_incremental_revenue_rub.toLocaleString()} ₽
                      </p>
                    </div>
                    <div className="pt-2 border-t border-red-100">
                      <span className="text-xs text-gray-500">Годовой проекционный эффект:</span>
                      <p className="text-lg font-extrabold text-[#EF3124]">
                        +{abResult.business_impact.annual_projected_revenue_gain_rub.toLocaleString()} ₽
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Guardrail Metrics Box */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Контрольные и защитные метрики (Guardrail Metrics):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-700">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <b className="block text-gray-900 mb-0.5">30-day Retention / DAU</b>
                    <span>Частота повторных визитов за бесплатными шаблонами и следующими шагами</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <b className="block text-gray-900 mb-0.5">Completion Rate</b>
                    <span>Доля реального прохождения рекомендованных чек-листов и курсов</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <b className="block text-gray-900 mb-0.5">Negative Feedback Rate</b>
                    <span>Отсутствие раздражения и жалоб на нерелевантный или навязчивый контент</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Architecture Tab */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#EF3124]" />
                <span>Архитектура решения и принципы работы</span>
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Система построена на принципах Clean Architecture и Clean Code с разделением слоев данных,
                двухстадийного рекомендательного пайплайна и REST API.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                    1. Семантический отбор (Retrieval)
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    TF-IDF векторизация запроса с n-gram (1,2) и суб-линейным масштабированием частот.
                    Жесткая фильтрация критических нестыковок: сложный курс финдиректора блокируется для новичка,
                    а регистрация ИП не навязывается селлеру с оборотом 3.5 млн.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                    2. Многокритериальный ранкер (Ranking)
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Формула балансирует релевантность задаче (40%), совпадение по стадии бизнеса (30%),
                    воронку конверсии Free→Paid (15%) и фактор применимости/быстрого дофамина (15%).
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                    3. Интерпретируемость (XAI) и Next Step
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Каждая карточка дает честное обоснование «Почему подходит именно вам» и строит следующий
                    шаг — мостик от бесплатного чек-листа к платному курсу монетизации.
                  </p>
                </div>
              </div>

              {/* Formula Callout */}
              <div className="bg-gray-900 text-white p-5 rounded-xl space-y-2 font-mono text-xs">
                <span className="text-red-400 font-bold block">// Формула ранжирования RecSys Core</span>
                <p className="text-gray-300">
                  FinalScore = 0.40 * SemanticRelevance + 0.30 * StageFit + 0.15 * FunnelScore + 0.15 * Actionability
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-500">
        <p>Разработано для хакатона Changellenge Hack&Change 2026 • Кейс АО «Альфа-Банк»</p>
        <p className="mt-1 font-mono text-[11px] text-gray-400">Zero-Config Docker Deployment • Port 8000</p>
      </footer>
    </div>
  );
}
