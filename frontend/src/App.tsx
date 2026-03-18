/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  CloudUpload,
  Map as MapIcon,
  ClipboardCheck,
  Code,
  BookOpen,
  HelpCircle,
  Bell,
  Settings,
  Rocket,
  FileDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  ShieldCheck,
  Zap,
  Copy,
  Download,
  FileText,
  Sliders,
  Share,
  Cpu,
  Database,
  Globe,
  Layout,
  MessageSquare,
  X,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Page, NavItem, VerificationItem, MappingItem, ChatMessage } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Components ---

const Sidebar = ({ activePage, onPageChange }: { activePage: Page, onPageChange: (page: Page) => void }) => {
  const navItems: NavItem[] = [
    { id: 'upload', label: 'Architecture Upload', icon: 'CloudUpload' },
    { id: 'analysis', label: 'Analysis Report', icon: 'FileText' },
        { id: 'mapping', label: 'Service Mapping', icon: 'MapIcon' },
    { id: 'terraform', label: 'Terraform Output', icon: 'Code' },
  ];

  const IconMap: Record<string, any> = {
    CloudUpload, FileText, MapIcon, ClipboardCheck, Code
  };

  return (
    <aside className="h-screen w-72 left-0 top-0 sticky bg-surface-container-low flex flex-col p-6 gap-y-4 shrink-0 overflow-y-auto border-r border-outline-variant/10">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-black text-primary font-headline tracking-tighter">Google Cloud AI Agent</h1>
        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1 opacity-70 font-bold">V-0.0.1</p>
      </div>

      <nav className="flex-grow space-y-1">
        {navItems.map((item) => {
          const Icon = IconMap[item.icon];
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 text-sm font-medium",
                isActive
                  ? "bg-surface-container-lowest text-primary font-semibold shadow-[0_40px_40px_-5px_rgba(25,28,29,0.06)]"
                  : "text-on-surface-variant hover:bg-surface-container-lowest/50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>


    </aside>
  );
};

const TopBar = () => (
  <header className="flex justify-between items-center w-full px-8 py-4 bg-surface sticky top-0 z-50 border-b border-outline-variant/5">
    <div className="flex items-center gap-8">
      <span className="text-xl font-bold text-primary tracking-tighter font-headline"></span>
    </div>
    <div className="flex items-center gap-4">
      <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low">
        <Bell className="w-5 h-5" />
      </button>
      <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low">
        <Settings className="w-5 h-5" />
      </button>
      <div className="w-8 h-8 rounded-full overflow-hidden ml-2 bg-surface-container-high border border-outline-variant/20">
        <img
          src="https://picsum.photos/seed/architect/100/100"
          alt="Architect Profile"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  </header>
);

// --- Floating Chat ---

const FloatingChat = ({ messages, isLoading, onSendMessage }: { messages: ChatMessage[], isLoading: boolean, onSendMessage: (text: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 h-[450px] bg-surface-container-low rounded-xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/20 mb-4 glass-panel flex flex-col"
          >
            <div className="bg-primary p-3 text-on-primary flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="font-bold text-xs">Migration Agent</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-on-primary/70 hover:text-on-primary">
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 bg-surface-container-lowest/50">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/40">
                  <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-[10px]">No conversation history.</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={cn("flex flex-col max-w-[85%] gap-1", msg.role === 'user' ? "self-end items-end" : "self-start items-start")}>
                  <div className={cn("text-[10px] uppercase tracking-widest font-bold opacity-60 px-1", msg.role === 'user' ? "text-primary/70" : "text-secondary")}>
                    {msg.role === 'user' ? 'You' : 'Agent'}
                  </div>
                  <div className={cn("p-2 rounded-lg text-xs leading-relaxed whitespace-pre-wrap shadow-sm", msg.role === 'user' ? "bg-primary text-on-primary rounded-tr-none" : "bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/5")}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="self-start flex flex-col max-w-[85%] gap-1">
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 px-1 text-secondary">Agent</div>
                  <div className="p-2 rounded-lg rounded-tl-none bg-surface-container-high border border-outline-variant/5 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-secondary"></div>
                    <span className="text-[10px] text-on-surface-variant">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                onSendMessage(input);
                setInput('');
              }
            }} className="p-2 border-t border-outline-variant/10 bg-surface-container-low flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-2 py-1.5 rounded-md text-xs focus:border-primary focus:ring-0"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading} className="bg-primary text-white px-2.5 rounded-md font-bold text-xs flex items-center justify-center">
                <Send className="w-3 h-3" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform relative"
      >
        <MessageSquare className="w-5 h-5" />
        {messages.length > 0 && !isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-secondary rounded-full animate-ping"></span>
        )}
      </button>
    </div>
  );
};

