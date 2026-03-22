/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, Fragment } from 'react';
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
  ChevronDown,
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
  Send,
  Loader2,
  Server,
  Activity,
  Terminal as TerminalIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Page, NavItem, VerificationItem, MappingItem, ChatMessage, AppMode } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';




// --- Common Markdown Styles ---
const SharedMarkdownComponents = {
  h1: ({ node, ...props }: any) => <h1 className="text-2xl font-headline font-bold text-primary mt-8 mb-4" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-xl font-headline font-bold text-on-surface mt-8 mb-3 pb-2 border-b border-outline-variant/30" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-lg font-headline font-semibold text-on-surface mt-6 mb-2" {...props} />,
  h4: ({ node, ...props }: any) => <h4 className="text-base font-headline font-medium text-on-surface mt-4 mb-2" {...props} />,
  p: ({ node, ...props }: any) => <p className="text-on-surface-variant leading-relaxed mb-4 text-sm" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-4 space-y-2 text-sm text-on-surface-variant" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-sm text-on-surface-variant" {...props} />,
  li: ({ node, ...props }: any) => <li className="pl-1 leading-relaxed" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-bold text-primary/90" {...props} />,
  table: ({ node, ...props }: any) => <div className="overflow-x-auto my-6"><table className="w-full border-collapse border border-outline-variant/20 rounded-lg text-sm" {...props} /></div>,
  thead: ({ node, ...props }: any) => <thead className="bg-surface-container-high text-on-surface font-bold text-left" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-outline-variant/10 text-on-surface" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-surface-container-low/30 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="p-3 border-b border-outline-variant/20 font-bold text-on-surface text-xs uppercase tracking-wider bg-surface-container" {...props} />,
  td: ({ node, ...props }: any) => <td className="p-3 align-top leading-relaxed text-on-surface-variant" {...props} />,
  code: ({ node, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <div className="rounded-md overflow-hidden my-4 border border-outline-variant/20 shadow-sm">
        <div className="bg-surface-container-high px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
          <Code className="w-3 h-3" />
          {match[1]}
        </div>
        <pre className="bg-[#1e1e1e] p-4 overflow-x-auto text-sm">
          <code className="text-[#d4d4d4] font-mono" {...props}>{children}</code>
        </pre>
      </div>
    ) : (
      <code className="bg-surface-container-low text-primary px-1.5 py-0.5 rounded text-sm font-mono border border-primary/10" {...props}>{children}</code>
    );
  }
};

// --- Components ---

