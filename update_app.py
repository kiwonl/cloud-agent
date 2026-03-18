with open('frontend/src/App.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if line.startswith("const ChecklistPage = "):
        start_idx = i
    if line.startswith("const TerraformPage = "):
        end_idx = i

if start_idx != -1 and end_idx != -1:
    new_analysis = """const AnalysisPage = ({ report, checklistItems, awaitingApproval, onConfirm, onFeedback, isLoading, setLoadingMsg }: { report: string, checklistItems: VerificationItem[], awaitingApproval: boolean, onConfirm: () => void, onFeedback: (text: string) => void, isLoading: boolean, setLoadingMsg: (msg: string) => void }) => {
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

"""
    new_lines = lines[:start_idx] + [new_analysis] + lines[end_idx:]
    
    content = "".join(new_lines)
    
    # Fix Sidebar mapping
    content = content.replace("{ id: 'checklist', label: 'Migration Checklist', icon: 'ClipboardCheck' },\n", "")
    # Fix routes mapping
    content = content.replace("{activePage === 'checklist' && <ChecklistPage items={checklist} onConfirm={() => handleRunAgent(\"APPROVE_CHECKLIST\")} onFeedback={(text) => handleRunAgent(text)} awaitingApproval={awaitingApproval} isLoading={isLoading} />}\n", "")
    # Replace old analysis routing with new props
    content = content.replace(
        "{activePage === 'analysis' && <AnalysisPage report={analysisReport} awaitingApproval={awaitingApproval} onConfirm={() => handleRunAgent(\"APPROVE_ANALYSIS\")} onFeedback={(text) => handleRunAgent(text)} isLoading={isLoading} setLoadingMsg={setLoadingMsg} />}", 
        "{activePage === 'analysis' && <AnalysisPage report={analysisReport} checklistItems={checklist} awaitingApproval={awaitingApproval} onConfirm={() => handleRunAgent(\"APPROVE_ANALYSIS\")} onFeedback={(text) => handleRunAgent(text)} isLoading={isLoading} setLoadingMsg={setLoadingMsg} />}"
    )

    with open('frontend/src/App.tsx', 'w') as f:
        f.write(content)
