import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  ClipboardList,
  LogOut,
  ChevronDown,
} from "lucide-react";

const App = () => {
  const [token, setToken] = useState(
    localStorage.getItem("clickup_token") || ""
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("clickup_token")
  );
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveToken = () => {
    if (!token) return alert("Please enter your ClickUp API token");
    localStorage.setItem("clickup_token", token);
    handleLogin();
  };

  const logout = () => {
    localStorage.removeItem("clickup_token");
    setToken("");
    setIsLoggedIn(false);
    setWorkspaces([]);
    setTasks([]);
    setSelectedWorkspace(null);
    setSelectedAssignees([]);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://api.clickup.com/api/v2/team", {
        headers: { Authorization: token },
      });
      setWorkspaces(res.data.teams);
      setIsLoggedIn(true);
    } catch (err) {
      console.error(err);
      alert("Invalid token or API error");
      localStorage.removeItem("clickup_token");
      setToken("");
      setIsLoggedIn(false);
    }
    setLoading(false);
  };

  const fetchTasks = async (workspaceId) => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://api.clickup.com/api/v2/team/${workspaceId}/task`,
        { headers: { Authorization: token } }
      );
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
      alert("Error fetching tasks");
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn && workspaces.length === 0) handleLogin();
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchTasks(selectedWorkspace.id);
      setSelectedAssignees([]);
    }
  }, [selectedWorkspace]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "done":
      case "complete":
        return <CheckCircle className="text-green-400" size={20} />;
      case "in progress":
      case "doing":
        return <Clock className="text-yellow-400" size={20} />;
      case "urgent":
      case "blocked":
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <ClipboardList className="text-gray-400" size={20} />;
    }
  };

  // Generate unique color for each user based on ID
  // Generate a consistent color for each assignee based on ID
  const getColorFromId = (id) => {
    const strId = String(id); // ✅ ensure it's always a string
    let hash = 0;
    for (let i = 0; i < strId.length; i++) {
      hash = strId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.floor(Math.abs(Math.sin(hash) * 16777215) % 16777215);
    return `#${color.toString(16).padStart(6, "0")}`;
  };

  // Unique assignees
  const assignees = useMemo(() => {
    const unique = {};
    tasks.forEach((task) => {
      if (!task.assignees?.length)
        unique["none"] = { id: "none", username: "No Assignee" };
      task.assignees.forEach((a) => {
        unique[a.id] = a;
      });
    });
    return Object.values(unique);
  }, [tasks]);

  // Filter tasks based on selected assignees
  const filteredTasks = useMemo(() => {
    if (selectedAssignees.length === 0) return tasks;
    return tasks.filter((task) => {
      if (task.assignees.length === 0 && selectedAssignees.includes("none"))
        return true;
      return task.assignees.some((a) => selectedAssignees.includes(a.id));
    });
  }, [tasks, selectedAssignees]);

  const toggleAssignee = (id) => {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] via-[#0E1A2B] to-[#1B2735] text-gray-100 px-8 py-6 font-sans">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-400 tracking-tight">
          ClickUp Dashboard
        </h1>
        {isLoggedIn && (
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        )}
      </header>

      {!isLoggedIn ? (
        <div className="flex flex-col items-center justify-center mt-32 space-y-5">
          <div className="bg-[#131C2E] border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 text-center text-blue-300">
              🔐 Enter ClickUp API Token
            </h2>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your ClickUp API token"
              className="w-full bg-[#1E2A3D] text-gray-100 border border-gray-600 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={saveToken}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-all font-semibold"
            >
              {loading ? "Checking..." : "Login"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Workspace Dropdown & Assignee Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <label className="text-lg font-medium text-gray-300 mr-4">
                Workspace:
              </label>
              <div className="relative inline-block w-80">
                <select
                  className="appearance-none w-full bg-[#131C2E] border border-gray-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    setSelectedWorkspace(
                      workspaces.find((w) => w.id === e.target.value)
                    )
                  }
                  value={selectedWorkspace?.id || ""}
                >
                  <option value="">-- Choose Workspace --</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"
                  size={18}
                />
              </div>
            </div>

            {assignees.length > 0 && (
              <div className="flex flex-wrap gap-3 bg-[#131C2E] border border-gray-700 rounded-lg p-4">
                {assignees.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(a.id)}
                      onChange={() => toggleAssignee(a.id)}
                      className="accent-blue-500"
                    />
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: getColorFromId(a.id) }}
                    >
                      <User size={14} className="text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">
                      {a.username || "No Assignee"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Task Display */}
          {loading ? (
            <p className="text-center text-gray-400 mt-10">Loading tasks...</p>
          ) : selectedWorkspace ? (
            <>
              <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center gap-2">
                <User className="text-blue-500" /> {selectedWorkspace.name}
              </h2>
              {filteredTasks.length > 0 ? (
                <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#111A2A] hover:bg-[#16233A] rounded-2xl border border-gray-700 shadow-lg p-5 transition-transform hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-lg text-gray-100">
                          {task.name}
                        </h3>
                        {getStatusIcon(task.status?.status)}
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        {task.status?.status || "No status"}
                      </p>

                      {task.assignees?.length > 0 ? (
                        <div className="flex -space-x-3 mt-3">
                          {task.assignees.map((a) => (
                            <div
                              key={a.id}
                              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#0A0F1C]"
                              style={{
                                backgroundColor: getColorFromId(a.id),
                              }}
                              title={a.username}
                            >
                              <User size={14} className="text-white" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500 text-sm mt-3">
                          <User size={14} className="mr-1" /> No assignee
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tasks found.</p>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center mt-10">
              Select a workspace to view tasks.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