const Sidebar = ({ activePage, onPageChange, appMode, onModeChange }: { activePage: Page, onPageChange: (page: Page) => void, appMode: AppMode, onModeChange: (mode: AppMode) => void }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [width, setWidth] = useState(280);
  const isResizing = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.userSelect = 'none'; // Prevent text selection during drag
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    let newWidth = e.clientX;
    if (newWidth < 200) newWidth = 200; // Min width constraint
    if (newWidth > 600) newWidth = 600; // Max width constraint
    setWidth(newWidth);
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.userSelect = '';
  };

  const migrationItems: NavItem[] = [
    { id: 'upload', label: 'Architecture Register', icon: 'CloudUpload' },
    { id: 'analysis', label: 'Analysis Report', icon: 'FileText' },
    { id: 'mapping', label: 'Service Mapping', icon: 'MapIcon' },
    { id: 'terraform', label: 'Terraform Output', icon: 'Code' },
  ];

  const advisorItems: NavItem[] = [
    { id: 'audit_setup', label: 'Configuration', icon: 'Settings' },
    { id: 'audit_report', label: 'Infra Report', icon: 'FileText' },
    { id: 'audit_live', label: 'Checklist', icon: 'Zap' },
  ];

  const navItems = appMode === 'migration' ? migrationItems : advisorItems;

  const getIcon = (name: string) => {
    const icons: { [key: string]: any } = { CloudUpload, MapIcon, ClipboardCheck, Code, FileText, Settings, Zap };
    const Icon = icons[name] || HelpCircle;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <aside style={{ width: `${width}px` }} className="bg-surface border-r border-outline-variant/20 flex flex-col h-full shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative transition-[width] duration-0">
      
      {/* Resizer Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute top-0 -right-1 w-2 h-full cursor-col-resize hover:bg-primary/20 z-50 flex items-center justify-center group"
      >
        <div className="w-0.5 h-8 bg-outline-variant/30 group-hover:bg-primary/50 rounded-full" />
      </div>

      <div className="flex-1 py-10 px-5 space-y-10 overflow-y-auto overflow-x-hidden">
        
        {/* GCP ADVISOR GROUP */}
        <div className="flex flex-col relative w-full">
          {/* Header */}
          <div className="mb-4">
             <div className="flex items-center gap-3 mb-1">
               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-tertiary/20 to-tertiary/5 flex items-center justify-center shrink-0 border border-tertiary/20 shadow-sm">
                 <ShieldCheck className="w-4 h-4 text-tertiary drop-shadow-sm" />
               </div>
               <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-tertiary">GCP Advisor</h3>
             </div>
             <p className="text-[10px] text-on-surface-variant/80 pl-11 pr-2 leading-relaxed">Audit infrastructure and ensure architectural compliance rules</p>
          </div>
          
          {/* Items */}
          <div className="relative pl-[18px] space-y-1.5">
            {/* Connecting vertical line */}
            <div className="absolute left-[15px] top-2 bottom-6 w-px bg-gradient-to-b from-outline-variant/30 via-outline-variant/20 to-transparent"></div>
            
            {advisorItems.map((item) => (
              <div key={item.id} className="relative group/item ml-3">
                {/* Horizontal branch line */}
                <div className={cn("absolute left-[-16px] top-1/2 w-4 h-[1.5px] rounded-full transition-colors duration-300", activePage === item.id ? "bg-tertiary/40" : "bg-outline-variant/30 group-hover/item:bg-tertiary/30")}></div>
                
                <button
                  onClick={() => { onModeChange('gcp_advisor'); onPageChange(item.id); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 relative overflow-hidden",
                    activePage === item.id
                      ? "bg-tertiary/10 text-tertiary ring-1 ring-tertiary/20 shadow-sm"
                      : "text-on-surface hover:bg-surface-container-high"
                  )}
                >
                  {activePage === item.id && (
                    <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary shadow-[0_0_12px_rgba(var(--color-tertiary),0.6)]" />
                  )}
                  <span className={cn("transition-colors z-10", activePage === item.id ? "text-tertiary" : "text-on-surface-variant group-hover/item:text-tertiary")}>
                    {getIcon(item.icon)}
                  </span>
                  <span className="tracking-wide z-10 text-[13px]">{item.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center w-full px-8">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent"></div>
        </div>

        {/* AWS MIGRATION GROUP */}
        <div className="flex flex-col relative w-full">
          {/* Header */}
          <div className="mb-4">
             <div className="flex items-center gap-3 mb-1">
               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center shrink-0 border border-secondary/20 shadow-sm">
                 <CloudUpload className="w-4 h-4 text-secondary drop-shadow-sm" />
               </div>
               <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-secondary">AWS Migration</h3>
             </div>
             <p className="text-[10px] text-on-surface-variant/80 pl-11 pr-2 leading-relaxed">Translate AWS architecture safely into GCP native definitions</p>
          </div>
          
          {/* Items */}
          <div className="relative pl-[18px] space-y-1.5">
            {/* Connecting vertical line */}
            <div className="absolute left-[15px] top-2 bottom-6 w-px bg-gradient-to-b from-outline-variant/30 via-outline-variant/20 to-transparent"></div>
            
            {migrationItems.map((item) => (
              <div key={item.id} className="relative group/item ml-3">
                {/* Horizontal branch line */}
                <div className={cn("absolute left-[-16px] top-1/2 w-4 h-[1.5px] rounded-full transition-colors duration-300", activePage === item.id ? "bg-secondary/40" : "bg-outline-variant/30 group-hover/item:bg-secondary/30")}></div>
                
                <button
                  onClick={() => { onModeChange('migration'); onPageChange(item.id); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 relative overflow-hidden",
                    activePage === item.id
                      ? "bg-secondary/10 text-secondary ring-1 ring-secondary/20 shadow-sm"
                      : "text-on-surface hover:bg-surface-container-high"
                  )}
                >
                  {activePage === item.id && (
                    <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_12px_rgba(var(--color-secondary),0.6)]" />
                  )}
                  <span className={cn("transition-colors z-10", activePage === item.id ? "text-secondary" : "text-on-surface-variant group-hover/item:text-secondary")}>
                    {getIcon(item.icon)}
                  </span>
                  <span className="tracking-wide z-10 text-[13px]">{item.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
};

const TopBar = () => {
  return (
    <header className="h-20 bg-surface-container-lowest border-b border-outline-variant/20 flex items-center justify-between px-8 shrink-0 z-0 shadow-sm relative z-20">
      <div className="flex-1 flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
           <CloudUpload className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Google Cloud AI Agent
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
        </button>
        <button className="p-2.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-outline-variant/30 mx-2" />
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right">
            <p className="text-sm font-bold text-on-surface">Migration Admin</p>
            <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Cloud Architect</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-tertiary flex items-center justify-center text-white font-bold shadow-md ring-2 ring-surface">
            MA
          </div>
        </div>
      </div>
    </header>
  );
};

const PageHeader = ({ step, title, description, rightElement }: { step?: string, title: string, description: string, rightElement?: React.ReactNode }) => (
  <div className="mb-10 flex justify-between items-end">
    <div>
      {step && <span className="text-primary font-mono text-[10px] uppercase tracking-[0.2em] font-bold mb-2 block">{step}</span>}
      <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">{title}</h2>
      <p className="text-on-surface-variant text-base max-w-2xl">{description}</p>
    </div>
    {rightElement && <div>{rightElement}</div>}
  </div>
);

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


    </div>
  );
};

const UploadPage = ({ onAnalyze, isLoading }: { onAnalyze: (desc: string, metadata: any, file: { name: string, type: string, base64: string } | null) => void, isLoading: boolean }) => {
  const [desc, setDesc] = useState('');
  const [serviceCriticality, setServiceCriticality] = useState('');
  const [rto, setRto] = useState('');
  const [globalUserBase, setGlobalUserBase] = useState('');
  const [trafficScale, setTrafficScale] = useState('');
  const [trafficPattern, setTrafficPattern] = useState('');
  const [availabilityGoal, setAvailabilityGoal] = useState('');
  const [architectureStyle, setArchitectureStyle] = useState('');
  const [orchestrationTool, setOrchestrationTool] = useState('');
  const [isIaC, setIsIaC] = useState(false);
  const [isImmutable, setIsImmutable] = useState(false);
  const [isCentralizedLogging, setIsCentralizedLogging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string, type: string, base64: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (base64) setSelectedFile({ name: file.name, type: file.type, base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeClick = () => {
    const metadata = {
      serviceCriticality, rto, globalUserBase,
      trafficScale, trafficPattern, availabilityGoal,
      architectureStyle, orchestrationTool,
      isIaC, isImmutable, isCentralizedLogging
    };
    onAnalyze(desc, metadata, selectedFile);
  };

  return (
    <div className="space-y-10">
      <PageHeader step="Step 01" title="Architecture Register" description="Provide your AWS infrastructure diagram and define your operational goals for a rigorous QA audit." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-8 rounded-xl border border-outline-variant/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-xl text-on-surface">Register Architecture Diagram</h3>
            </div>
            
            <div 
              className={cn("border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 relative overflow-hidden group", isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-outline-variant/50 hover:border-primary/50 hover:bg-surface-container-lowest", selectedFile ? "bg-surface-container-lowest" : "")}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
            >
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileSelect} accept="image/*" />
              
              {selectedFile ? (
                <div className="flex flex-col items-center gap-4 animate-fadeIn h-full w-full justify-center">
                  <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border-2 border-primary/20 shadow-md group-hover:scale-[1.02] transition-transform">
                    <img 
                      src={`data:${selectedFile.type};base64,${selectedFile.base64}`} 
                      alt="Architecture Preview" 
                      className="w-full h-full object-contain bg-white"
                    />
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 className="w-10 h-10 text-primary drop-shadow-md" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface truncate max-w-[250px]">{selectedFile.name}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Ready for analysis</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300">
                    <CloudUpload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface mb-1">Drag & drop your AWS diagram here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-xl border border-outline-variant/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Additional Description</h3>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. 'This architecture uses EKS for microservices and Aurora PostgreSQL. Route53 is used for DNS but not shown...'"
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none shadow-inner"
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-lg">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/20">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-headline font-bold text-lg text-on-surface">Operational Goals <span className="text-sm text-on-surface-variant font-normal">(Optional)</span></h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Business Requirements</h4>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Service Criticality</label>
                  <select value={serviceCriticality} onChange={(e) => setServiceCriticality(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                    <option value="">None (Not Specified)</option>\n                    <option value="Tier 1 (Mission Critical)">Tier 1 (Mission Critical)</option>
                    <option value="Tier 2 (Business Critical)">Tier 2 (Business Critical)</option>
                    <option value="Tier 3 (Internal/Non-critical)">Tier 3 (Internal/Non-critical)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Global User Base</label>
                  <select value={globalUserBase} onChange={(e) => setGlobalUserBase(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                    <option value="">None (Not Specified)</option>\n                    <option value="Domestic Only">Domestic Only</option>
                    <option value="Specific Regions">Specific Regions</option>
                    <option value="Global Service">Global Service</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Target RTO</label>
                  <select value={rto} onChange={(e) => setRto(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                    <option value="">None (Not Specified)</option>\n                    <option value="Within 1 hour">Within 1 hour</option>
                    <option value="Within 4 hours">Within 4 hours</option>
                    <option value="Within 24 hours">Within 24 hours</option>
                    <option value="Best Effort">Best Effort</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Traffic & Scalability</h4>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Traffic Scale</label>
                  <select value={trafficScale} onChange={(e) => setTrafficScale(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                    <option value="">None (Not Specified)</option>\n                    <option value="Low (&lt; 1K)">Low (&lt; 1K)</option>
                    <option value="Medium (1K ~ 10K)">Medium (1K ~ 10K)</option>
                    <option value="High (10K ~ 100K)">High (10K ~ 100K)</option>
                    <option value="Massive (&gt; 100K)">Massive (&gt; 100K)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Traffic Pattern</label>
                  <select value={trafficPattern} onChange={(e) => setTrafficPattern(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                    <option value="">None (Not Specified)</option>\n                    <option value="Steady (No Spikes)">Steady (No Spikes)</option>
                    <option value="Predictable Spikes">Predictable Spikes</option>
                    <option value="Unpredictable Spikes">Unpredictable Spikes</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Availability (SLA) Goal</label>
                  <select value={availabilityGoal} onChange={(e) => setAvailabilityGoal(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                    <option value="">None (Not Specified)</option>\n                    <option value="99.0%">99.0%</option>
                    <option value="99.9% (Single AZ)">99.9% (Single AZ)</option>
                    <option value="99.99% (Multi-AZ)">99.99% (Multi-AZ)</option>
                    <option value="99.999% (Multi-Region)">99.999% (Multi-Region)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Architecture Standards</h4>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Architecture Style</label>
                  <select value={architectureStyle} onChange={(e) => setArchitectureStyle(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                    <option value="">None (Not Specified)</option>\n                    <option value="Monolithic">Monolithic</option>
                    <option value="Service Oriented (SOA)">Service Oriented (SOA)</option>
                    <option value="Microservices (MSA)">Microservices (MSA)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Orchestration Platform</label>
                  <select value={orchestrationTool} onChange={(e) => setOrchestrationTool(e.target.value)} className="w-full bg-surface-container border border-outline-variant/20 text-on-surface text-xs rounded p-2 focus:border-primary outline-none">
                    <option value="">None (Not Specified)</option>\n                    <option value="None (EC2/VM Based)">None (EC2/VM Based)</option>
                    <option value="Managed Kubernetes (EKS/GKE)">Managed Kubernetes (EKS/GKE)</option>
                    <option value="Serverless Containers (Fargate/Cloud Run)">Serverless Containers (Fargate/Cloud Run)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Operational Policies</h4>
                <label className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                  <input type="checkbox" checked={isIaC} onChange={(e) => setIsIaC(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 bg-surface-container-low border border-primary/20" />
                  IaC Applied
                </label>
                <label className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                  <input type="checkbox" checked={isImmutable} onChange={(e) => setIsImmutable(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 bg-surface-container-low border border-primary/20" />
                  Immutable Infrastructure
                </label>
                <label className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                  <input type="checkbox" checked={isCentralizedLogging} onChange={(e) => setIsCentralizedLogging(e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 bg-surface-container-low border border-primary/20" />
                  Centralized Logging
                </label>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleAnalyzeClick}
              disabled={isLoading || (!desc.trim() && !selectedFile)}
              className={cn("bg-gradient-to-r from-primary to-primary-container text-on-primary px-12 py-5 rounded-md font-bold text-lg shadow-xl w-full flex justify-center", (isLoading || (!desc.trim() && !selectedFile)) && "opacity-50 cursor-not-allowed")}
            >
              {isLoading ? "Analyzing..." : "Analyze Architecture"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MappingPage = ({ mappings, report, onConfirm, awaitingApproval, isLoading }: { mappings: MappingItem[], report: string, onConfirm: () => void, awaitingApproval: boolean, isLoading: boolean }) => {
  return (
    <div className="space-y-10">
      <PageHeader step="Step 03" title="Service Mapping" description="Automated translation of source infrastructure into target-native cloud services." />
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
          <p className="text-center text-on-surface-variant italic p-12 bg-surface-container-lowest rounded-md">No mappings generated yet.</p>
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

      {report && (
        <div className="mt-16 pt-10 border-t border-outline-variant/20">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-outline-variant/10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={SharedMarkdownComponents}>
              {report}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

const AnalysisPage = ({ report, checklistItems, awaitingApproval, onConfirm, onFeedback, isLoading, setLoadingMsg }: { report: string, checklistItems: VerificationItem[], awaitingApproval: boolean, onConfirm: () => void, onFeedback: (text: string) => void, isLoading: boolean, setLoadingMsg: (msg: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'checklist'>('report');

  return (
    <div className="space-y-10">
      <PageHeader step="Step 01" title="Analysis Report & Quality Audit" description="Detailed architecture audit, breakdown, and validation checklist." />

      {awaitingApproval && (
        <ApprovalPanel
          title="Analysis & Audit Complete - Awaiting Approval"
          description="Architecture analysis and quality audit complete. Proceed to GCP Resource Mapping?"
          confirmText="Approve & Proceed"
          onConfirm={() => {
            setLoadingMsg("✅ Approval complete. Generating Terraform Codes for Google Cloud...");
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
          <div className="flex border-b border-outline-variant/20 bg-surface-container-low px-6 pt-4 shrink-0">
            <button onClick={() => setActiveTab('report')} className={cn("px-6 py-3 font-bold text-sm border-b-2 transition-colors", activeTab === 'report' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}>
              Analysis Report
            </button>
            <button onClick={() => setActiveTab('checklist')} className={cn("px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2", activeTab === 'checklist' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}>
              Quality Audit Checklist
              {checklistItems && checklistItems.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{checklistItems.length}</span>
              )}
            </button>
          </div>

          <div className="p-8 flex-1 overflow-auto max-h-[800px]">
            {activeTab === 'report' && (
              <div className="text-on-surface">
                {report ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={SharedMarkdownComponents}>
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
                    <div key={item.id} className={cn("group transition-all duration-300 p-6 flex items-start gap-6 rounded-xl relative overflow-hidden border shadow-[0_1px_2px_rgba(0,0,0,0.02)]", item.status === 'complete' ? "bg-emerald-50/20 border-emerald-200/50 hover:bg-emerald-50/40" : item.status === 'warning' ? "bg-amber-50/20 border-amber-200/50 hover:bg-amber-50/40" : "bg-slate-50/40 border-slate-200/60 hover:bg-slate-50/60")}>
                      <div className={cn("w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg shadow-sm mt-1", item.status === 'complete' ? "bg-white text-emerald-600 border border-emerald-100" : item.status === 'warning' ? "bg-white text-amber-600 border border-amber-100" : "bg-white text-slate-500 border border-slate-100")}>
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
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm", item.status === 'complete' ? "bg-emerald-100/80 text-emerald-800" : item.status === 'warning' ? "bg-amber-100/80 text-amber-800" : "bg-slate-100/80 text-slate-700")}>
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

const TerraformPage = ({ files, report }: { files: { [filename: string]: string }, report?: string }) => {
  const fileNames = Object.keys(files);
  const [activeTab, setActiveTab] = useState<string>(fileNames[0] || 'main.tf');
  const code = files[activeTab] || "";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    Object.entries(files).forEach(([name, content]) => {
      zip.file(name, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'terraform-infra.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <PageHeader step="Step 04" title="Terraform Output" description="Production-ready IaC (Infrastructure as Code) templates based on verified targets." rightElement={(
        <div className="flex gap-2">
          <button onClick={handleDownloadZip} className="bg-surface text-primary border border-primary/20 px-4 py-2 rounded-md font-bold text-xs hover:bg-primary/5 transition-all flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Download ZIP
          </button>
        </div>
      )} />

      {fileNames.length === 0 ? (
        <p className="text-center text-on-surface-variant italic p-12 bg-surface-container-lowest rounded-md">No Terraform code generated yet. Please complete the mapping phase.</p>
      ) : (
        <>
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_40px_40px_-5px_rgba(25,28,29,0.04)] border border-outline-variant/20 overflow-hidden flex h-[600px]">
            <div className="w-[240px] bg-surface-container-low border-r border-outline-variant/20 flex flex-col">
              <div className="p-4 border-b border-outline-variant/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Project Files
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {fileNames.map(name => (
                  <button
                    key={name}
                    onClick={() => setActiveTab(name)}
                    className={cn("w-full text-left px-4 py-2 text-sm font-mono transition-colors border-l-2", activeTab === name ? "bg-primary/10 text-primary border-primary font-bold" : "text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface")}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-w-0 bg-[#ffffff]">
              <div className="h-12 border-b border-outline-variant/10 bg-surface flex items-center justify-between px-4">
                <div className="flex items-center gap-2 text-sm font-mono font-bold text-on-surface">
                  <Code className="w-4 h-4 text-primary" /> {activeTab}
                </div>
                <button onClick={handleCopyCode} className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded hover:bg-surface-container" title="Copy code">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-grow overflow-auto font-mono text-sm bg-[#ffffff] py-4">
                {code.trim().split("\n").map((line, i) => (
                  <div key={i} className="flex hover:bg-surface-container-low/30 px-4 leading-6 w-max min-w-full">
                    <div className="w-10 text-on-surface-variant/40 select-none text-right pr-3 font-mono border-r border-outline-variant/10 mr-4 shrink-0 sticky left-0 bg-[#ffffff]">
                      {(i + 1).toString().padStart(2, '0')}
                    </div>
                    <pre className="whitespace-pre text-[#24292e] font-mono">{line || " "}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 🛡️ [수정] 테라폼 코드 분석 리포트 하단 렌더링 */}
          {report && (
            <div className="mt-8 pt-8 border-t border-outline-variant/20">
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-on-surface">Architecture Analysis & Compliance</h3>
                    <p className="text-xs text-on-surface-variant">Explanation of security posture, scaling features, and code structure.</p>
                  </div>
                </div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={SharedMarkdownComponents}>
                  {report}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CHECKLIST_DATA = [
  { type: '아키텍처', category: 'Multi Region 아키텍쳐 구성', details: 'Multi Region 아키텍쳐가 필요한 서비스인가?' },
  { type: '아키텍처', category: 'Multi Region 아키텍쳐 구성', details: 'Multi Region 아키텍쳐가 필요한 수준의 사용자가 예상되는 서비스인가?' },
  { type: '아키텍처', category: 'Multi Region 아키텍쳐 구성', details: 'Multi Region 아키텍쳐 설계(구현)를 어떻게 할 것인가?' },
  { type: '아키텍처', category: 'Multi Region 아키텍쳐 구성', details: '고성능 Routing 기능을 사용 하였는가?' },
  { type: '아키텍처', category: 'Multi Region 아키텍쳐 구성', details: 'Multi Region 데이터 동기화를 고려 하였는가?' },
  { type: '아키텍처', category: 'Multi Region 아키텍쳐 구성', details: 'IaC(Infrastructure as Code)로 설계(개발)하여 최소 시간에 생성(복구)할 수 있는가?' },
  { type: '아키텍처', category: '인스턴스 Type', details: '서비스 성격에 적합한 인스턴스 Type을 선택 하였는가?' },
  { type: '아키텍처', category: '인스턴스 Type', details: '서비스 성격에 적합한 스토리지 Type을 선택 하였는가?' },
  { type: '아키텍처', category: '인스턴스 Type', details: '인스턴스/스토리지 성능 측정(평가)을 진행 하였는가?' },
  { type: '아키텍처', category: '인스턴스 Type', details: '인스턴스/스토리지 모니터링을 구축 하였는가?' },
  { type: '아키텍처', category: 'Multi AZ 인스턴스 구성', details: 'Multi AZ(Availability Zone) 기반으로 HA(High Availability, 고가용성) 구성이 되어 있는가?' },
  { type: '아키텍처', category: 'VPC', details: 'Public Cloud 환경에서 VPC(Virtual Private Cloud)를 구성하였는가? (AWS/GCP : VPC , Azure : Vnet)' },
  { type: '아키텍처', category: 'VPC', details: 'VPC에서 Public/Private Subnet을 기능별로 분리하여 네트워크를 구성하였는가?' },
  { type: '아키텍처', category: 'Auto Scaling 구성', details: '서비스 배포를 Auto Scaling 기반으로 구성하였는가?' },
  { type: '아키텍처', category: 'Auto Scaling 구성', details: '어플리케이션 로드(CPU, Memory 등)를 고려하여 적절한 Auto Scaling Policy 가 적용 되었는가?' },
  { type: '아키텍처', category: 'Capacity Plan', details: '서비스 사용자수에 맞추어 Architecture가 설계되어 있는가?' },
  { type: '아키텍처', category: 'Capacity Plan', details: '서비스 생애주기/중요이벤트에 맞추어 서버 Capacity Plan이 산정되어 있는가?' },
  { type: '아키텍처', category: 'Immutable Infrastructure', details: '서버관리자가 운영중인 서버에 접근할 필요가 없도록 구성하였는가?' },
  { type: '아키텍처', category: 'Immutable Infrastructure', details: 'Machine Image / container image를 이용하여 배포를 수행하는가?' },
  { type: '아키텍처', category: 'Immutable Infrastructure', details: '중앙 집중된 Logging, Monitoring 시스템을 활용하는가?' },
  { type: '아키텍처', category: 'Immutable Infrastructure', details: 'MSA 적용이 필요/적합한 서비스인가?' },
  { type: '아키텍처', category: 'Immutable Infrastructure', details: '각 마이크로 서비스의 통신 내역을 추적하는 방법 또는 도구가 존재하는가?' },
  { type: '아키텍처', category: 'Immutable Infrastructure', details: '일부 마이크로 서비스의 장애에도 전체 서비스는 유지할 수 있도록 설계가 되어 있는가?' },
  { type: '아키텍처', category: 'Immutable Infrastructure', details: '서비스 디스커버리가 적용되어 있는가?' },
  { type: '아키텍처', category: 'Immutable Infrastructure', details: '각 api로 routing할 수 있는 적절한 component를 구성하였는가? (ex. api gateway, kubernetes ingress controller)' },
  { type: '아키텍처', category: 'Immutable Infrastructure', details: '적절한 오케스트레이션 툴이 적용되었는가? (ex. kubernetes)' },
  { type: '아키텍처', category: 'HA아키텍쳐', details: 'HA 구성 시 Multi AZ 가 고려되었는가?' },
  { type: '아키텍처', category: 'HA아키텍쳐', details: 'SPOF(Single Point of Failure) 가 없는가?' },
  { type: '아키텍처', category: 'HA아키텍쳐', details: '트래픽 급증에 대비한 인프라가 설정되어 있는가? (Autoscaling, Queue)' },
  { type: '아키텍처', category: 'DR아키텍쳐', details: 'RTO / RPO 가 적절히 수립되었는가?' },
  { type: '아키텍처', category: 'DR아키텍쳐', details: 'DR 전략 수립이 되었는가?' },
  { type: '아키텍처', category: 'Kubernetes', details: 'Public Cloud 의 Kubernetes cluster 구성 시 서비스 VPC 내 Multi cluster 형태로 구성하였는가?' },
  { type: '아키텍처', category: 'Kubernetes', details: 'GKE cluster 의 자동 확장은 적용해서 구축했는가?' },
  { type: '아키텍처', category: 'Kubernetes', details: '특정한 패턴을 갖는 Spike traffic 은 KEDA Scaler를 활용하여 구축하였는가?' }
].map((item, idx) => ({ id: `rule_${idx + 1}`, ...item }));

const CommandBlock = ({ command }: { command: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded bg-[#1e2124] border border-outline-variant/10 overflow-hidden mb-3 font-mono text-[11px]">
      <div className="p-3 pr-12 overflow-x-auto whitespace-pre text-[#A9B1D6]">
        {command}
      </div>
      <div className="absolute top-0 right-0 h-full flex items-center pr-2">
         <button onClick={handleCopy} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Copy">
           {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
         </button>
      </div>
    </div>
  );
};

const AuditSetupPage = ({ onStartAudit }: { onStartAudit: (projectId: string, saKey: string, selectedRules: any[]) => void }) => {
  const [projectId, setProjectId] = useState('');
  const [saKey, setSaKey] = useState('');
  const [ruleStatuses, setRuleStatuses] = useState<Record<string, string>>({});

  const handleStatusChange = (id: string, status: string) => {
    setRuleStatuses(prev => ({ ...prev, [id]: status }));
  };

  return (
    <div className="animate-fadeIn max-w-[1400px] mx-auto space-y-6 pb-20">
      <PageHeader
        step="Phase 1: Configuration"
        title="GCP Infrastructure Audit Setup"
        description="Configure target environment and review checklist rules prior to the AI Audit."
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input + Button */}
        <div className="xl:col-span-4 flex flex-col gap-6 sticky top-6">
          <section className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-4 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Target Environment</h3>
                <p className="text-xs text-on-surface-variant">Specify GCP Project ID and SA Key</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Google Cloud Project ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. acme-corp-production-01" 
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Service Account JSON Key</label>
                <textarea 
                  placeholder='{\n  "type": "service_account",\n  "project_id": "...",\n  ...' 
                  value={saKey}
                  onChange={e => {
                    setSaKey(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  className="w-full min-h-[180px] bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono whitespace-pre resize-none overflow-hidden"
                />
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <TerminalIcon className="w-4 h-4 text-on-surface-variant" />
                  <h4 className="text-sm font-bold text-on-surface">GCP Required Commands</h4>
                </div>
                
                <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                  Copy and run the command below to create a service account, grant the Viewer role, and print the generated JSON key format right away.
                </p>
                <CommandBlock command={`gcloud services enable cloudasset.googleapis.com \\\n  --project=${projectId || 'PROJECT_ID'} && \\\ngcloud iam service-accounts create ai-auditor \\\n  --display-name="AI Auditor" && \\\ngcloud projects add-iam-policy-binding ${projectId || 'PROJECT_ID'} \\\n  --member="serviceAccount:ai-auditor@${projectId || 'PROJECT_ID'}.iam.gserviceaccount.com" \\\n  --role="roles/viewer" && \\\ngcloud projects add-iam-policy-binding ${projectId || 'PROJECT_ID'} \\\n  --member="serviceAccount:ai-auditor@${projectId || 'PROJECT_ID'}.iam.gserviceaccount.com" \\\n  --role="roles/cloudasset.viewer" && \\\ngcloud iam service-accounts keys create sa-key.json \\\n  --iam-account=ai-auditor@${projectId || 'PROJECT_ID'}.iam.gserviceaccount.com && \\\ncat sa-key.json`} />
              </div>
            </div>
          </section>

          <button 
            onClick={() => {
              if (!projectId.trim()) { alert('Please enter a GCP Project ID'); return; }
              if (!saKey.trim()) { alert('Please enter the Service Account JSON Key'); return; }
              const enrichedRules = CHECKLIST_DATA.map(r => ({
                 ...r,
                 user_status: ruleStatuses[r.id] || '미선택'
              }));
              onStartAudit(projectId, saKey, enrichedRules);
            }}
            className="w-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Rocket className="w-5 h-5" />
            Start Analysis (Agent 1)
          </button>
        </div>

        {/* Right Column: Checklist Table */}
        <section className="xl:col-span-8 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-140px)]">
          <div className="bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-4 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-tertiary" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Checklist</h3>
              <p className="text-xs text-on-surface-variant">Review the target rules and set local verification statuses.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto overflow-y-auto flex-1 bg-surface-container-lowest/30">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-outline-variant/30 shadow-sm">
                  <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant w-16 text-center">번호</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant w-24">타입</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant w-48">구분</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant">상세내용</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant w-40 text-center">적용상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {CHECKLIST_DATA.map((rule, idx) => (
                  <tr key={rule.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-on-surface-variant text-center">{idx + 1}</td>
                    <td className="py-3 px-4 text-xs font-bold text-on-surface-variant">
                      <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] text-tertiary">
                        {rule.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-on-surface">{rule.category}</td>
                    <td className="py-3 px-4 text-xs text-on-surface-variant leading-relaxed">{rule.details}</td>
                    <td className="py-3 px-4 text-center">
                      <select 
                        value={ruleStatuses[rule.id] || '미선택'}
                        onChange={(e) => handleStatusChange(rule.id, e.target.value)}
                        className={cn(
                          "text-xs px-2 py-1.5 rounded-lg focus:ring-1 focus:ring-primary outline-none transition-colors border font-bold cursor-pointer w-full text-center appearance-none",
                          (ruleStatuses[rule.id] === '만족') ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                          (ruleStatuses[rule.id] === '만족하지 않음') ? "bg-red-500/10 text-red-600 border-red-500/20" :
                          (ruleStatuses[rule.id] === '모름') ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                          "bg-surface-container text-on-surface-variant border-outline-variant/30 hover:border-outline-variant text-center"
                        )}
                      >
                        <option value="미선택">미선택</option>
                        <option value="만족">✅ 만족</option>
                        <option value="만족하지 않음">❌ 불만족</option>
                        <option value="모름">❓ 모름</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const AuditReportPage = ({ projectId, saKey, existingReport, onProceed, isLoading, setIsLoading }: { projectId: string, saKey: string, existingReport: string, onProceed: (report: string) => void, isLoading: boolean, setIsLoading: (val: boolean) => void }) => {
  const [logs, setLogs] = useState<{ id: string, message: string, type: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [report, setReport] = useState<string>(existingReport || '');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    let isMounted = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let _buffer = '';

    const startStream = async () => {
      if (!projectId) return;

      if (existingReport) {
        if (isMounted) {
           setIsStreaming(false);
           setIsLoading(false);
           setLogs([{ id: 'cached', type: 'status', message: `Loaded existing report from memory.` }]);
        }
        return;
      }

      setIsStreaming(true);
      setLogs([{ id: 'init', type: 'status', message: `Initializing Asset Inventory scan for: ${projectId}...` }]);
      
      try {
        const response = await fetch('http://localhost:8000/api/v1/audit/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            sa_key: saKey,
            session_id: 'session-' + Date.now()
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        if (!response.body) throw new Error('No readable stream available in response.');

        reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
             if (isMounted) {
               setIsStreaming(false);
               setIsLoading(false);
             }
             break;
          }

          _buffer += decoder.decode(value, { stream: true });
          const lines = _buffer.split('\n');
          _buffer = lines.pop() || ''; 

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            if (trimmed.startsWith('data: ')) {
               const jsonStr = trimmed.substring(6);
               try {
                 const payload = JSON.parse(jsonStr);
                 if (isMounted) {
                    const logId = Math.random().toString(36).substr(2, 9);
                    
                    if (payload.type === 'analyzer_done') {
                      setReport(payload.report);
                      setLogs(prev => [...prev, { id: logId, type: 'status', message: 'Report generated successfully.' }]);
                    } else if (payload.message) {
                      setLogs(prev => [...prev, { id: logId, type: payload.type, message: payload.message }]);
                    }
                 }
               } catch (e) {
                 console.error("Failed to parse SSE payload:", jsonStr);
               }
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setLogs(prev => [...prev, { id: 'err', type: 'error', message: `Stream Error: ${err.message}` }]);
          setIsStreaming(false);
          setIsLoading(false);
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      if (reader) reader.cancel();
    };
  }, [projectId, saKey]);

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-6 pb-20 h-full flex flex-col">
      <PageHeader
        step="Phase 2: Infrastructure Report"
        title="Agent 1: GCP Architecture Analysis"
        description="Scanning Cloud Asset Inventory to identify topologies and configurations."
      />
      
      {!isStreaming && report && (
        <ApprovalPanel
          title="Analysis Complete - Awaiting Approval"
          description="GCP Architecture analysis complete. Proceed to Compliance Check?"
          confirmText="Approve & Proceed"
          onConfirm={() => onProceed(report)}
          isLoading={isLoading}
        />
      )}
      
      <div className="flex flex-col gap-6 flex-1 min-h-[500px]">
        {/* Markdown Report Render (Full Width) */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl flex flex-col flex-1 overflow-hidden shadow-sm relative">
           <div className="bg-surface-container-lowest border-b border-outline-variant/30 px-4 py-3 flex items-center justify-between">
              <span className="font-headline font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-tertiary" /> 
                Extracted Report
              </span>
              {isStreaming && <div className="flex items-center gap-2 text-xs font-bold text-secondary tracking-widest uppercase"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</div>}
           </div>
           <div className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest/30">
              {report ? (
                 <ReactMarkdown
                   remarkPlugins={[remarkGfm]}
                   components={SharedMarkdownComponents}>
                   {report}
                 </ReactMarkdown>
              ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant/50">
                    <Activity className="w-10 h-10 mb-4 opacity-20 animate-pulse" />
                    <span className="text-xs uppercase tracking-widest font-bold">Scanning Infrastructure...</span>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

interface AuditLog {
  id: string;
  agent: string;
  type: string;
  message?: string;
  rule_id?: string;
  status?: string;
  reason?: string;
  resource?: string;
  data?: string;
}

const AuditLivePage = ({ projectId, rules, infrastructureReport }: { projectId: string; rules: any[]; infrastructureReport: string }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string>('initializer');
  const [remediationMap, setRemediationMap] = useState<Record<string, string>>({});
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    let isMounted = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let _buffer = '';

    const startStream = async () => {
      if (!projectId) return;
      setIsStreaming(true);
      setLogs([{ id: 'init', agent: 'system', type: 'status', message: `Initializing audit pipeline for project: ${projectId}...` }]);
      
      try {
        const response = await fetch('http://localhost:8000/api/v1/audit/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            infrastructure_report: infrastructureReport,
            checklist_items: rules,
            session_id: 'session-' + Date.now()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (!response.body) {
          throw new Error('No readable stream available in response.');
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
             if (isMounted) {
                setIsStreaming(false);
                setLogs(prev => [...prev, { id: Date.now().toString(), agent: 'system', type: 'complete', message: 'Audit stream has gracefully closed.' }]);
             }
             break;
          }

          _buffer += decoder.decode(value, { stream: true });
          const lines = _buffer.split('\n');
          _buffer = lines.pop() || ''; // keep incomplete line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            if (trimmed.startsWith('data: ')) {
               const jsonStr = trimmed.substring(6);
               try {
                 const payload = JSON.parse(jsonStr);
                 
                 if (isMounted) {
                    const logId = Math.random().toString(36).substr(2, 9);
                    const newLog: AuditLog = { ...payload, id: logId };
                    
                    if (newLog.agent && newLog.agent !== 'system') {
                      setActiveAgent(newLog.agent);
                    }

                    if (newLog.type === 'result' && newLog.status === 'FAIL' && newLog.rule_id) {
                      setExpandedRules(prev => ({ ...prev, [newLog.rule_id!]: true }));
                    }

                    if (newLog.type === 'remediation_plan' && newLog.data && newLog.rule_id) {
                      setRemediationMap(prev => ({ ...prev, [newLog.rule_id!]: newLog.data! }));
                      setExpandedRules(prev => ({ ...prev, [newLog.rule_id!]: true }));
                    }
                    
                    setLogs(prev => [...prev, newLog]);
                 }
               } catch (e) {
                 console.error("Failed to parse SSE payload:", jsonStr);
               }
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setLogs(prev => [...prev, { id: 'err', agent: 'system', type: 'error', message: `Stream Error: ${err.message}` }]);
          setIsStreaming(false);
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      if (reader) reader.cancel();
    };
  }, [projectId, rules]);

  // Derive Evaluation Results from logs
  const evalResults = logs.filter(l => l.type === 'result');
  // Aggregate unique rules that failed or passed
  const evaluatedRuleIds = new Set(evalResults.map(r => r.rule_id));

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-6 pb-20 h-full flex flex-col">
      <div className="flex justify-between items-end mb-4 shrink-0">
        <div>
           <span className="text-secondary font-mono text-[10px] uppercase tracking-[0.2em] font-bold mb-2 flex items-center gap-2">
             <span className="relative flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isStreaming ? "animate-ping bg-secondary" : "bg-outline-variant")}></span>
                <span className={cn("relative inline-flex rounded-full h-2 w-2", isStreaming ? "bg-secondary" : "bg-outline-variant")}></span>
              </span>
             Phase 2: Live Analysis
           </span>
           <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Realtime Audit Dashboard</h2>
           <p className="text-on-surface-variant text-base">Monitoring multi-agent infrastructure evaluation for <span className="font-mono text-primary font-bold">{projectId}</span></p>
        </div>
        <div className="bg-surface-container px-4 py-2 rounded-xl border border-outline-variant/30 flex items-center gap-4">
           {['analyzer', 'evaluator', 'remediator'].map((agentName, idx) => (
             <div key={agentName} className={cn("flex items-center gap-2", activeAgent === agentName ? "opacity-100" : "opacity-40 grayscale")}>
                <div className={cn("w-6 h-6 rounded flex items-center justify-center", activeAgent === agentName ? "bg-primary text-white shadow-md animate-pulse" : "bg-surface text-on-surface-variant")}>
                   {idx === 0 ? <Activity className="w-3 h-3" /> : idx === 1 ? <ShieldCheck className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">{agentName}</span>
                {idx < 2 && <ChevronRight className="w-3 h-3 text-outline-variant ml-2" />}
             </div>
           ))}
        </div>
      </div>

      <div className="flex-1 min-h-[500px] flex flex-col gap-6">
        
        {/* Top: Security Posture Summary Dashboard */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-6 relative overflow-hidden">
           {/* Decorative background element */}
           <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
           
           <div className="relative z-10 w-full md:w-auto">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-1.5 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" /> Security Posture Summary
              </h3>
              <p className="text-sm text-on-surface-variant">Live streaming compliance evaluation</p>
           </div>
           
           <div className="relative z-10 flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-8 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-inner min-w-[300px] justify-between">
              <div className="flex flex-col items-start w-1/3 md:w-auto">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Passed
                </span>
                <div className="text-3xl font-mono font-black text-emerald-500 tracking-tighter">
                  {evalResults.filter(r => r.status === 'PASS').length}
                </div>
              </div>
              <div className="hidden md:block w-px h-12 bg-outline-variant/30"></div>
              <div className="flex flex-col items-start w-1/3 md:w-auto">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Failed
                </span>
                <div className="text-3xl font-mono font-black text-red-500 tracking-tighter shadow-sm">
                  {evalResults.filter(r => r.status === 'FAIL').length}
                </div>
              </div>
              <div className="hidden md:block w-px h-12 bg-outline-variant/30"></div>
              <div className="flex flex-col items-start w-full mt-2 md:mt-0 md:w-auto border-t border-outline-variant/20 md:border-0 pt-2 md:pt-0">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" /> Rules Evaluated
                </span>
                <div className="text-3xl font-mono font-black text-on-surface tracking-tighter">
                  {evaluatedRuleIds.size} <span className="text-lg text-outline-variant font-medium">/ {rules.length}</span>
                </div>
              </div>
           </div>
        </div>

        {/* Main Body: Rule Finding Cards List */}
        <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-4 scrollbar-hide">
           {rules.length === 0 ? (
             <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant/60 bg-surface border border-outline-variant/20 rounded-2xl border-dashed">
               {isStreaming ? (
                 <><Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" /><p className="text-sm font-bold tracking-wide">Awaiting Evaluator Agent...</p></>
               ) : (
                 <p className="text-sm">No rules loaded for evaluation.</p>
               )}
             </div>
           ) : (
             rules.map((rule, idx) => {
                const ruleResults = evalResults.filter(r => r.rule_id === rule.id);
                const fails = ruleResults.filter(r => r.status === 'FAIL');
                const passes = ruleResults.filter(r => r.status === 'PASS');
                const isExpanded = !!expandedRules[rule.id];
                
                const hasFails = fails.length > 0;
                const isWaiting = ruleResults.length === 0;

                return (
                   <div key={rule.id} className={cn("bg-surface border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm group", hasFails ? "border-red-500/40 ring-2 ring-red-500/10 shadow-red-500/5 transform hover:-translate-y-0.5" : isWaiting ? "border-outline-variant/30 opacity-70 border-dashed" : "border-outline-variant/20 hover:border-outline-variant/50")}>
                     {/* Card Header (Always visible onClick Trigger) */}
                     <div 
                       className={cn("px-5 py-4 md:py-5 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 cursor-pointer transition-colors relative", hasFails ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-surface-container-lowest/80")}
                       onClick={() => setExpandedRules(p => ({...p, [rule.id]: !isExpanded}))}
                     >
                       {/* Left: Icon & Index */}
                       <div className="hidden md:flex flex-shrink-0 w-10 h-10 rounded-full items-center justify-center font-mono text-xs font-bold ring-4 ring-surface bg-surface-container shadow-sm mt-0.5">
                         {isWaiting ? (
                           <span className="text-outline-variant">{idx + 1}</span>
                         ) : hasFails ? (
                           <AlertTriangle className="w-5 h-5 text-red-500" />
                         ) : (
                           <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                         )}
                       </div>
                       
                       {/* Middle: Rule Identity */}
                       <div className="flex-1 min-w-0 pr-4">
                         <div className="flex flex-wrap items-center gap-2 mb-2">
                           <span className="md:hidden font-mono text-[10px] font-bold text-outline-variant mr-1">#{idx + 1}</span>
                           <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider", hasFails ? "bg-red-500/20 text-red-700" : "bg-surface-container-high text-tertiary")}>{rule.type}</span>
                           <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container-lowest px-2 py-0.5 border border-outline-variant/20 rounded-full">{rule.category}</span>
                         </div>
                         <h4 className="text-base font-bold text-on-surface leading-snug">{rule.details}</h4>
                       </div>

                       {/* Right: Badges & Chevron */}
                       <div className="w-full md:w-auto flex flex-row items-center justify-between md:justify-end shrink-0 gap-4 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-outline-variant/10 md:border-t-0">
                         {isWaiting ? (
                           <div className="flex items-center gap-2 text-xs text-outline-variant italic font-medium bg-surface-container-lowest px-3 py-1.5 rounded-full border border-dashed border-outline-variant/30">
                             {isStreaming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                             Pending Analysis...
                           </div>
                         ) : (
                           <div className="flex items-center gap-2">
                             {passes.length > 0 && <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> {passes.length} PASS</span>}
                             {fails.length > 0 && <span className="bg-red-500/10 text-red-700 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 animate-pulse-subtle"><AlertTriangle className="w-3.5 h-3.5"/> {fails.length} FAIL</span>}
                           </div>
                         )}
                         <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isExpanded ? "bg-tertiary/10 text-tertiary" : "bg-surface-container text-on-surface-variant group-hover:bg-tertiary/10 group-hover:text-tertiary")}>
                           <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", isExpanded && "rotate-90")} />
                         </div>
                       </div>
                     </div>

                     {/* Expanded Body (Findings & Remediation) */}
                     <div className={cn("grid transition-[grid-template-rows] duration-300 ease-in-out", isExpanded && (ruleResults.length > 0 || remediationMap[rule.id]) ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                       <div className="overflow-hidden">
                         <div className="px-5 md:px-20 pb-6 pt-3 bg-surface-container-lowest/50 border-t border-outline-variant/10">
                           
                           {/* Failed Findings List */}
                           {fails.length > 0 && (
                             <div className="mb-6 animate-slideUp" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                               <h5 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-red-500/10 pb-2">
                                 <AlertTriangle className="w-4 h-4" /> Failed Resources Details
                               </h5>
                               <div className="space-y-3 pl-1">
                                 {fails.map(res => (
                                   <div key={`fail-${res.id}`} className="bg-surface border border-red-500/20 shadow-sm rounded-xl p-4 relative overflow-hidden flex flex-col md:flex-row md:items-start gap-4">
                                     <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500/80"></div>
                                     <div className="text-[10px] font-mono font-bold text-on-surface bg-surface-container border border-outline-variant/20 px-2 py-1.5 rounded-md shadow-inner shrink-0 break-all w-fit md:max-w-[200px]">
                                       {res.resource || 'Global Project Level'}
                                     </div>
                                     <p className="text-on-surface-variant text-[13px] leading-relaxed flex-1 mt-1 md:mt-0 font-medium">
                                       {res.reason || 'No specific reason provided.'}
                                     </p>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Passed Findings List */}
                           {passes.length > 0 && (
                             <div className="mb-6 animate-slideUp" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
                               <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-emerald-500/10 pb-2">
                                 <CheckCircle2 className="w-4 h-4" /> Passed Resources Details
                               </h5>
                               <div className="space-y-3 pl-1">
                                 {passes.map(res => (
                                   <div key={`pass-${res.id}`} className="bg-surface border border-emerald-500/20 shadow-sm rounded-xl p-4 relative overflow-hidden flex flex-col md:flex-row md:items-start gap-4">
                                     <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500/80"></div>
                                     <div className="text-[10px] font-mono font-bold text-on-surface bg-surface-container border border-outline-variant/20 px-2 py-1.5 rounded-md shadow-inner shrink-0 break-all w-fit md:max-w-[200px]">
                                       {res.resource || 'Global Project Level'}
                                     </div>
                                     <p className="text-on-surface-variant text-[13px] leading-relaxed flex-1 mt-1 md:mt-0 font-medium">
                                       {res.reason || 'No specific reason provided.'}
                                     </p>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Remediation Block (IaC / BP) */}
                           {remediationMap[rule.id] && (
                              <div className="animate-slideUp" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                                <div className="mt-2 bg-[#1E1E1E] border border-tertiary/40 rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/50 relative">
                                  {/* Code Header Bar */}
                                  <div className="bg-[#2D2D2D] px-4 py-2.5 flex items-center justify-between border-b border-[#1E1E1E] shadow-sm relative z-10">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-6 h-6 rounded-md bg-tertiary/20 flex items-center justify-center">
                                        <Code className="w-3.5 h-3.5 text-tertiary" />
                                      </div>
                                      <h4 className="text-[11px] font-bold text-gray-200 uppercase tracking-widest text-shadow-sm">Remediation Plan & IaC Blueprint</h4>
                                    </div>
                                    <div className="flex gap-1.5">
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]/80"></div>
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFC107]/80"></div>
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#F44336]/80"></div>
                                    </div>
                                  </div>
                                  {/* Code Content */}
                                  <div 
                                    className="p-5 overflow-x-auto text-[#D4D4D4] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-[#1E1E1E]" 
                                    dangerouslySetInnerHTML={{ __html: `<pre><code class="font-mono text-[12px] leading-relaxed break-words">${remediationMap[rule.id].replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>` }}
                                  />
                                </div>
                              </div>
                           )}
                           
                         </div>
                       </div>
                     </div>
                   </div>
                );
             })
           )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('gcp_advisor');
  const [activePage, setActivePage] = useState<Page>('audit_setup');
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [checklist, setChecklist] = useState<VerificationItem[]>([]);
  const [analysisReport, setAnalysisReport] = useState<string>("");
  const [mappingReport, setMappingReport] = useState<string>("");
  const [terraformReport, setTerraformReport] = useState<string>("");
  const [terraformFiles, setTerraformFiles] = useState<{ [filename: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [awaitingApproval, setAwaitingApproval] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>("Analyzing architecture...");

  // GCP Advisor States
  const [auditProjectId, setAuditProjectId] = useState<string>('');
  const [auditSaKey, setAuditSaKey] = useState<string>('');
  const [auditRules, setAuditRules] = useState<any[]>([]);
  const [infrastructureReport, setInfrastructureReport] = useState<string>('');

  const handleStartAudit = (projectId: string, saKey: string, rules: any[]) => {
      setAuditProjectId(projectId);
      setAuditSaKey(saKey);
      setAuditRules(rules);
      
      setLoadingMsg("🔍 Initializing CAI Scanner and Authenticating credentials...");
      setIsLoading(true);
      setActivePage('audit_report');
  };

  const handleAnalysisComplete = (report: string) => {
      setInfrastructureReport(report);
      setLoadingMsg("✅ Approval complete. Launching Evaluator & Remediator Agents...");
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          setActivePage('audit_live');
      }, 2000);
  };

  const handleRunAgent = async (promptText: string, metadata?: any, file?: { type: string, base64: string } | null, targetAgent: string = "aws_analyzer") => {
    setIsLoading(true);

    const userMsg: ChatMessage = { role: 'user', text: promptText };
    setMessages(prev => [...prev, userMsg]);

    let finalPrompt = promptText;
    if (metadata) {
      finalPrompt += `\n\n[📋 Target Business & Operational Goals for QA Audit]\n`;
      finalPrompt += `- Service Criticality: ${metadata.serviceCriticality}\n`;
      finalPrompt += `- Target RTO: ${metadata.rto}\n`;
      finalPrompt += `- Global User Base: ${metadata.globalUserBase}\n`;
      finalPrompt += `- Expected Traffic Scale: ${metadata.trafficScale}\n`;
      finalPrompt += `- Traffic Pattern: ${metadata.trafficPattern}\n`;
      finalPrompt += `- Availability (SLA) Goal: ${metadata.availabilityGoal}\n`;
      finalPrompt += `- Architecture Style: ${metadata.architectureStyle}\n`;
      finalPrompt += `- Orchestration Platform: ${metadata.orchestrationTool}\n`;
      finalPrompt += `- Infrastructure as Code (IaC) Applied: ${metadata.isIaC ? 'Yes' : 'No'}\n`;
      finalPrompt += `- Immutable Infrastructure (No direct admin access): ${metadata.isImmutable ? 'Yes' : 'No'}\n`;
      finalPrompt += `- Centralized Logging & Monitoring: ${metadata.isCentralizedLogging ? 'Yes' : 'No'}\n`;
      finalPrompt += `\n(Agent Instruction: You MUST rigorously evaluate the attached architecture against the 34 Quality Audit Checklist items based on these stated goals.)`;
    }

    const parts: any[] = [{ text: finalPrompt }];
    if (file) {
      parts.push({
        inlineData: { mimeType: file.type, data: file.base64 }
      });
    }

    try {
      const res = await fetch("/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName: targetAgent, userId: "cloud_arch_user", sessionId: "main_session_01", newMessage: { role: "user", parts: parts } })
      });

      if (!res.ok) throw new Error(`Backend Server Error (${res.status})`);

      const data = await res.json();

      if (Array.isArray(data)) {
        let fullText = "";
        let bestText = "";
        data.forEach((event: any) => {
          if (event?.content?.parts) {
            let eventText = "";
            event.content.parts.forEach((part: any) => {
              if (part.text && !part.functionCall) eventText += part.text + "\n";
            });
            if (eventText.includes("### 📊") && eventText.includes("```json")) {
              bestText = eventText;
            } else if (!bestText && eventText.trim().length > 0) {
              fullText += eventText + "\n";
            }
          }
        });
        
        if (bestText) fullText = bestText;

        if (fullText) {
          setAwaitingApproval(true);
          const cleanText = fullText.replace("[AWAITING_USER_APPROVAL]", "").trim();

          setMessages(prev => [...prev, { role: 'agent', text: cleanText }]);

          let navigated = false;
          let hasChecklistData = false;

          if (fullText.includes("```json")) {
            const blocks = fullText.split("```json");
            for (let i = 1; i < blocks.length; i++) {
              let jsonStr = "";
              try {
                jsonStr = blocks[i].split("```")[0];
                const lastBraceIndex = jsonStr.lastIndexOf("}");
                if (lastBraceIndex !== -1) jsonStr = jsonStr.substring(0, lastBraceIndex + 1);

                const cleanedJson = jsonStr.replace(/,\s*([\]}])/g, "$1");
                const parsed = JSON.parse(cleanedJson);

                const checklistData = parsed.checklist || parsed.checklist_results;
                if (checklistData && Array.isArray(checklistData)) {
                  const flatChecklist = checklistData.flatMap((node: any) => {
                    if (node.items && Array.isArray(node.items)) {
                      return node.items.map((item: any) => ({
                        id: item.id || item.check || Math.random().toString(),
                        title: item.check || item.title || "N/A",
                        description: item.details || item.description || item.note || "",
                        status: (item.status?.toLowerCase() === 'warning' || item.status?.toLowerCase() === 'error' || item.status?.toLowerCase() === 'fail') ? 'warning' : 
                                (item.status?.toLowerCase() === 'complete' || item.status?.toLowerCase() === 'passed' || item.status?.toLowerCase() === 'pass') ? 'complete' : 'pending'
                      }));
                    } else {
                      return [{
                        id: node.id || node.check || node.title || Math.random().toString(),
                        title: node.check || node.title || "N/A",
                        description: node.details || node.description || node.note || "",
                        status: (node.status?.toLowerCase() === 'warning' || node.status?.toLowerCase() === 'error' || node.status?.toLowerCase() === 'fail') ? 'warning' : 
                                (node.status?.toLowerCase() === 'complete' || node.status?.toLowerCase() === 'passed' || node.status?.toLowerCase() === 'pass') ? 'complete' : 'pending'
                      }];
                    }
                  });
                  setChecklist(flatChecklist);
                  hasChecklistData = flatChecklist.length > 0;
                }

                const mappingData = parsed.mappings || parsed.mappings_results;
                if (mappingData) {
                  setMappings(mappingData);
                  
                  // Extract non-JSON markdown for the report, cutting off at the System Integration Data section
                  let textOnly = cleanText;
                  const cutoffPoints = [
                    textOnly.indexOf("### ⚙️ System Integration Data"),
                    textOnly.indexOf("```json")
                  ].filter(index => index !== -1);
                  
                  if (cutoffPoints.length > 0) {
                    // Find the earliest occurrence to slice from
                    const sliceIndex = Math.min(...cutoffPoints);
                    textOnly = textOnly.substring(0, sliceIndex).trim();
                  }
                  
                  if (textOnly) {
                    setMappingReport(textOnly);
                  }

                  setActivePage('mapping'); 
                  navigated = true;
                }
              } catch (e) {
                console.error("⚠️ JSON Parse Error:", e);
              }
            }
          }

          const files: { [key: string]: string } = {};
          let tfReportStr = "";

          const segments = fullText.split("### ");
          for (let i = 1; i < segments.length; i++) {
            const segment = segments[i];
            const lines = segment.split("\n");
            let header = lines[0].trim().replace("[", "").replace("]", "");

            // 파서: '📝' 기호가 있거나 'Terraform Architecture Analysis' 헤더가 있으면 리포트로 취급
            if (header.includes("📝") || header.toLowerCase().includes("analysis")) {
               tfReportStr = lines.slice(1).join("\n").trim();
               continue;
            }

            let filename = header;
            if (!filename.includes(".tf")) filename = filename + ".tf"; 
            
            if (segment.includes("```hcl")) {
              files[filename] = segment.split("```hcl")[1].split("```")[0];
            } else if (segment.includes("```terraform")) {
              files[filename] = segment.split("```terraform")[1].split("```")[0];
            }
          }

          if (tfReportStr) {
            setTerraformReport(tfReportStr);
          }

          if (Object.keys(files).length === 0) {
              const codeBlockRegex = /```(?:hcl|terraform)\n([\s\S]*?)```/g;
              let match;
              let fileIndex = 1;
              while ((match = codeBlockRegex.exec(fullText)) !== null) {
                  files[`main_${fileIndex}.tf`] = match[1].trim();
                  fileIndex++;
              }
          }

          if (Object.keys(files).length > 0) {
            setTerraformFiles(files);
            setActivePage('terraform');
            navigated = true;
          }

          if (!navigated && (cleanText.includes("### 📊") || cleanText.includes("### 🌐") || hasChecklistData)) {
            // let displayReport = cleanText;
            // 🛡️ [수정] JSON 블록도 화면에 보이도록 자르기 로직(substring)을 제거했습니다.
            setAnalysisReport(cleanText);
            setActivePage('analysis');
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'agent', text: "❌ API Error: " + e.message }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden w-full">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage={activePage} onPageChange={setActivePage} appMode={appMode} onModeChange={setAppMode} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto blueprint-grid">
          <div className="p-12 max-w-7xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activePage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                {activePage === 'upload' && <UploadPage onAnalyze={(d, m, f) => { setLoadingMsg("🔍 Analyzing AWS infrastructure architecture..."); handleRunAgent(d, m, f, "aws_analyzer"); }} isLoading={isLoading} />}
                {activePage === 'analysis' && <AnalysisPage report={analysisReport} checklistItems={checklist} awaitingApproval={awaitingApproval} onConfirm={() => {
                  try {
                    const safeChecklist = Array.isArray(checklist) ? JSON.stringify(checklist) : "[]";
                    handleRunAgent(`다음 AWS 아키텍처 분석 결과를 바탕으로 GCP 리소스로 매핑(번역)해 주세요.\n\n${analysisReport}\n\n${safeChecklist}`, null, null, "gcp_translator");
                  } catch (e) {
                    handleRunAgent(`다음 AWS 아키텍처 분석 결과를 바탕으로 GCP 리소스로 매핑(번역)해 주세요.\n\n${analysisReport}`, null, null, "gcp_translator");
                  }
                }} onFeedback={(text) => handleRunAgent(text, null, null, "aws_analyzer")} isLoading={isLoading} setLoadingMsg={setLoadingMsg} />}
                {activePage === 'mapping' && <MappingPage mappings={mappings} report={mappingReport} onConfirm={() => {
                  try {
                    const safeMappings = Array.isArray(mappings) ? JSON.stringify(mappings) : "[]";
                    const generatorPrompt = `다음은 AWS에서 GCP로 마이그레이션하기 위한 종합 아키텍처 데이터입니다. 이 데이터를 완벽하게 분석하여 Production-Ready 수준의 엔터프라이즈 GCP Terraform 코드를 생성해 주세요.

--- [1. 원본 아키텍처 스펙 및 분석 데이터 (System Integration Data)] ---
${analysisReport}

--- [2. GCP 네이티브 아키텍처 최적화 설계 가이드] ---
${mappingReport}

--- [3. 리소스 1:1 매핑 변환표] ---
${safeMappings}`;

                    handleRunAgent(generatorPrompt, null, null, "tf_generator");
                  } catch (e) {
                  }
                }} awaitingApproval={awaitingApproval} isLoading={isLoading} />}
                {activePage === 'terraform' && <TerraformPage files={terraformFiles} report={terraformReport} />}
                {activePage === 'audit_setup' && <AuditSetupPage onStartAudit={handleStartAudit} />}
                {activePage === 'audit_report' && <AuditReportPage projectId={auditProjectId} saKey={auditSaKey} existingReport={infrastructureReport} onProceed={handleAnalysisComplete} isLoading={isLoading} setIsLoading={setIsLoading} />}
                {activePage === 'audit_live' && <AuditLivePage projectId={auditProjectId} rules={auditRules} infrastructureReport={infrastructureReport} />}
              </motion.div>
            </AnimatePresence>
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
    </div>
  );
}