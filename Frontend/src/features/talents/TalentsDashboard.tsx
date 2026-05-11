import { useState, useEffect } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";
import {
  getMyConnections,
  getRequestedConnections,
  acceptConnectionRequest,
  sendMessage,
  getMessages,
  endorseSkill,
  getSkillEndorsements,
  getTalentNetwork,
  type Connection,
  type Message,
  type SkillEndorsement,
  type NetworkTalent,
} from "../../api/talent/talentApi";

export default function TalentsDashboard() {
  const { darkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState<
    "network" | "requests" | "messages" | "endorsements"
  >("network");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [network, setNetwork] = useState<NetworkTalent[]>([]);
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testStatus, setTestStatus] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connRes, reqRes, netRes, endRes] = await Promise.all([
        getMyConnections(),
        getRequestedConnections(),
        getTalentNetwork(),
        getSkillEndorsements(),
      ]);
      setConnections(connRes.connections || []);
      setRequests(reqRes.connections || []);
      setNetwork(netRes.network || []);
      setEndorsements(endRes.endorsements || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setTestMode(true);
    setTestStatus("Running tests...");
    const results: string[] = [];

    try {
      // Test 1: Load connections
      results.push("✓ Test 1: Loading connections...");
      const connRes = await getMyConnections();
      results.push(`  Found ${connRes.connections?.length || 0} connections`);

      // Test 2: Load requests
      results.push("✓ Test 2: Loading connection requests...");
      const reqRes = await getRequestedConnections();
      results.push(`  Found ${reqRes.connections?.length || 0} pending requests`);

      // Test 3: Load network
      results.push("✓ Test 3: Loading talent network...");
      const netRes = await getTalentNetwork();
      results.push(`  Found ${netRes.network?.length || 0} talents in network`);

      // Test 4: Load endorsements
      results.push("✓ Test 4: Loading skill endorsements...");
      const endRes = await getSkillEndorsements();
      results.push(`  Found ${endRes.endorsements?.length || 0} endorsed skills`);

      // Test 5: Load messages (if connection exists)
      if (connRes.connections && connRes.connections.length > 0) {
        results.push("✓ Test 5: Loading messages...");
        const msgRes = await getMessages(
          connRes.connections[0].talent_id || connRes.connections[0].sender_id || 0
        );
        results.push(`  Found ${msgRes.messages?.length || 0} messages`);
      } else {
        results.push("⊘ Test 5: Skipped (no connections to test messaging)");
      }

      results.push("\n✅ All tests completed successfully!");
      setTestStatus(results.join("\n"));
    } catch (error: any) {
      results.push(`\n❌ Error: ${error.message}`);
      setTestStatus(results.join("\n"));
    }
  };

  const handleAcceptRequest = async (connectionId: number) => {
    try {
      await acceptConnectionRequest(connectionId);
      setRequests(requests.filter((r) => r.id !== connectionId));
      await loadData();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleSelectConnection = async (connection: Connection) => {
    setSelectedConnection(connection);
    try {
      const msgRes = await getMessages(connection.talent_id || connection.sender_id || 0);
      setMessages(msgRes.messages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConnection) return;
    try {
      await sendMessage(
        selectedConnection.talent_id || selectedConnection.sender_id || 0,
        messageText,
      );
      setMessageText("");
      await handleSelectConnection(selectedConnection);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleEndorseSkill = async (talentId: number, skillId: number) => {
    try {
      await endorseSkill(talentId, skillId);
      await loadData();
    } catch (error) {
      console.error("Error endorsing skill:", error);
    }
  };

  const bgClass = darkMode ? "bg-gray-900" : "bg-slate-100";
  const cardClass = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-slate-200 shadow-sm";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const mutedClass = darkMode ? "text-gray-400" : "text-gray-600";
  const inputClass = darkMode
    ? "bg-gray-700 border-gray-600 text-white"
    : "bg-white border-slate-300 text-gray-900";

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-3xl font-bold ${textClass}`}>
            Talent Network
          </h1>
          <button
            onClick={runTests}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            🧪 Run Tests
          </button>
        </div>

        {/* Test Results Modal */}
        {testMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${cardClass} rounded-lg border p-8 max-w-2xl w-full max-h-96 overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${textClass}`}>Test Results</h2>
                <button
                  onClick={() => setTestMode(false)}
                  className="text-2xl text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <pre className={`${inputClass} p-4 rounded text-sm whitespace-pre-wrap font-mono border`}>
                {testStatus}
              </pre>
              <button
                onClick={() => setTestMode(false)}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-300 dark:border-gray-700">
          {[
            { id: "network", label: "Network" },
            { id: "requests", label: `Requests (${requests.length})` },
            { id: "messages", label: "Messages" },
            { id: "endorsements", label: "Endorsements" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(
                  tab.id as
                    | "network"
                    | "requests"
                    | "messages"
                    | "endorsements",
                )
              }
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-[#0084ca] text-[#0084ca]"
                  : mutedClass
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Network Tab */}
        {activeTab === "network" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.length === 0 ? (
              <p className={mutedClass}>No connections yet</p>
            ) : (
              connections.map((conn) => (
                <div
                  key={conn.id}
                  className={`${cardClass} rounded-xl border p-6 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start gap-4">
                    {conn.profile_image && (
                      <img
                        src={conn.profile_image}
                        alt={conn.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${textClass}`}>
                        {conn.name}
                      </h3>
                      <p className={`text-sm ${mutedClass} line-clamp-2`}>
                        {conn.about}
                      </p>
                    </div>
                  </div>
                  {conn.skills && (
                    <div className="mt-4">
                      <p className={`text-xs font-medium ${mutedClass} mb-2`}>
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {conn.skills.split(",").slice(0, 3).map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-[#0084ca]/10 dark:bg-blue-900 text-[#0084ca] dark:text-blue-200 text-xs rounded-full font-medium"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleSelectConnection(conn)}
                    className="mt-4 w-full px-4 py-2 bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    Message
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <p className={mutedClass}>No pending requests</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className={`${cardClass} rounded-xl border p-6 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {req.profile_image && (
                      <img
                        src={req.profile_image}
                        alt={req.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className={`font-semibold ${textClass}`}>
                        {req.name}
                      </h3>
                      <p className={`text-sm ${mutedClass}`}>{req.about}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    Accept
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Connections List */}
            <div className={`${cardClass} rounded-xl border p-4`}>
              <h3 className={`font-semibold ${textClass} mb-4`}>
                Conversations
              </h3>
              <div className="space-y-2">
                {connections.map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => handleSelectConnection(conn)}
                    className={`w-full text-left p-3 rounded transition-colors ${
                      selectedConnection?.id === conn.id
                        ? "bg-[#0084ca]/10 text-[#0084ca] font-medium"
                        : "hover:bg-slate-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <p className={`font-medium ${textClass}`}>{conn.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            {selectedConnection ? (
              <div className={`lg:col-span-2 ${cardClass} rounded-xl border p-6 flex flex-col`}>
                <h3 className={`font-semibold ${textClass} mb-4`}>
                  {selectedConnection.name}
                </h3>
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-96">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === selectedConnection.sender_id
                          ? "justify-start"
                          : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender_id === selectedConnection.sender_id
                            ? "bg-slate-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            : "bg-[#0084ca] text-white"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    placeholder="Type a message..."
                    className={`flex-1 px-4 py-2 rounded-lg border ${inputClass} outline-none focus:ring-2 focus:ring-[#0084ca]/30`}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-5 py-2 bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg transition-colors font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div className={`lg:col-span-2 ${cardClass} rounded-xl border p-6 flex items-center justify-center`}>
                <p className={mutedClass}>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        )}

        {/* Endorsements Tab */}
        {activeTab === "endorsements" && (
          <div className="space-y-6">
            {/* My Endorsements */}
            <div>
              <h3 className={`text-xl font-semibold ${textClass} mb-4`}>
                My Skill Endorsements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {endorsements.length === 0 ? (
                  <p className={mutedClass}>No endorsements yet</p>
                ) : (
                  endorsements.map((endorsement) => (
                    <div
                      key={endorsement.id}
                      className={`${cardClass} rounded-xl border p-4`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-semibold ${textClass}`}>
                            {endorsement.skill_name}
                          </h4>
                          <p className={`text-sm ${mutedClass}`}>
                            {endorsement.endorsement_count} endorsements
                          </p>
                        </div>
                        <div className="text-2xl font-bold text-[#0084ca]">
                          {endorsement.endorsement_count}
                        </div>
                      </div>
                      {endorsement.endorsed_by && (
                        <p className={`text-xs ${mutedClass} mt-2`}>
                          Endorsed by: {endorsement.endorsed_by}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Network Skills to Endorse */}
            <div>
              <h3 className={`text-xl font-semibold ${textClass} mb-4`}>
                Endorse Network Skills
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {network.map((talent) => (
                  <div
                    key={talent.talent_id}
                    className={`${cardClass} rounded-xl border p-6`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {talent.profile_image && (
                        <img
                          src={talent.profile_image}
                          alt={talent.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h4 className={`font-semibold ${textClass}`}>
                          {talent.name}
                        </h4>
                        <p className={`text-xs ${mutedClass}`}>
                          {talent.total_endorsements} endorsements
                        </p>
                      </div>
                    </div>
                    {talent.skills && (
                      <div className="space-y-2">
                        {talent.skills.split(",").map((skill, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              handleEndorseSkill(talent.talent_id ?? 0, i + 1)
                            }
                            className="w-full px-3 py-2 text-sm bg-[#0084ca]/10 dark:bg-blue-900 text-[#0084ca] dark:text-blue-200 rounded-lg hover:bg-[#0084ca]/20 dark:hover:bg-blue-800 transition-colors font-medium"
                          >
                            Endorse: {skill.trim()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