// --- Page Views ---

const UploadPage = ({ onAnalyze, isLoading }: { onAnalyze: (desc: string, metadata?: any, file?: { type: string, base64: string } | null) => void, isLoading: boolean }) => {
  const [projectName, setProjectName] = useState('Alpha-Migration-V2');
  const [desc, setDesc] = useState('');

  const [rto, setRto] = useState('Within 4 hours');
  const [availability, setAvailability] = useState('Multi-AZ HA');
  const [traffic, setTraffic] = useState('Medium (1k~10k)');

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isMsa, setIsMsa] = useState(false);

  const [selectedFile, setSelectedFile] = useState<{ name: string, type: string, base64: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      setSelectedFile({
        name: file.name,
        type: file.type,
        base64: base64
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-12 relative">
      <PageHeader
        title="Architecture Upload"
        description="Upload your AWS architecture details and operational demands to map resources automatically."
      />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] space-y-6">
            <div className="space-y-4">
              {/* 📝 Service Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-primary tracking-widest uppercase">Service Description</h4>
                <div className="space-y-1">
                  <textarea
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe the service..."
                    className="w-full bg-surface-container-low border-none border-b-2 border-primary/20 focus:border-primary focus:ring-0 text-on-surface px-4 py-3 rounded-t-md text-sm resize-none"
                  />
                </div>
              </div>

              {/* 🛡️ Operational Goals */}
              <div className="pt-4 border-t border-outline-variant/30 space-y-3">
                <h4 className="text-xs font-bold text-primary tracking-widest uppercase">Operational Goals</h4>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant ml-1">Recovery Time Objective (RTO)</label>
                  <select value={rto} onChange={(e) => setRto(e.target.value)} className="w-full bg-surface-container-low border-none border-b border-primary/20 text-on-surface px-3 py-2 rounded text-xs">
                    <option>Within 1 hour</option>
                    <option>Within 4 hours</option>
                    <option>Within 24 hours</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant ml-1">Availability (SLA) Goal</label>
                  <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full bg-surface-container-low border-none border-b border-primary/20 text-on-surface px-3 py-2 rounded text-xs">
                    <option>Single AZ</option>
                    <option>Multi-AZ HA</option>
                    <option>Multi-Region DR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant ml-1">Estimated Traffic Scale</label>
                  <select value={traffic} onChange={(e) => setTraffic(e.target.value)} className="w-full bg-surface-container-low border-none border-b border-primary/20 text-on-surface px-3 py-2 rounded text-xs">
                    <option>Small (&lt; 1k)</option>
                    <option>Medium (1k~10k)</option>
                    <option>Large (10k+)</option>
                  </select>
                </div>
              </div>

              {/* 🏗️ Architecture */}
              <div className="pt-4 border-t border-outline-variant/30 space-y-3">
                <h4 className="text-xs font-bold text-primary tracking-widest uppercase">Architecture</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                    <input type="checkbox" checked={isMonitoring} onChange={(e) => setIsMonitoring(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 bg-surface-container-low border border-primary/20" />
                    Centralized Logging & Monitoring
                  </label>
                  <label className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                    <input type="checkbox" checked={isMsa} onChange={(e) => setIsMsa(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 bg-surface-container-low border border-primary/20" />
                    Microservices Architecture
                  </label>
                </div>
              </div>
            </div>
          </section>


        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <div
            className={cn(
              "bg-surface-container-lowest p-2 rounded-xl shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] flex-1 min-h-[400px] flex flex-col relative",
              isDragging && "border-2 border-dashed border-primary bg-primary/5"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = e.dataTransfer.files;
              if (files && files.length > 0) handleFile(files[0]);
            }}
          >
            <div
              onClick={() => document.getElementById('architecture-file-input')?.click()}
              className="h-full flex-1 border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center p-12 group hover:border-primary transition-colors cursor-pointer"
            >
              <input
                type="file"
                id="architecture-file-input"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) handleFile(files[0]);
                }}
              />
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CloudUpload className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-2">Workspace Console</h3>
              {selectedFile ? (
                <div className="text-center flex flex-col items-center">
                  <img
                    src={`data:${selectedFile.type};base64,${selectedFile.base64}`}
                    alt="Architecture Preview"
                    className="max-h-48 object-contain rounded-lg shadow-md mb-4 border border-outline-variant/30"
                  />
                  <p className="text-primary font-bold text-sm mb-1">Selected File: {selectedFile.name}</p>
                  <p className="text-on-surface-variant text-xs">Click to change file</p>
                </div>
              ) : (
                <p className="text-on-surface-variant text-center max-w-sm mb-8">Execute architecture mapping using description and loaded metadata variables.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => onAnalyze(desc, { rto, availability, traffic, isMonitoring, isMsa }, selectedFile)}
              disabled={isLoading || (!desc.trim() && !selectedFile)}
              className={cn(
                "bg-gradient-to-r from-primary to-primary-container text-on-primary px-12 py-5 rounded-md font-bold text-lg shadow-xl hover:shadow-primary/20 active:scale-95 transition-all flex items-center gap-3",
                (isLoading || (!desc.trim() && !selectedFile)) && "opacity-50 cursor-not-allowed"
              )}
            >
              Analyze Architecture
              <Zap className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PageHeader = ({
  step,
  title,
  description,
  rightElement
}: {
  step?: string,
  title: string,
  description: string,
  rightElement?: React.ReactNode
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
      <div>
        {step && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-secondary font-mono text-xs font-bold tracking-widest uppercase">{step}</span>
            <div className="h-px w-8 bg-secondary/30"></div>
          </div>
        )}
        <h1 className="text-5xl font-bold font-headline tracking-tighter text-on-surface">{title}</h1>
        <p className="text-on-surface-variant mt-2 max-w-md text-sm font-medium">{description}</p>
      </div>
      {rightElement && (
        <div className="flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
};

const ApprovalPanel = ({
  title = "Analysis & Verification Complete - Awaiting Approval",
  description = "Architecture design needs approval to proceed to the next step.",
  onConfirm,
  onFeedback,
  isLoading,
  confirmText = "Approve & Proceed",
  feedbackText = "Add Feedback",
  feedbackPlaceholder = "e.g. 'Please adjust...'"
}: {
  title?: string,
  description?: string,
  onConfirm: () => void,
  onFeedback?: (text: string) => void,
  isLoading: boolean,
  confirmText?: string,
  feedbackText?: string,
  feedbackPlaceholder?: string
}) => {
  const feedbackInputRef = useRef<HTMLTextAreaElement>(null);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  return (
    <div className="space-y-4 mb-8">
      <div className="glass-panel p-6 rounded-xl border border-secondary/30 bg-secondary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div>
          <h4 className="font-headline font-bold text-lg text-secondary">{title}</h4>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
        <div className="flex gap-3">
          {onFeedback && (
            <button
              onClick={() => setShowFeedbackInput(!showFeedbackInput)}
              className="bg-surface text-secondary border border-secondary/30 px-6 py-2.5 rounded-md font-bold text-xs hover:bg-surface-container transition-all flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {feedbackText}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-secondary text-white px-8 py-2.5 rounded-md font-bold text-xs shadow-md hover:scale-105 transition-transform flex items-center gap-1"
          >
            {confirmText}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showFeedbackInput && onFeedback && (
        <div className="bg-surface-container-high p-4 rounded-xl space-y-3 border border-outline-variant/10 animate-fadeIn">
          <label className="text-xs font-bold text-on-surface-variant ml-1">Adjustment Feedback Form</label>
          <textarea
            ref={feedbackInputRef}
            rows={4}
            placeholder={feedbackPlaceholder}
            className="w-full bg-surface-container border border-outline-variant/30 text-on-surface px-4 py-3 rounded-lg text-sm resize-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          <div className="flex justify-end gap-x-2 mt-2">
            <button onClick={() => setShowFeedbackInput(false)} className="text-xs text-on-surface-variant px-3 py-1.5 rounded hover:bg-surface-container">Cancel</button>
            <button
              onClick={() => {
                const text = feedbackInputRef.current?.value;
                if (text && text.trim() && onFeedback) {
                  onFeedback(text);
                  setShowFeedbackInput(false);
                }
              }}
              disabled={!feedbackInputRef.current?.value.trim() || isLoading}
              className="bg-primary text-on-primary px-4 py-1.5 rounded text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const MappingPage = ({ mappings, onConfirm, awaitingApproval, isLoading }: { mappings: MappingItem[], onConfirm: () => void, awaitingApproval: boolean, isLoading: boolean }) => {
  return (
    <div className="space-y-10">
      <PageHeader
        step="Step 03"
        title="Service Mapping"
        description="Automated translation of source infrastructure into target-native cloud services."
      />

      {awaitingApproval && (
        <ApprovalPanel
          title="Mapping Complete - Awaiting Approval"
          description="Infrastructure service mapping complete. Proceed to generate Terraform Output?"
          confirmText="Proceed & Generate TF"
          onConfirm={onConfirm}
          isLoading={isLoading}
        />
      )}

      <div className="grid grid-cols-12 gap-8 mb-4">
        <div className="col-span-5 text-on-surface-variant font-mono text-[10px] uppercase tracking-[0.2em]">Source Identity (AWS)</div>
        <div className="col-span-2"></div>
        <div className="col-span-5 text-on-surface-variant font-mono text-[10px] uppercase tracking-[0.2em]">Target Identity (GCP)</div>
      </div>

      <div className="space-y-6">
        {mappings.length === 0 ? (
          <p className="text-center text-on-surface-variant italic p-12 bg-surface-container-lowest rounded-md">No mappings generated yet. Please trigger 'Analyze Architecture' from the upload tab.</p>
        ) : (
          mappings.map((item, i) => (
            <div key={i} className="grid grid-cols-12 items-center">
              <div className="col-span-5 bg-surface-container-lowest p-6 rounded-md shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] border-l-4 border-[#ff9900]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#ff9900]/10 rounded flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-[#ff9900]" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg">{item.source.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono truncate max-w-[200px] font-bold">{item.source.id}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 flex flex-col items-center justify-center px-4">
                <div className={cn("text-[10px] font-mono font-bold mb-1", item.confidence >= 95 ? "text-green-600" : "text-primary")}>
                  {item.confidence}%
                </div>
                <div className="h-0.5 w-full bg-gradient-to-r from-[#ff9900] via-primary to-primary-container relative">
                  <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-4 ring-surface", item.status === 'verified' ? "bg-primary" : "bg-secondary")}></div>
                </div>
              </div>

              <div className="col-span-5 bg-surface-container-lowest p-6 rounded-md shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] border-r-4 border-primary">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg">{item.target.name}</h3>
                      <p className="text-xs text-on-surface-variant font-mono truncate max-w-[200px] font-bold">{item.target.id || "N/A"}</p>
                    </div>
                  </div>
                  {item.status === 'verified' ? (
                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
                  ) : (
                    <Clock className="w-5 h-5 text-secondary" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


const AnalysisPage = ({ report, checklistItems, awaitingApproval, onConfirm, onFeedback, isLoading, setLoadingMsg }: { report: string, checklistItems: VerificationItem[], awaitingApproval: boolean, onConfirm: () => void, onFeedback: (text: string) => void, isLoading: boolean, setLoadingMsg: (msg: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'checklist'>('report');

  return (
    <div className="space-y-10">
      <PageHeader
        step="Step 01"
        title="Analysis Report & Quality Audit"
        description="Detailed architecture audit, breakdown, and validation checklist."
      />

      {awaitingApproval && (
        <ApprovalPanel
          title="Analysis & Audit Complete - Awaiting Approval"
          description="Architecture analysis and quality audit complete. Proceed to GCP Resource Mapping?"
          confirmText="Approve & Proceed"
          onConfirm={() => {
            setLoadingMsg("✅ Approval complete. Generating GCP service mappings...");
            onConfirm();
          }}
          onFeedback={(text) => {
            setLoadingMsg("💡 Adjusting architecture based on feedback...");
            onFeedback(text);
          }}
          isLoading={isLoading}
        />
      )}

      {(!report && (!checklistItems || checklistItems.length === 0)) ? (
        <p className="text-center text-on-surface-variant italic p-12 bg-surface-container-lowest rounded-md">No detailed analysis report generated yet.</p>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] border border-outline-variant/10 relative flex flex-col overflow-hidden">
          
          {/* Tabs Header */}
          <div className="flex border-b border-outline-variant/20 bg-surface-container-low px-6 pt-4 shrink-0">
            <button
              onClick={() => setActiveTab('report')}
              className={cn(
                "px-6 py-3 font-bold text-sm border-b-2 transition-colors",
                activeTab === 'report' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
              )}
            >
              Analysis Report
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={cn(
                "px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2",
                activeTab === 'checklist' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
              )}
            >
              Quality Audit Checklist
              {checklistItems && checklistItems.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{checklistItems.length}</span>
              )}
            </button>
          </div>

          {/* Tabs Content */}
          <div className="p-8 flex-1 overflow-auto max-h-[800px]">
            {activeTab === 'report' && (
              <div className="text-on-surface">
                {report ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-4xl font-headline font-semibold text-primary mt-6 mb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-3xl font-headline font-semibold text-on-surface mt-8 mb-4 pb-2 border-b border-outline-variant/30" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-xl font-headline font-bold text-on-surface mt-5 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="text-on-surface-variant leading-relaxed mb-4 text-sm" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2 text-sm text-on-surface-variant" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-sm text-on-surface-variant" {...props} />,
                      li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                      table: ({ node, ...props }) => <div className="overflow-x-auto my-6"><table className="w-full border-collapse border border-outline-variant/20 rounded-lg text-sm" {...props} /></div>,
                      thead: ({ node, ...props }) => <thead className="bg-surface-container-high text-on-surface font-bold text-left" {...props} />,
                      tbody: ({ node, ...props }) => <tbody className="divide-y divide-outline-variant/10 text-on-surface" {...props} />,
                      tr: ({ node, ...props }) => <tr className="hover:bg-surface-container-low/30 transition-colors" {...props} />,
                      th: ({ node, ...props }) => <th className="p-3 border-b border-outline-variant/20 font-bold text-on-surface text-xs uppercase tracking-wider" {...props} />,
                      td: ({ node, ...props }) => <td className="p-3 align-top leading-relaxed text-on-surface-variant" {...props} />,
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <div className="rounded-md overflow-hidden my-4 border border-outline-variant/20">
                            <div className="bg-surface-container-high px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                              <Code className="w-3 h-3" />
                              {match[1]}
                            </div>
                            <pre className="bg-[#1e1e1e] p-4 overflow-x-auto text-sm">
                              <code className="text-[#d4d4d4] font-mono" {...props}>{children}</code>
                            </pre>
                          </div>
                        ) : (
                          <code className="bg-surface-container-low text-primary px-1.5 py-0.5 rounded text-sm font-mono border border-primary/10" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {report}
                  </ReactMarkdown>
                ) : (
                  <p className="text-center text-on-surface-variant italic py-8">Report data is empty.</p>
                )}
              </div>
            )}

            {activeTab === 'checklist' && (
              <div className="space-y-6">
                {(!checklistItems || checklistItems.length === 0) ? (
                  <p className="text-center text-on-surface-variant italic py-8">No checklist items generated.</p>
                ) : (
                  checklistItems.map((item) => (
                    <div key={item.id} className={cn(
                      "group transition-all duration-300 p-6 flex items-start gap-6 rounded-xl relative overflow-hidden border shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                      item.status === 'complete' ? "bg-emerald-50/20 border-emerald-200/50 hover:bg-emerald-50/40" :
                        item.status === 'warning' ? "bg-amber-50/20 border-amber-200/50 hover:bg-amber-50/40" :
                          "bg-slate-50/40 border-slate-200/60 hover:bg-slate-50/60"
                    )}>
                      <div className={cn(
                        "w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg shadow-sm mt-1",
                        item.status === 'complete' ? "bg-white text-emerald-600 border border-emerald-100" :
                          item.status === 'warning' ? "bg-white text-amber-600 border border-amber-100" :
                            "bg-white text-slate-500 border border-slate-100"
                      )}>
                        {item.status === 'complete' ? <CheckCircle2 className="w-6 h-6" /> : item.status === 'warning' ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-mono font-bold text-on-surface-variant opacity-60">ID: {item.id}</span>
                        </div>
                        <h5 className="font-headline font-bold text-on-surface text-base">{item.title}</h5>
                        <p className="text-sm text-on-surface-variant">{item.description}</p>

                        <div className="flex items-center gap-1 mt-3 text-[11px] font-bold tracking-tight">
                          {item.status === 'complete' ? (
                            <span className="text-emerald-700 flex items-center gap-1">✅ Verified & Approved — Ready for deployment.</span>
                          ) : item.status === 'warning' ? (
                            <span className="text-amber-700 flex items-center gap-1">⚠️ Attention — Security or architecture concern detected. Certification recommended.</span>
                          ) : (
                            <span className="text-slate-600 flex items-center gap-1">⏳ 정보 부족으로 인해 판단이 보류되었습니다. 상세 설계를 확인해 주세요.</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm",
                          item.status === 'complete' ? "bg-emerald-100/80 text-emerald-800" : item.status === 'warning' ? "bg-amber-100/80 text-amber-800" : "bg-slate-100/80 text-slate-700"
                        )}>
                          {item.status === 'complete' ? 'Passed' : item.status === 'warning' ? 'Warning' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TerraformPage = ({ files }: { files: { [filename: string]: string } }) => {
  const fileNames = Object.keys(files);
  const [activeTab, setActiveTab] = useState<string>(fileNames[0] || 'main.tf');
  const code = files[activeTab] || "";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    Object.keys(files).forEach((name) => {
      zip.file(name, files[name]);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'terraform_blueprint.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full gap-y-6">
      <PageHeader
        step="Step 04"
        title="Terraform Output"
        description="Automated infrastructure generation from source mapping."
        rightElement={fileNames.length > 0 ? (
          <div className="flex gap-x-3">
            <button
              onClick={handleCopyCode}
              className="bg-surface-container-lowest text-on-surface px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-x-2 border border-outline-variant/10 hover:bg-surface-container transition-all active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Code</span>
            </button>
            <button
              onClick={handleExportZip}
              className="bg-surface-container-lowest text-on-surface px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-x-2 border border-outline-variant/10 hover:bg-surface-container transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export .zip</span>
            </button>
          </div>
        ) : null}
      />

      {fileNames.length === 0 ? (
        <p className="text-center text-on-surface-variant italic p-12 bg-surface-container-lowest rounded-md">No Terraform code generated yet.</p>
      ) : (
        <div className="flex-grow flex gap-x-12 min-h-0">
          <div className="flex-grow flex flex-col bg-surface-container-lowest rounded-xl shadow-[0_40px_40px_-5px_rgba(25,28,29,0.06)] border border-outline-variant/15 overflow-hidden">
            <div className="flex bg-surface-container-low px-4 pt-3 gap-x-1 overflow-x-auto">
              {fileNames.map((name) => (
                <div
                  key={name}
                  onClick={() => setActiveTab(name)}
                  className={cn(
                    "px-6 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-x-2 cursor-pointer transition-all",
                    activeTab === name
                      ? "bg-surface-container-lowest text-primary border-b-2 border-primary"
                      : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  {name}
                </div>
              ))}
            </div>
            <div className="flex-grow overflow-auto font-mono text-sm bg-[#ffffff] py-4">
              {code.split("\n").map((line, i) => (
                <div key={i} className="flex items-start hover:bg-surface-container-low/30 px-4 leading-6">
                  <div className="w-10 text-on-surface-variant/40 select-none text-right pr-3 font-mono border-r border-outline-variant/10 mr-4 shrink-0">
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                  <pre className="flex-1 whitespace-pre-wrap break-all text-[#24292e] font-mono">{line || " "}</pre>
                </div>
              ))}
            </div>

            <div className="bg-surface-container-low px-6 py-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <div className="flex items-center gap-x-6">
                <div className="flex items-center gap-x-2 text-primary">
                  <CheckCircle2 className="w-3 h-3 fill-primary" />
                  Validated Syntax
                </div>
                <div>UTF-8</div>
              </div>
              <div className="flex items-center gap-x-6">
                <div>Spaces: 2</div>
                <div>Ln 12, Col 4</div>
                <div className="text-tertiary">Terraform HCL</div>
              </div>
            </div>
          </div>
          {/* 우측 사이드바 제거됨 */}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activePage, setActivePage] = useState<Page>('upload');
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [checklist, setChecklist] = useState<VerificationItem[]>([]);
  const [analysisReport, setAnalysisReport] = useState<string>("");
  const [terraformFiles, setTerraformFiles] = useState<{ [filename: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [awaitingApproval, setAwaitingApproval] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>("Analyzing architecture...");

  const handleRunAgent = async (promptText: string, metadata?: any, file?: { type: string, base64: string } | null) => {
    setIsLoading(true);

    // 1. 사용자 메시지 버블 추가
    const userMsg: ChatMessage = { role: 'user', text: promptText };
    setMessages(prev => [...prev, userMsg]);

    let finalPrompt = promptText;
    if (metadata) {
      finalPrompt += `\n\n[📋 Infrastructure Operational Goals]\n- Recovery Time Objective (RTO): ${metadata.rto}\n- Availability (SLA) Goal: ${metadata.availability}\n- Estimated Traffic Scale: ${metadata.traffic}`;
      finalPrompt += `\n- Monitoring/Logging: Centralized logging and monitoring ${metadata.isMonitoring ? 'Enabled' : 'Disabled'}`;
      finalPrompt += `\n- Architecture Style: Microservices (MSA) style ${metadata.isMsa ? 'Enabled' : 'Disabled'}`;
    }

    const parts: any[] = [{ text: finalPrompt }];
    if (file) {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: file.base64
        }
      });
    }

    try {
      const res = await fetch("/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: "agent",
          userId: "cloud_arch_user",
          sessionId: "main_session_01",
          newMessage: {
            role: "user",
            parts: parts
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Backend Server Error (${res.status}): AI model is overloaded or internal processing failed. Please try again soon.`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        let fullText = "";
        // 🛡️ [수정] 모든 응답 파트를 순회하며 누적 합산하여 상세 리포트 유실을 원천 차단합니다.
        data.forEach(event => {
          if (event?.content?.parts) {
            event.content.parts.forEach((part: any) => {
              if (part.text) fullText += part.text + "\n";
            });
          }
        });

        if (fullText) {
          // 시스템 승인 플래그 인지 및 텍스트 세척
          const isAwaiting = fullText.includes("[AWAITING_USER_APPROVAL]");
          const cleanText = fullText.replace("[AWAITING_USER_APPROVAL]", "").trim();

          // 2. 에이전트 메시지 버블 추가
          const agentMsg: ChatMessage = { role: 'agent', text: cleanText };
          setMessages(prev => [...prev, agentMsg]);

          let navigated = false;
          let hasChecklistData = false;
          let isMappingOrCode = false;

          // 1. JSON Data Extraction for visual tabs
          if (fullText.includes("```json")) {
            const blocks = fullText.split("```json");
            for (let i = 1; i < blocks.length; i++) {
              let jsonStr = "";
              try {
                jsonStr = blocks[i].split("```")[0];

                // 🛡️ JSON 블록 후미에 HALLUCINATION/인증 태그 사족(예: [AWAITING...])이 붙는 예외 방어
                const lastBraceIndex = jsonStr.lastIndexOf("}");
                if (lastBraceIndex !== -1) {
                  jsonStr = jsonStr.substring(0, lastBraceIndex + 1);
                }

                const cleanedJson = jsonStr.replace(/,\s*([\]}])/g, "$1");
                const parsed = JSON.parse(cleanedJson);

                const checklistData = parsed.checklist || parsed.checklist_results;
                if (checklistData && Array.isArray(checklistData)) {
                  // 🛡️ [수정] 중첩 구조(category/items)와 평탄한 구조(flat list)를 모두 지원하도록 파싱 로직 강화
                  const flatChecklist = checklistData.flatMap((node: any) => {
                    if (node.items && Array.isArray(node.items)) {
                      // 중첩 구조인 경우
                      return node.items.map((item: any) => ({
                        id: item.id || item.check || Math.random().toString(),
                        title: item.check || item.title || "N/A",
                        description: item.details || item.description || item.note || "",
                        status: (item.status?.toLowerCase() === 'warning' || item.status?.toLowerCase() === 'error') ? 'warning' : 
                                (item.status?.toLowerCase() === 'complete' || item.status?.toLowerCase() === 'passed' || item.status?.toLowerCase() === 'pass') ? 'complete' : 'pending'
                      }));
                    } else {
                      // 평탄한 리스트인 경우
                      return [{
                        id: node.id || node.check || node.title || Math.random().toString(),
                        title: node.check || node.title || "N/A",
                        description: node.details || node.description || node.note || "",
                        status: (node.status?.toLowerCase() === 'warning' || node.status?.toLowerCase() === 'error') ? 'warning' : 
                                (node.status?.toLowerCase() === 'complete' || node.status?.toLowerCase() === 'passed' || node.status?.toLowerCase() === 'pass') ? 'complete' : 'pending'
                      }];
                    }
                  });

                  setChecklist(flatChecklist);
                  hasChecklistData = flatChecklist.length > 0;
                  // 🛡️ [수정] 즉시 페이지 이동 대신 데이터만 저장합니다. 이동은 하단 리포트 체크 로직에서 통합 제어합니다.
                }

                const mappingData = parsed.mappings || parsed.mappings_results;
                if (mappingData) {
                  setMappings(mappingData);
                  setActivePage('mapping'); // 매핑은 별도의 명확한 단계이므로 유지
                  navigated = true;
                  isMappingOrCode = true;
                }
              } catch (e) {
                console.error("⚠️ [App.tsx] JSON 파싱 실패 (원본):", jsonStr, e);
              }
            }
          }

          // 🛡️ [수정] 4단계 워크플로우에 맞춘 네비게이션
          if (cleanText.includes("### 📊") || cleanText.includes("### 🌐")) {
            // Step 1: 분석 결과 도착
            setAnalysisReport(cleanText);
            setActivePage('analysis');
            navigated = true;
          } else if (hasChecklistData) {
            // Step 2: 체크리스트 데이터 도착
            // AnalysisPage 내부의 Checklist 탭에서 볼 수 있도록 설정
            setActivePage('analysis'); 
            navigated = true;
          }

          // 2. Terraform HCL Extraction
          const files: { [key: string]: string } = {};
          const segments = fullText.split("### ");
          for (let i = 1; i < segments.length; i++) {
            const segment = segments[i];
            const lines = segment.split("\n");
            const filename = lines[0].trim().replace("[", "").replace("]", "");
            if (segment.includes("```hcl")) {
              const code = segment.split("```hcl")[1].split("```")[0];
              files[filename] = code;
              isMappingOrCode = true;
            } else if (segment.includes("```terraform")) {
              const code = segment.split("```terraform")[1].split("```")[0];
              files[filename] = code;
              isMappingOrCode = true;
            }
          }
          if (Object.keys(files).length > 0) {
            setTerraformFiles(files);
            setActivePage('terraform');
            navigated = true;
          } else if (fullText.includes("```hcl")) {
            const codeStr = fullText.split("```hcl")[1].split("```")[0];
            setTerraformFiles({ "main.tf": codeStr });
            setActivePage('terraform');
            navigated = true;
          } else if (fullText.includes("```terraform")) {
            const codeStr = fullText.split("```terraform")[1].split("```")[0];
            setTerraformFiles({ "main.tf": codeStr });
            setActivePage('terraform');
            navigated = true;
          }

          // 3. Fallback to Analysis (매핑이나 코드가 없고, 리포트 헤더가 포함된 경우에만 분석 페이지로 이동)
          if (!navigated && (cleanText.includes("### 📊") || cleanText.includes("### 🌐"))) {
            setActivePage('analysis');
          }

          // 3. Approval Check (HITL)
          setAwaitingApproval(isAwaiting);
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'agent', text: "❌ API Error: " + e.message }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto blueprint-grid">
          <div className="p-12 max-w-7xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {activePage === 'upload' && (
                  <UploadPage onAnalyze={(d, m, f) => {
                    setLoadingMsg("🔍 Analyzing generated infrastructure architecture...");
                    handleRunAgent(d, m, f);
                  }} isLoading={isLoading} />
                )}
                {activePage === 'analysis' && <AnalysisPage report={analysisReport} checklistItems={checklist} awaitingApproval={awaitingApproval} onConfirm={() => handleRunAgent("APPROVE_ANALYSIS")} onFeedback={(text) => handleRunAgent(text)} isLoading={isLoading} setLoadingMsg={setLoadingMsg} />}
                {activePage === 'mapping' && (
                  <MappingPage mappings={mappings} onConfirm={() => handleRunAgent("APPROVE_MAPPING")} awaitingApproval={awaitingApproval} isLoading={isLoading} />
                )}
                                {activePage === 'terraform' && <TerraformPage files={terraformFiles} />}
              </motion.div>
            </AnimatePresence>

            {/* 🛡️ 글로벌 로딩 오버레이 화면 격상 */}
            {isLoading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fadeIn">
                <div className="w-14 h-14 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4 shadow-xl"></div>
                <div className="bg-slate-900/95 px-10 py-4 rounded-full shadow-2xl border border-slate-800/40 flex items-center gap-4 animate-slideUp">
                  <div className="w-3 h-3 bg-secondary rounded-full animate-ping"></div>
                  <p className="text-white font-headline font-bold text-xl tracking-tight">{loadingMsg || "Analyzing appropriate cloud infrastructure..."}</p>
                </div>
              </div>
            )}

            <footer className="mt-20 pt-10 border-t border-outline-variant/10 flex items-center justify-between text-on-surface-variant opacity-40 italic text-xs">
              <p>Vertex Cloud Protocol • Automated System Validation Session #8812-B</p>
              <p>All timestamps are UTC-0</p>
            </footer>
          </div>
        </div>
      </main>

    </div>
  );
}

