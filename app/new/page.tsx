"use client";

import React, { useState } from 'react';
import {
    Menu,
    Home,
    Clock,
    FileText,
    Settings,
    ChevronRight,
    Sparkles,
    Zap,
    Box,
    Terminal,
    Search,
    Plus,
    MoreVertical,
    HelpCircle,
    Code,
    Play,
    X,
    SlidersHorizontal
} from 'lucide-react';

export default function GoogleAIStudioReplica() {
    const [activeTab, setActiveTab] = useState('playground');
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-[#131314] text-[#e3e3e3] overflow-hidden font-sans text-[14px] relative">

            {/* Mobile Overlay */}
            {(isLeftSidebarOpen || isRightSidebarOpen) && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => { setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false); }}
                />
            )}

            {/* Left Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col border-r border-[#444746] bg-[#131314] transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Header */}
                <div className="h-14 flex items-center px-4 gap-3">
                    <div className="font-medium text-lg tracking-tight text-white">Google AI Studio</div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
                    <NavItem icon={<Home size={18} />} label="Home" />
                    <NavItem icon={<Terminal size={18} />} label="Playground" active />
                    <NavItem icon={<Clock size={18} />} label="Cipher Mining Stock Performan..." />
                    <NavItem icon={<FileText size={18} />} label="Trump's Gifts: Different Satisfa..." />
                    <NavItem icon={<FileText size={18} />} label="BMC vs. LC: Business Model Fr..." />
                    <NavItem icon={<FileText size={18} />} label="비즈니스 모델 캔버스 구성요소 요약" />

                    <div className="pt-2 pb-1 px-3 text-xs text-[#8e918f] hover:text-white cursor-pointer flex items-center gap-1">
                        View all history <ChevronRight size={12} />
                    </div>

                    <div className="my-2 border-t border-[#444746]/50"></div>

                    <NavItem icon={<Settings size={18} />} label="Build" hasSubmenu />
                    <NavItem icon={<Box size={18} />} label="Dashboard" hasSubmenu />
                    <NavItem icon={<FileText size={18} />} label="Documentation" isExternal />
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-[#444746]">
                    <div className="px-3 py-2 text-xs text-[#8e918f] mb-2">
                        Google AI models may make mistakes, so double-check outputs.
                    </div>
                    <NavItem icon={<Zap size={18} />} label="Get API key" />
                    <NavItem icon={<Settings size={18} />} label="Settings" />
                    <div className="flex items-center gap-3 px-3 py-2 mt-1 hover:bg-[#2d2e31] rounded-md cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white">A</div>
                        <div className="text-sm truncate">arendellecap@gmail....</div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-14 border-b border-[#444746] flex items-center justify-between px-4 bg-[#131314]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                            className="p-1 hover:bg-[#2d2e31] rounded text-[#c4c7c5] md:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <button className="p-1 hover:bg-[#2d2e31] rounded text-[#c4c7c5] hidden md:block">
                            <Menu size={20} />
                        </button>
                        <span className="font-medium text-[#e3e3e3]">Playground</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                            className="p-2 hover:bg-[#2d2e31] rounded-full text-[#c4c7c5] lg:hidden"
                        >
                            <SlidersHorizontal size={18} />
                        </button>
                        <button className="p-2 hover:bg-[#2d2e31] rounded-full text-[#c4c7c5] hidden sm:block">
                            <Sparkles size={18} />
                        </button>
                        <button className="p-2 hover:bg-[#2d2e31] rounded-full text-[#c4c7c5] hidden sm:block">
                            <Plus size={18} />
                        </button>
                        <button className="p-2 hover:bg-[#2d2e31] rounded-full text-[#c4c7c5]">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">

                    <div className="w-full max-w-4xl mt-12 mb-8 text-center">
                        <h1 className="text-4xl font-normal text-white mb-8">Google AI Studio</h1>

                        <div className="flex items-center justify-center gap-2 mb-12">
                            <Badge text="Featured" active />
                            <Badge text="Gemini" />
                            <Badge text="Live" />
                            <Badge text="Images" />
                            <Badge text="Video" />
                            <Badge text="Audio" />
                        </div>

                        <div className="space-y-4 text-left">
                            <ModelCard
                                title="Gemini 3 Pro Preview"
                                badge="New"
                                desc="Our most intelligent model with SOTA reasoning and multimodal understanding, and powerful agentic and vibe coding capabilities"
                                icon={<Sparkles className="text-[#a8c7fa]" size={20} />}
                            />
                            <ModelCard
                                title="Nano Banana"
                                desc="State-of-the-art image generation and editing model."
                                icon={<Box className="text-[#a8c7fa]" size={20} />}
                            />
                            <ModelCard
                                title="Gemini Flash Latest"
                                desc="Our hybrid reasoning model, with a 1M token context window and thinking budgets."
                                icon={<Sparkles className="text-[#a8c7fa]" size={20} />}
                            />
                        </div>
                    </div>

                </div>

                {/* Bottom Input Bar */}
                <div className="p-4 border-t border-[#444746] bg-[#131314]">
                    <div className="max-w-4xl mx-auto relative">
                        <div className="bg-[#1e1f20] border border-[#444746] rounded-3xl flex items-center p-1 pl-4">
                            <div className="p-2 bg-[#2d2e31] rounded-full mr-3">
                                <Sparkles size={16} className="text-[#c4c7c5]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Design a REST API for a social media platform. →"
                                className="flex-1 bg-transparent border-none outline-none text-[#e3e3e3] placeholder-[#8e918f] h-10"
                            />
                            <div className="flex items-center gap-2 pr-2">
                                <button className="p-2 hover:bg-[#3c3d40] rounded-full text-[#c4c7c5]">
                                    <Plus size={20} />
                                </button>
                                <button className="px-4 py-1.5 bg-[#2d2e31] hover:bg-[#3c3d40] rounded-full text-[#e3e3e3] text-sm font-medium flex items-center gap-2">
                                    Run <span className="text-xs text-[#8e918f]">Ctrl ↵</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Right Sidebar */}
            <aside className={`
                fixed inset-y-0 right-0 z-50 w-[300px] flex flex-col border-l border-[#444746] bg-[#131314] transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0
                ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="h-14 border-b border-[#444746] flex items-center justify-between px-4">
                    <span className="text-sm font-medium">Run settings</span>
                    <div className="flex gap-2">
                        <button className="text-xs flex items-center gap-1 text-[#a8c7fa] hover:bg-[#2d2e31] px-2 py-1 rounded">
                            <Code size={14} /> Get code
                        </button>
                        <button
                            onClick={() => setIsRightSidebarOpen(false)}
                            className="text-[#c4c7c5] hover:bg-[#2d2e31] p-1 rounded lg:hidden"
                        >
                            <X size={16} />
                        </button>
                        <button className="text-[#c4c7c5] hover:bg-[#2d2e31] p-1 rounded hidden lg:block"><X size={16} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* Model Selector */}
                    <div className="bg-[#1e1f20] rounded-lg p-3 border border-[#444746]">
                        <div className="text-sm font-medium text-[#a8c7fa] mb-1">Gemini 3 Pro Preview</div>
                        <div className="text-xs text-[#8e918f] mb-2">gemini-3-pro-preview</div>
                        <div className="text-xs text-[#c4c7c5] leading-relaxed">
                            Our most intelligent model with SOTA reasoning and multimodal understanding, and powerful agentic and vibe coding capabilities
                        </div>
                    </div>

                    {/* System Instructions */}
                    <div>
                        <div className="text-sm font-medium mb-2 flex justify-between">
                            System instructions
                        </div>
                        <div className="bg-[#1e1f20] border border-[#444746] rounded-lg p-3 h-24 text-xs text-[#8e918f]">
                            Optional tone and style instructions for the model
                        </div>
                    </div>

                    {/* No API Key Warning */}
                    <div className="bg-[#1e1f20] border border-[#444746] rounded-lg p-3">
                        <div className="text-sm font-medium text-[#e3e3e3] mb-1">No API Key</div>
                        <div className="text-xs text-[#c4c7c5]">
                            Switch to a paid API key to unlock higher quota and more features.
                        </div>
                    </div>

                    {/* Sliders */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span>Temperature</span>
                            <span className="bg-[#1e1f20] px-2 rounded text-xs flex items-center">1</span>
                        </div>
                        <div className="h-1 bg-[#444746] rounded-full overflow-hidden">
                            <div className="w-1/2 h-full bg-[#a8c7fa]"></div>
                        </div>
                        <div className="w-3 h-3 bg-[#a8c7fa] rounded-full -mt-2 ml-[50%] cursor-pointer"></div>
                    </div>

                    {/* Dropdowns */}
                    <div>
                        <label className="text-sm block mb-2">Media resolution</label>
                        <div className="bg-[#1e1f20] border border-[#444746] rounded px-3 py-2 text-sm flex justify-between items-center">
                            Default <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm block mb-2">Thinking level</label>
                        <div className="bg-[#1e1f20] border border-[#444746] rounded px-3 py-2 text-sm flex justify-between items-center">
                            High <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>

                    {/* Tools Section */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-medium text-[#8e918f]">Tools</span>
                            <ChevronRight size={14} className="-rotate-90 text-[#8e918f]" />
                        </div>

                        <div className="space-y-3">
                            <ToolToggle label="Structured outputs" />
                            <ToolToggle label="Code execution" />
                            <ToolToggle label="Function calling" />
                            <ToolToggle label="Grounding with Google Search" />
                            <ToolToggle label="URL context" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mt-4">
                            <span className="text-xs font-medium text-[#8e918f]">Advanced settings</span>
                            <ChevronRight size={14} className="rotate-90 text-[#8e918f]" />
                        </div>
                    </div>

                </div>
            </aside>

        </div>
    );
}

function NavItem({ icon, label, active = false, hasSubmenu = false, isExternal = false }: any) {
    return (
        <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer group ${active ? 'bg-[#2d2e31] text-[#e3e3e3]' : 'text-[#c4c7c5] hover:bg-[#2d2e31] hover:text-[#e3e3e3]'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
                <span className={`${active ? 'text-[#a8c7fa]' : 'text-[#c4c7c5] group-hover:text-[#e3e3e3]'}`}>{icon}</span>
                <span className="text-sm truncate">{label}</span>
            </div>
            {hasSubmenu && <ChevronRight size={14} className="text-[#8e918f]" />}
            {isExternal && <ChevronRight size={14} className="-rotate-45 text-[#8e918f]" />}
        </div>
    );
}

function Badge({ text, active = false }: any) {
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${active ? 'bg-[#2d2e31] border-[#444746] text-[#e3e3e3]' : 'border-transparent text-[#c4c7c5] hover:bg-[#1e1f20]'}`}>
            {active && <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full bg-white"></span>}
            {text}
        </span>
    );
}

function ModelCard({ title, desc, badge, icon }: any) {
    return (
        <div className="group bg-[#1e1f20] hover:bg-[#2d2e31] border border-[#444746] rounded-xl p-4 cursor-pointer transition-all">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-[#131314] rounded-lg border border-[#444746] group-hover:border-[#5e5e5e]">
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-[#e3e3e3]">{title}</h3>
                        {badge && <span className="px-1.5 py-0.5 bg-[#2d2e31] text-[10px] font-bold text-[#a8c7fa] rounded border border-[#444746]">{badge}</span>}
                    </div>
                    <p className="text-sm text-[#c4c7c5] leading-relaxed">{desc}</p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-[#3c3d40] rounded text-[#c4c7c5]"><Box size={16} /></button>
                    <button className="p-1.5 hover:bg-[#3c3d40] rounded text-[#c4c7c5]"><Box size={16} /></button>
                </div>
            </div>
        </div>
    );
}

function ToolToggle({ label }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-[#e3e3e3]">{label}</span>
            <div className="w-8 h-4 bg-[#444746] rounded-full relative cursor-pointer">
                <div className="w-2 h-2 bg-[#8e918f] rounded-full absolute top-1 left-1"></div>
            </div>
        </div>
    );
}
