import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  History,
  Search,
  Trash2,
  Download,
  Terminal,
  MessageSquare,
  Mic,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownCircle,
  Filter,
} from 'lucide-react';
import { HistoryMessageEntry, CommandLogEntry } from '../types';
import {
  getHistoryMessages,
  getCommandLogs,
  clearAllHistory,
  exportHistoryAsJSON,
  exportHistoryAsTXT,
} from '../utils/historyStorage';

interface HistoryModalProps {
  assistantName: string;
  onClose: () => void;
  onHistoryCleared?: () => void;
}

type TabType = 'conversation' | 'commands';
type FilterType =
  | 'ALL'
  | 'USER'
  | 'ASSISTANT'
  | 'VOICE'
  | 'TEXT'
  | 'SUCCESS'
  | 'FAILED';

export const HistoryModal: React.FC<HistoryModalProps> = ({
  assistantName,
  onClose,
  onHistoryCleared,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('conversation');
  const [messages, setMessages] = useState<HistoryMessageEntry[]>([]);
  const [logs, setLogs] = useState<CommandLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [pageSize, setPageSize] = useState<number>(50);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Async load history on mount
  useEffect(() => {
    const loadedMsgs = getHistoryMessages();
    const loadedLogs = getCommandLogs();
    setMessages(loadedMsgs);
    setLogs(loadedLogs);
  }, []);

  const displayName = assistantName || 'MYRA';

  // Helper for Date Grouping (Today, Yesterday, Older)
  const getDateLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (checkDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (checkDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Filtered & Searched Conversation Messages
  const filteredMessages = useMemo(() => {
    let result = messages;

    // Filter by category
    if (activeFilter === 'USER') {
      result = result.filter((m) => m.speaker === 'User');
    } else if (activeFilter === 'ASSISTANT') {
      result = result.filter((m) => m.speaker === 'Assistant');
    } else if (activeFilter === 'VOICE') {
      result = result.filter((m) => m.inputType === 'voice');
    } else if (activeFilter === 'TEXT') {
      result = result.filter((m) => m.inputType === 'text');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => {
        const timeStr = new Date(m.timestamp).toLocaleTimeString().toLowerCase();
        const dateStr = new Date(m.timestamp).toLocaleDateString().toLowerCase();
        return (
          m.content.toLowerCase().includes(q) ||
          (m.commandExecuted && m.commandExecuted.toLowerCase().includes(q)) ||
          m.sessionId.toLowerCase().includes(q) ||
          timeStr.includes(q) ||
          dateStr.includes(q)
        );
      });
    }

    return result;
  }, [messages, activeFilter, searchQuery]);

  // Group Conversation Messages by Date Label
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: HistoryMessageEntry[] } = {};
    const visibleMsgs = filteredMessages.slice(0, pageSize);

    visibleMsgs.forEach((msg) => {
      const label = getDateLabel(msg.timestamp);
      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
    });

    return groups;
  }, [filteredMessages, pageSize]);

  // Filtered & Searched Command Logs
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (activeFilter === 'SUCCESS') {
      result = result.filter((l) => l.status === 'SUCCESS');
    } else if (activeFilter === 'FAILED') {
      result = result.filter((l) => l.status === 'FAILED');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => {
        const timeStr = new Date(l.timestamp).toLocaleTimeString().toLowerCase();
        const dateStr = new Date(l.timestamp).toLocaleDateString().toLowerCase();
        return (
          l.receivedInput.toLowerCase().includes(q) ||
          l.parsedCommand.toLowerCase().includes(q) ||
          l.actionExecuted.toLowerCase().includes(q) ||
          (l.errorMessage && l.errorMessage.toLowerCase().includes(q)) ||
          timeStr.includes(q) ||
          dateStr.includes(q)
        );
      });
    }

    return result;
  }, [logs, activeFilter, searchQuery]);

  const visibleLogs = useMemo(() => {
    return filteredLogs.slice(0, pageSize);
  }, [filteredLogs, pageSize]);

  const handleClearHistory = () => {
    clearAllHistory();
    setMessages([]);
    setLogs([]);
    setShowClearConfirm(false);
    if (onHistoryCleared) onHistoryCleared();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn"
      id="history-modal-overlay"
    >
      <div className="w-full max-w-4xl h-[90vh] bg-[#0A0A0A] border border-[#222222] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-[#121212] border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF1744]/10 border border-[#FF1744]/30 text-[#FF1744]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wider uppercase font-sans flex items-center gap-2">
                {displayName} Activity History
              </h2>
              <p className="text-[11px] font-mono text-[#888888]">
                Room Persistent DB • {messages.length} Messages • {logs.length} Command Logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Button & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FF1744]/50 text-xs font-mono text-white flex items-center gap-1.5 transition-all"
                title="Export History"
              >
                <Download className="w-3.5 h-3.5 text-[#FF1744]" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-[#141414] border border-[#333333] rounded-xl shadow-xl z-50 p-1 font-mono text-xs">
                  <button
                    onClick={() => {
                      exportHistoryAsJSON(displayName);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-white hover:bg-[#FF1744]/20 hover:text-[#FF1744] transition-all flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" /> Export as JSON
                  </button>
                  <button
                    onClick={() => {
                      exportHistoryAsTXT(displayName);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-white hover:bg-[#FF1744]/20 hover:text-[#FF1744] transition-all flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" /> Export as TXT
                  </button>
                </div>
              )}
            </div>

            {/* Clear History Button */}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FF1744] text-[#888888] hover:text-[#FF1744] transition-all"
              title="Clear All History"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#888888] hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Conversation vs Command Logs) */}
        <div className="px-5 pt-3 pb-2 bg-[#0E0E0E] border-b border-[#222222] flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('conversation');
                setActiveFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
                activeTab === 'conversation'
                  ? 'bg-[#FF1744] text-white shadow-[0_0_15px_rgba(255,23,68,0.4)]'
                  : 'bg-[#181818] border border-[#2B2B2B] text-[#888888] hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Conversation History ({messages.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('commands');
                setActiveFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
                activeTab === 'commands'
                  ? 'bg-[#FF1744] text-white shadow-[0_0_15px_rgba(255,23,68,0.4)]'
                  : 'bg-[#181818] border border-[#2B2B2B] text-[#888888] hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Command Logs ({logs.length})</span>
            </button>
          </div>

          {activeTab === 'conversation' && (
            <button
              onClick={scrollToBottom}
              className="px-2.5 py-1 bg-[#1A1A1A] border border-[#333333] hover:border-[#FF1744] rounded-lg text-[11px] font-mono text-[#AAAAAA] hover:text-white flex items-center gap-1"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-[#FF1744]" />
              <span>Scroll to Latest</span>
            </button>
          )}
        </div>

        {/* Search Bar & Filter Chips Bar */}
        <div className="p-4 bg-[#0A0A0A] border-b border-[#222222] space-y-2.5">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${
                activeTab === 'conversation' ? 'conversation history' : 'command logs'
              } by message, command, date, or time...`}
              className="w-full bg-[#121212] border border-[#2B2B2B] focus:border-[#FF1744] rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-[#555555] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-[#888888] hover:text-white font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-[#666666] flex items-center gap-1 mr-1 text-[11px]">
              <Filter className="w-3 h-3" /> Filter:
            </span>

            {activeTab === 'conversation' ? (
              <>
                {(['ALL', 'USER', 'ASSISTANT', 'VOICE', 'TEXT'] as FilterType[]).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                        activeFilter === f
                          ? 'bg-[#FF1744]/20 border border-[#FF1744] text-[#FF1744] font-bold'
                          : 'bg-[#141414] border border-[#222222] text-[#888888] hover:text-white'
                      }`}
                    >
                      {f === 'ALL'
                        ? 'All Messages'
                        : f === 'USER'
                        ? 'User Only'
                        : f === 'ASSISTANT'
                        ? 'Assistant Only'
                        : f === 'VOICE'
                        ? 'Voice Input'
                        : 'Text Input'}
                    </button>
                  )
                )}
              </>
            ) : (
              <>
                {(['ALL', 'SUCCESS', 'FAILED'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                      activeFilter === f
                        ? 'bg-[#FF1744]/20 border border-[#FF1744] text-[#FF1744] font-bold'
                        : 'bg-[#141414] border border-[#222222] text-[#888888] hover:text-white'
                    }`}
                  >
                    {f === 'ALL'
                      ? 'All Commands'
                      : f === 'SUCCESS'
                      ? 'Success'
                      : 'Failed'}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#050505]">
          {activeTab === 'conversation' ? (
            /* CONVERSATION HISTORY TAB */
            filteredMessages.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-[#555555] space-y-2">
                <MessageSquare className="w-10 h-10 text-[#222222]" />
                <p className="text-sm font-medium">No conversation history found</p>
                <p className="text-xs font-mono text-[#444444]">
                  {searchQuery ? 'Try clearing your search query' : 'Start chatting to record messages'}
                </p>
              </div>
            ) : (
              <>
                {Object.entries(groupedMessages).map(([dateLabel, msgs]) => {
                  const groupMsgs = msgs as HistoryMessageEntry[];
                  return (
                    <div key={dateLabel} className="space-y-3">
                      {/* Date Section Header */}
                      <div className="sticky top-0 z-10 py-1 px-3 bg-[#111111]/90 backdrop-blur-md border border-[#222222] rounded-xl flex items-center justify-between text-xs font-mono text-[#FF1744]">
                        <span className="font-bold tracking-widest uppercase">
                          📅 {dateLabel}
                        </span>
                        <span className="text-[10px] text-[#666666]">
                          {groupMsgs.length} messages
                        </span>
                      </div>

                      {/* Messages in Date Group */}
                      <div className="space-y-2.5 pl-2">
                        {groupMsgs.map((msg) => {
                        const timeStr = new Date(msg.timestamp).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                        );

                        return (
                          <div
                            key={msg.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              msg.speaker === 'User'
                                ? 'bg-[#110505] border-[#FF1744]/40 ml-4 sm:ml-12'
                                : 'bg-[#0E0E0E] border-[#222222] mr-4 sm:mr-12'
                            }`}
                          >
                            {/* Card Header Info */}
                            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold uppercase tracking-wider ${
                                    msg.speaker === 'User'
                                      ? 'text-[#EEEEEE]'
                                      : 'text-[#FF1744]'
                                  }`}
                                >
                                  {msg.speaker === 'User' ? 'User' : displayName}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1A1A1A] border border-[#333333] text-[#888888] flex items-center gap-1">
                                  {msg.inputType === 'voice' ? (
                                    <Mic className="w-2.5 h-2.5 text-[#FF1744]" />
                                  ) : (
                                    <FileText className="w-2.5 h-2.5 text-[#00E676]" />
                                  )}
                                  {msg.inputType}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-[#666666]">
                                <Clock className="w-3 h-3 text-[#666666]" />
                                <span>{timeStr}</span>
                                <span className="hidden sm:inline text-[#444444]">
                                  ID: {msg.sessionId}
                                </span>
                              </div>
                            </div>

                            {/* Message Text */}
                            <p className="text-sm text-[#DDDDDD] whitespace-pre-wrap leading-relaxed font-sans">
                              {msg.content}
                            </p>

                            {/* Executed Command Tag */}
                            {msg.commandExecuted && (
                              <div className="mt-2 pt-2 border-t border-[#222222] flex items-center gap-1.5 text-xs font-mono text-[#00E676]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                                <span>Executed: {msg.commandExecuted}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

                {/* Pagination extension if items exceed pageSize */}
                {filteredMessages.length > pageSize && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setPageSize((prev) => prev + 50)}
                      className="px-4 py-2 bg-[#1A1A1A] border border-[#333333] hover:border-[#FF1744] rounded-xl text-xs font-mono text-white transition-all"
                    >
                      Load More Messages ({filteredMessages.length - pageSize} remaining)
                    </button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )
          ) : (
            /* COMMAND LOGS TAB */
            visibleLogs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-[#555555] space-y-2">
                <Terminal className="w-10 h-10 text-[#222222]" />
                <p className="text-sm font-medium">No command logs found</p>
                <p className="text-xs font-mono text-[#444444]">
                  Execute voice commands like "torch on" or "open YouTube" to generate logs
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleDateString();
                  const timeStr = new Date(log.timestamp).toLocaleTimeString();

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl bg-[#0E0E0E] border border-[#222222] hover:border-[#333333] transition-all space-y-2 font-mono text-xs"
                    >
                      {/* Top Bar of Log Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#FF1744]" />
                          <span className="text-white font-bold">{timeStr}</span>
                          <span className="text-[#666666] text-[10px]">{dateStr}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#888888]">
                            Duration: {log.executionDurationMs} ms
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                              log.status === 'SUCCESS'
                                ? 'bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676]'
                                : 'bg-[#FF1744]/10 border border-[#FF1744]/40 text-[#FF1744]'
                            }`}
                          >
                            {log.status === 'SUCCESS' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {log.status}
                          </span>
                        </div>
                      </div>

                      {/* Log Card Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-[#666666] text-[10px] uppercase block">
                            Received Voice Input:
                          </span>
                          <span className="text-white">"{log.receivedInput}"</span>
                        </div>

                        <div>
                          <span className="text-[#666666] text-[10px] uppercase block">
                            Parsed Command:
                          </span>
                          <span className="text-[#00E676]">{log.parsedCommand}</span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[#666666] text-[10px] uppercase block">
                          Action Executed:
                        </span>
                        <span className="text-[#DDDDDD]">{log.actionExecuted}</span>
                      </div>

                      {log.errorMessage && (
                        <div className="mt-1 p-2 rounded-lg bg-[#FF1744]/10 border border-[#FF1744]/30 text-[#FF1744] text-[11px]">
                          Reason: {log.errorMessage}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredLogs.length > pageSize && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setPageSize((prev) => prev + 50)}
                      className="px-4 py-2 bg-[#1A1A1A] border border-[#333333] hover:border-[#FF1744] rounded-xl text-xs font-mono text-white transition-all"
                    >
                      Load More Command Logs ({filteredLogs.length - pageSize} remaining)
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Clear History Confirmation Modal */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#121212] border border-[#FF1744]/60 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FF1744]/10 border border-[#FF1744]/40 text-[#FF1744] flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white uppercase font-sans">
                  Clear All History & Logs?
                </h3>
                <p className="text-xs text-[#AAAAAA] mt-1">
                  This action will permanently delete all stored conversation messages and command execution logs from Room local database.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-[#222222] text-xs font-mono text-[#888888] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  className="px-5 py-2 rounded-xl bg-[#FF1744] text-xs font-bold font-mono text-white shadow-lg hover:opacity-90"
                >
                  CONFIRM CLEAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
