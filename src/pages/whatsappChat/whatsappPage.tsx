import { useEffect, useState } from "react";
import { ConnectionGate } from "./components/ConnectionGate";
import { DashboardHeader } from "./components/DashboardHeader";
import { ConversationList } from "./components/ConversationList";
import { ConversationPanel } from "./components/ConversationPanel";

function Dashboard() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);

    const fetchConversations = async () => {
        const res = await fetch("https://cuevstiendas-wa-apichat.xj7zln.easypanel.host/api/conversations");
        if (res.ok) setConversations(await res.json());
    };

    useEffect(() => {
        fetchConversations();
        const iv = setInterval(fetchConversations, 2000);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="h-full w-full flex flex-col overflow-hidden bg-white">
            <DashboardHeader />
            <div className="flex-1 flex overflow-hidden">
                <ConversationList
                    conversations={conversations}
                    activeId={activeId}
                    onSelect={setActiveId}
                />
                {activeId ? (
                    <ConversationPanel
                        conversationId={activeId}
                        key={activeId}
                        onDeleted={() => {
                            setActiveId(null);
                            fetchConversations();
                        }}
                    />
                ) : (
                    <div className="flex-1 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                        Selecciona una conversación para comenzar
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WhatsappPage() {
    return (
        <ConnectionGate>
            <Dashboard />
        </ConnectionGate>
    );
}
