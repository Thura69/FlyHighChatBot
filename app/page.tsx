"use client";
import { Loader } from "lucide-react";
import React, { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState<string>("");
  const [conversation, setConversation] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);

  const handleQuery = async () => {
    if (!query.trim()) return; // Prevent sending empty input
    setLoading(true); // Start loading state

    // Add user message to conversation
    setConversation((prev: any) => [...prev, { sender: "user", text: query }]);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          step, // Send current conversation step to backend
          conversation, // Send conversation history
        }),
      });

      const data = await response.json();

      setConversation((prev: any) => [
        ...prev,
        { sender: "bot", text: data.answer }, // Show bot response
      ]);

      setStep(data.nextStep);
    } catch (error) {
      console.error("Error fetching answer:", error);
      setConversation((prev: any) => [
        ...prev,
        { sender: "bot", text: "Error fetching answer." },
      ]);
    } finally {
      setLoading(false); // End loading state
      setQuery(""); // Clear user input
    }
  };

  return (
    <div className="flex flex-col items-center h-screen bg-gray-100">
      <div className="  w-[75svw] p-4 bg-white shadow-lg rounded-lg mt-10 flex flex-col flex-grow">
        <h1 className="text-2xl text-[#333333] font-bold mb-4 text-center">
          AI Chat Bot
        </h1>

        {/* Conversation display */}
        <div className="flex flex-col space-y-3 overflow-y-auto flex-grow bg-gray-50 p-4 rounded-lg mb-4 max-h-[600px]">
          <div className={`flex ${"justify-start"}`}>
            <div
              className={`${"bg-gray-300 text-black"} p-3 rounded-lg max-w-xs`}
            >
              配布予定部数を教えてください(例：10,000部)
            </div>
          </div>
          {conversation.map((message: any, index: any) => (
            <div
              key={index}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.text === "false" || message.text === "notBusiness" ? (
                <div
                  className={`${
                    message.sender === "user"
                      ? "bg-[#0BACAC] text-white"
                      : "bg-red-200 text-black"
                  } p-3 rounded-lg max-w-xs`}
                >
                  {message.text === "false" && (
                    <span>例に示されている形式を書き直してください。</span>
                  )}
                  {message.text === "notBusiness" && (
                    <span>
                      チラシ配布の価値を入力してください。またはビジネス目的には不適切です
                    </span>
                  )}
                </div>
              ) : (
                <div
                  className={`${
                    message.sender === "user"
                      ? "bg-[#0BACAC] text-white"
                      : "bg-gray-300 text-black"
                  } p-3 rounded-lg max-w-xs`}
                >
                  <p>
                    {message.text.split("/br").map((line:any, index:any) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input section */}
        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-grow p-2 border rounded-lg focus:outline-none focus:border-blue-400 text-black"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="入力してください"
            disabled={loading}
          />
          <button
            onClick={handleQuery}
            className="bg-[#0BACAC] w-[150px] flex justify-center items-center text-white p-2 rounded-lg hover:bg-[#0bacacdb] disabled:bg-[#5f9090]"
            disabled={loading}
          >
            {loading ? <Loader /> : "送信"}
          </button>
        </div>
      </div>
    </div>
  );
}
