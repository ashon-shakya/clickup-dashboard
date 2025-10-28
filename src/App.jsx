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
  Grid,
} from "lucide-react";

import bgWallpaper from "./assets/bg-wallpaper2.jpg";

const App = () => {
  const [token, setToken] = useState(
    localStorage.getItem("clickup_token") || ""
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("clickup_token")
  );
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(
    JSON.parse(localStorage.getItem("last_workspace")) || null
  );
  const [tasks, setTasks] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [taskTypeFilter, setTaskTypeFilter] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [loading, setLoading] = useState(false);

  const saveToken = () => {
    if (!token) return alert("Please enter your ClickUp API token");
    localStorage.setItem("clickup_token", token);
    handleLogin();
  };

  const logout = () => {
    localStorage.removeItem("clickup_token");
    localStorage.removeItem("last_workspace");
    setToken("");
    setIsLoggedIn(false);
    setWorkspaces([]);
    setTasks([]);
    setSelectedWorkspace(null);
    setSelectedAssignees([]);
    setSelectedStatuses([]);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://api.clickup.com/api/v2/team", {
        headers: { Authorization: token },
      });
      setWorkspaces(res.data.teams || []);
      setIsLoggedIn(true);

      if (!selectedWorkspace && res.data.teams?.length > 0) {
        const firstWorkspace = res.data.teams[0];
        setSelectedWorkspace(firstWorkspace);
        localStorage.setItem("last_workspace", JSON.stringify(firstWorkspace));
      }
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
    if (selectedWorkspace) {
      fetchTasks(selectedWorkspace.id);
      localStorage.setItem("last_workspace", JSON.stringify(selectedWorkspace));
      setSelectedAssignees([]);
      setSelectedStatuses([]);
      setTaskTypeFilter("");
      setSortOption("");
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    if (isLoggedIn && workspaces.length === 0) handleLogin();
  }, [isLoggedIn]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "done":
      case "complete":
        return <CheckCircle className="text-green-400" size={20} />;
      case "in progress":
      case "doing":
        return <Clock className="text-yellow-400" size={20} />;
      case "blocked":
      case "urgent":
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <ClipboardList className="text-gray-400" size={20} />;
    }
  };

  const getColorFromId = (id) => {
    const strId = String(id);
    let hash = 0;
    for (let i = 0; i < strId.length; i++) {
      hash = strId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.floor(Math.abs(Math.sin(hash) * 16777215) % 16777215);
    return id ? `#${color.toString(16).padStart(6, "0")}` : "#888888";
  };

  const assignees = useMemo(() => {
    const unique = {};
    tasks.forEach((task) => {
      if (!task.assignees?.length)
        unique["none"] = { id: "none", username: "No Assignee" };
      task.assignees?.forEach((a) => (unique[a.id] = a));
    });
    return Object.values(unique);
  }, [tasks]);

  const toggleAssignee = (id) => {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const statuses = useMemo(() => {
    const unique = {};
    tasks.forEach((task) => {
      if (task.status?.status) unique[task.status.status] = task.status.status;
    });
    return Object.values(unique);
  }, [tasks]);

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const taskTypes = useMemo(() => {
    const types = new Set();
    tasks.forEach((t) => t.type && types.add(t.type));
    return Array.from(types);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (selectedAssignees.length > 0) {
      filtered = filtered.filter((task) => {
        if (task.assignees.length === 0 && selectedAssignees.includes("none"))
          return true;
        return task.assignees.some((a) => selectedAssignees.includes(a.id));
      });
    }

    if (taskTypeFilter)
      filtered = filtered.filter((task) => task.type === taskTypeFilter);
    if (selectedStatuses.length > 0)
      filtered = filtered.filter((task) =>
        selectedStatuses.includes(task.status?.status)
      );

    if (sortOption) {
      filtered = [...filtered].sort((a, b) => {
        switch (sortOption) {
          case "name":
            return a.name.localeCompare(b.name);
          case "date":
            return (a.date_created || 0) - (b.date_created || 0);
          case "assignees":
            return (a.assignees?.length || 0) - (b.assignees?.length || 0);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [tasks, selectedAssignees, selectedStatuses, taskTypeFilter, sortOption]);

  return (
    <div
      className="min-h-screen text-gray-100 px-8 py-6 font-sans"
      style={{
        // Updated this line to add a dark overlay
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url('${bgWallpaper}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <header className="flex justify-between items-center mb-8">
        <h1 className="flex items-center text-3xl font-bold text-blue-400 gap-2">
          <Grid size={28} /> ClickUp Dashboard
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
          <div className="bg-[#131C2E]/70 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-2 text-center text-blue-300 border-b py-4">
              🔐 Enter ClickUp API Token
            </h2>
            <div className="mt-2 text-sm text-gray-400 py-4 border-b mb-5">
              <p className="font-semibold">
                How to get your ClickUp API Token:
              </p>
              <ol className="list-decimal list-inside pl-2">
                <li>Log in to your ClickUp account.</li>
                <li>Click your profile avatar (bottom-left).</li>
                <li>
                  Select <strong>My Settings</strong>.
                </li>
                <li>
                  In the sidebar, click <strong>Apps</strong>.
                </li>
                <li>
                  Under "API Token", click <strong>Generate</strong> or{" "}
                  <strong>Copy</strong>.
                </li>
              </ol>
            </div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your ClickUp API token"
              className="w-full bg-[#1E2A3D]/70 text-gray-100 border border-gray-600 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {/* Workspace & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6 flex-wrap">
            {/* Workspace */}
            <div>
              <label className="text-lg font-medium text-gray-100 mr-4">
                Workspace:
              </label>
              <div className="relative inline-block w-80">
                <select
                  className="appearance-none w-full bg-[#1E2A3D]/70 border border-gray-600 rounded-lg p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Assignees */}
            {assignees.length > 0 && (
              <div className="flex flex-wrap gap-3 bg-[#1E2A3D]/70 border border-gray-600 rounded-lg p-4">
                {assignees.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(a.id)}
                      onChange={() => toggleAssignee(a.id)}
                      className="accent-blue-400"
                    />
                    <span className="text-gray-100">{a.username}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Statuses */}
            {statuses.length > 0 && (
              <div className="flex flex-wrap gap-3 bg-[#1E2A3D]/70 border border-gray-600 rounded-lg p-4">
                {statuses.map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(s)}
                      onChange={() => toggleStatus(s)}
                      className="accent-blue-400"
                    />
                    <span className="text-gray-100">{s}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Task Type */}
            {taskTypes.length > 0 && (
              <div>
                <label className="text-lg font-medium text-gray-100 mr-2">
                  Task Type:
                </label>
                <select
                  className="appearance-none bg-[#1E2A3D]/70 border border-gray-600 rounded-lg p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={taskTypeFilter}
                  onChange={(e) => setTaskTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  {taskTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div>
              <label className="text-lg font-medium text-gray-100 mr-2">
                Sort By:
              </label>
              <select
                className="appearance-none bg-[#1E2A3D]/70 border border-gray-600 rounded-lg p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="">Default</option>
                <option value="name">Name</option>
                <option value="date">Date Created</option>
                <option value="assignees">Number of Assignees</option>
              </select>
            </div>
          </div>

          {/* Tasks */}
          {loading ? (
            <p className="text-center text-gray-200 mt-10">Loading tasks...</p>
          ) : filteredTasks.length > 0 ? (
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/10 border border-white/20 rounded-2xl shadow-lg p-5 backdrop-blur-md transition-transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-lg text-gray-100">
                      {task.name}
                    </h3>
                    {getStatusIcon(task.status?.status)}
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    {task.status?.status || "No status"}
                    <br />
                    Url:{" "}
                    <a href={task.url} className="underline">
                      {task.url}
                    </a>
                  </p>
                  {task.assignees?.length > 0 ? (
                    <div className="flex -space-x-3 mt-3">
                      {task.assignees.map((a) => (
                        <div
                          key={a.id}
                          className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white"
                          style={{ backgroundColor: getColorFromId(a.id) }}
                          title={a.username}
                        >
                          <User size={14} className="text-white" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400 text-sm mt-3">
                      <User size={14} className="mr-1" /> No assignee
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center mt-10">No tasks found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
