"use client";

import { useCallback, useEffect, useState } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { mergeDraftProfile } from "@/lib/chat-intake";
import type { Message, DraftProfile, ChatPhase, ChatResponse } from "@/types";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PreferenceBuilder } from "@/components/chat/PreferenceBuilder";

export function ChatClient() {
  const router = useTransitionRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftProfile, setDraftProfile] = useState<Partial<DraftProfile>>({});
  const [phase, setPhase] = useState<ChatPhase>("collecting");
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const applyResponse = useCallback(
    (data: ChatResponse, baseProfile: Partial<DraftProfile>) => {
      const nextProfile = mergeDraftProfile(baseProfile, data.profilePatch ?? {});
      setDraftProfile(nextProfile);
      setPhase(data.phase);
      setQuickReplies(data.quickReplies ?? []);
      return nextProfile;
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialMessage() {
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], draftProfile: {} }),
        });

        const data: ChatResponse = await res.json();
        if (cancelled) {
          return;
        }

        applyResponse(data, {});
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "agent",
            content: data.message,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error("Initial chat load failed:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialMessage();

    return () => {
      cancelled = true;
    };
  }, [applyResponse]);

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
        const nextProfile = applyResponse(data, draftProfile);

        const agentMsg: Message = {
          id: crypto.randomUUID(),
          role: "agent",
          content: data.message,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, agentMsg]);

        // Check if agent is ready to start
        if (data.readyToStart && data.action === "START_SEARCH") {
          setConfirmed(true);

          // Start the search
          await fetch("/api/searches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              preferences: data.preferences ?? nextProfile,
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
    [applyResponse, messages, draftProfile, router]
  );

  return (
    <main className="flex h-screen">
      {/* Chat panel — 60% */}
      <div className="w-[60%] border-r border-border flex flex-col">
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          quickReplies={quickReplies}
        />
      </div>

      {/* Preference builder — 40% */}
      <div className="w-[40%] p-6 overflow-y-auto bg-off-white">
        <PreferenceBuilder
          profile={draftProfile}
          phase={phase}
          confirmed={confirmed}
        />
      </div>
    </main>
  );
}
