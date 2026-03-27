"use client";

import { useState, useCallback, useEffect } from "react";
import { useTransitionRouter } from "next-view-transitions";
import type { Message, DraftProfile, ChatResponse } from "@/types";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PreferenceBuilder } from "@/components/chat/PreferenceBuilder";

export function ChatClient() {
  const router = useTransitionRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftProfile, setDraftProfile] = useState<Partial<DraftProfile>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], draftProfile: {} }),
    })
      .then((res) => res.json())
      .then((data: ChatResponse) => {
        const agentMsg: Message = {
          id: crypto.randomUUID(),
          role: "agent",
          content: data.message,
          timestamp: new Date().toISOString(),
        };
        setMessages([agentMsg]);
        if (data.profilePatch) {
          setDraftProfile((prev) => ({ ...prev, ...data.profilePatch }));
        }
      });
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages, draftProfile }),
        });

        const data: ChatResponse = await res.json();

        const agentMsg: Message = {
          id: crypto.randomUUID(),
          role: "agent",
          content: data.message,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, agentMsg]);

        if (data.profilePatch) {
          setDraftProfile((prev) => ({ ...prev, ...data.profilePatch }));
        }

        // Check if agent is ready to start
        if (data.readyToStart && data.action === "START_SEARCH") {
          setConfirmed(true);

          // Start the search
          await fetch("/api/searches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              preferences: data.preferences ?? draftProfile,
            }),
          });

          // Brief delay to let user read the final message
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        }
      } catch (err) {
        console.error("Chat error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, draftProfile, router]
  );

  return (
    <main className="flex h-screen">
      {/* Chat panel — 60% */}
      <div className="w-[60%] border-r border-border flex flex-col">
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
        />
      </div>

      {/* Preference builder — 40% */}
      <div className="w-[40%] p-6 overflow-y-auto bg-off-white">
        <PreferenceBuilder profile={draftProfile} confirmed={confirmed} />
      </div>
    </main>
  );
}
