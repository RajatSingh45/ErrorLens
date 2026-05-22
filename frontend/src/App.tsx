import { useEffect, useState } from "react";
import { getErrors } from "./api/errorApi";
import { getProjects, createProject, deleteProject } from "./api/projectApi";
import type { ErrorData } from "./types/error";
import Login from "./Login";
import socket from "./socket";

function App() {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  let user = null;

  try {
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (err) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  const [errors, setErrors] = useState<ErrorData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedError, setSelectedError] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "processed" | "pending" | "failed">("all");

  if (!user || !token) {
    return <Login />;
  }

  const fetchErrors = async (projectId: number) => {
    if (!projectId) {
      setErrors([]);
      return;
    }
    try {
      setLoading(true);
      const data = await getErrors(projectId);
      setErrors(data);
    } catch (err) {
      console.error("Fetch errors failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
        await fetchErrors(data[0].id);
      }
    } catch (err) {
      console.error("Fetch projects failed:", err);
    }
  };

  const handleCreateProject = async () => {
    const name = prompt("Enter project name");
    if (!name) return;

    try {
      const newProject = await createProject(name);
      setProjects((prev) => [newProject, ...prev]);
      setSelectedProject(newProject);
      await fetchErrors(newProject.id);
    } catch (err) {
      console.error("Create project failed:", err);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    const confirmed = confirm("Delete this project and all its errors?");
    if (!confirmed) return;

    try {
      await deleteProject(projectId);
      const data = await getProjects();
      setProjects(data);

      if (selectedProject?.id === projectId) {
        setSelectedProject(data[0] ?? null);
        setErrors([]);
        if (data.length > 0) {
          await fetchErrors(data[0].id);
        }
      }
    } catch (err) {
      console.error("Delete project failed:", err);
    }
  };

  const pollErrorStatus = async (errorId: number | string, attempt = 0) => {
    const MAX_ATTEMPTS = 24;
    const INTERVAL = 2500;

    if (!selectedProject || attempt > MAX_ATTEMPTS) return;

    setTimeout(async () => {
      try {
        const data = await getErrors(selectedProject.id);
        const found = data.find((e: ErrorData) => String(e.id) === String(errorId));

        if (found) {
          setErrors((prev) => {
            const idx = prev.findIndex((p) => String(p.id) === String(found.id));
            if (idx === -1) return [found, ...prev];
            const next = [...prev];
            next[idx] = { ...next[idx], ...found };
            return next;
          });

          setSelectedError((prev) =>
            String(prev?.id) === String(found.id) ? { ...prev, ...found } : prev,
          );

          if (found.status === "pending") {
            pollErrorStatus(errorId, attempt + 1);
          }
        } else {
          pollErrorStatus(errorId, attempt + 1);
        }
      } catch (err) {
        console.error("Polling error status failed:", err);
        pollErrorStatus(errorId, attempt + 1);
      }
    }, INTERVAL);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.reload();
  };

  // Socket listeners
  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleNewError = (newError: ErrorData) => {
      console.log("Realtime new error:", newError);
      setErrors((prev) => {
        const exists = prev.some((err) => String(err.id) === String(newError.id));
        if (exists) return prev;
        return [newError, ...prev];
      });

      if (String(newError.status) === "pending") {
        pollErrorStatus(newError.id);
      }
    };

    const handleUpdatedError = (updatedError: ErrorData) => {
      console.log("Realtime updated error:", updatedError);
      setErrors((prev) => {
        const idx = prev.findIndex((err) => String(err.id) === String(updatedError.id));
        if (idx === -1) return [updatedError, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...updatedError };
        return next;
      });

      setSelectedError((prev) =>
        String(prev?.id) === String(updatedError.id) ? { ...prev, ...updatedError } : prev,
      );
    };

    const handleProcessedError = (processedError: ErrorData) => {
      console.log("Realtime processed error:", processedError);
      setErrors((prev) => {
        const idx = prev.findIndex((err) => String(err.id) === String(processedError.id));
        if (idx === -1) return [processedError, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...processedError };
        return next;
      });

      setSelectedError((prev) =>
        String(prev?.id) === String(processedError.id) ? { ...prev, ...processedError } : prev,
      );
    };

    socket.on("connect", handleConnect);
    socket.on("new_error", handleNewError);
    socket.on("error_updated", handleUpdatedError);
    socket.on("error_processed", handleProcessedError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new_error", handleNewError);
      socket.off("error_updated", handleUpdatedError);
      socket.off("error_processed", handleProcessedError);
    };
  }, [selectedProject]);

  // Fetch projects on mount
  useEffect(() => {
    if (!token || !user) return;
    fetchProjects();
  }, [token, user]);

  // Fetch errors when selectedProject changes
  useEffect(() => {
    if (selectedProject?.id) {
      fetchErrors(selectedProject.id);
    }
  }, [selectedProject?.id]);

  const filteredErrors = errors.filter((e) => {
    if (activeFilter === "all") return true;
    return e.status === activeFilter;
  });

  const stats = {
    total: errors.length,
    processed: errors.filter((e) => e.status === "processed").length,
    pending: errors.filter((e) => e.status === "pending").length,
    failed: errors.filter((e) => e.status === "failed").length,
  };

  return (
    <div className="min-h-screen [radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_28%),#09090b] text-zinc-200 font-sans">
      {/* NAV */}
      <nav className="border-b border-zinc-800 sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl shadow-black/20">
        <div className="px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 max-w-6xl mx-auto">
          <div>
            <h1 className="text-white text-2xl font-semibold">ErrorLens</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Manage projects, monitor errors, and review AI-powered analysis.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-full border border-red-500/50 bg-red-500/10 px-4 py-2 text-red-300 text-sm transition hover:bg-red-500/20"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        {/* PROJECTS */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-zinc-200 text-lg font-semibold">Projects</h2>

            <button
              onClick={handleCreateProject}
              className="bg-indigo-600 px-4 py-2 rounded-lg text-white text-xs hover:bg-indigo-500"
            >
              + Create Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-10 text-center">
              <p className="text-zinc-400 text-sm">No projects yet</p>
              <p className="text-zinc-600 text-xs mt-1">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedProject?.id === p.id
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-zinc-800 bg-zinc-900/30 hover:border-violet-500/50 hover:bg-zinc-900/80"
                  }`}
                >
                  <p className="text-white text-sm font-semibold">{p.name}</p>

                  <div className="flex justify-between items-center mt-2 gap-2">
                    <p className="text-[10px] text-zinc-500 font-mono truncate">
                      {p.api_key?.slice(0, 20)}...
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(p.api_key);
                          alert("Copied!");
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300"
                      >
                        Copy
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(p.id);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVE PROJECT */}
        {selectedProject && (
          <div className="mb-4 text-sm text-zinc-400">
            Viewing: <span className="text-indigo-400">{selectedProject.name}</span>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Processed" value={stats.processed} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Failed" value={stats.failed} />
        </div>

        {/* FILTER */}
        <div className="flex gap-2 mb-6">
          {(["all", "processed", "pending", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 text-xs rounded ${
                activeFilter === f ? "bg-zinc-700 text-white" : "text-zinc-500"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ERRORS */}
        {loading ? (
          <p className="text-zinc-400">Loading errors...</p>
        ) : !selectedProject ? (
          <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-10 text-center">
            <p className="text-zinc-400 text-sm">Select a project to view errors</p>
          </div>
        ) : filteredErrors.length === 0 ? (
          <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-10 text-center">
            <p className="text-zinc-400 text-sm">No errors found</p>
            <p className="text-zinc-600 text-xs mt-1">Errors from your applications will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredErrors.map((err) => (
              <div
                key={err.id}
                onClick={() => setSelectedError(err)}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 cursor-pointer hover:border-violet-500/50 hover:bg-zinc-900/80 transition-all duration-200 shadow-sm shadow-violet-500/5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium line-clamp-2">{err.error_text}</p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {err.occurrence_count > 1 && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400">
                          {err.occurrence_count} occurrences
                        </span>
                      )}

                      <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                        {err.service}
                      </span>

                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                          err.status === "processed"
                            ? "bg-green-500/10 text-green-400"
                            : err.status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {err.status}
                      </span>
                    </div>
                  </div>

                  <div className="ml-4">
                    <p className="text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(err.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR DRAWER */}
        {selectedError && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
            <div className="w-full max-w-xl h-full bg-zinc-950 border-l border-zinc-800 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white text-lg font-semibold">Error Details</h2>

                <button
                  onClick={() => setSelectedError(null)}
                  className="text-zinc-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <p className="text-xs text-zinc-500 mb-1">Error</p>
                <p className="text-red-400 text-sm wrap-break-word">{selectedError.error_text}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Status</p>
                  <p className="text-sm text-white">{selectedError.status}</p>
                </div>

                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Service</p>
                  <p className="text-sm text-white">{selectedError.service}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-zinc-500 mb-2">AI Analysis</p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {selectedError.analysis || "Not processed yet"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-zinc-500 mb-2">Fix Suggestion</p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {selectedError.fix_suggestion || "No fix available"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-zinc-500 mb-2">Stack Trace</p>
                <div className="bg-black border border-zinc-800 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
                    {selectedError.stack || "No stack trace"}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Retry Count</p>
                  <p className="text-sm text-white">{selectedError.retry_count}</p>
                </div>

                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Created At</p>
                  <p className="text-sm text-white">{new Date(selectedError.created_at).toLocaleString()}</p>
                </div>

                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Occurrences</p>
                  <p className="text-sm text-white">{selectedError.occurrence_count || 1}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-200">
    <p className="text-xs text-zinc-500">{label}</p>
    <p className="text-white text-xl">{value}</p>
  </div>
);

export default App;