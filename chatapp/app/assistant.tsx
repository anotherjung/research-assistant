"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useState, createContext, useContext } from "react";

// Agent context for the entire app
type AgentType = 'researchAgent' | 'weatherAgent';

interface AgentContextType {
  selectedAgent: AgentType;
  setSelectedAgent: (agent: AgentType) => void;
}

const AppAgentContext = createContext<AgentContextType | null>(null);

export const useAppAgent = () => {
  const context = useContext(AppAgentContext);
  if (!context) {
    throw new Error('useAppAgent must be used within AppAgentProvider');
  }
  return context;
};

export const Assistant = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('researchAgent');
  
  // Enhanced agent selection with logging
  const handleAgentChange = (agent: AgentType) => {
    console.log('[App Context] Agent changing from', selectedAgent, 'to', agent);
    setSelectedAgent(agent);
  };

  // Create runtime with dynamic agent selection
  const runtime = useChatRuntime({
    api: "/api/chat",
    body: () => ({
      agent: selectedAgent, // Dynamic agent selection
    }),
    onError: (error) => {
      console.error('[Runtime] Chat runtime error:', error);
    },
    onResponse: (response) => {
      console.log('[Runtime] API response received:', response.status, response.statusText);
    },
    onFinish: (message) => {
      console.log('[Runtime] Stream finished:', message);
    }
  });

  return (
    <AppAgentContext.Provider value={{ selectedAgent, setSelectedAgent: handleAgentChange }}>
      <AssistantRuntimeProvider runtime={runtime}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Mastra Multi-Agent Chat
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      Research & Weather Agents
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <Thread />
          </SidebarInset>
        </SidebarProvider>
      </AssistantRuntimeProvider>
    </AppAgentContext.Provider>
  );
};
