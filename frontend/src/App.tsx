import { useEffect, useState } from "react";
import { getErrors, deleteError } from "./api/errorApi";
import { getProjects, createProject, deleteProject } from "./api/projectApi";
import type { ErrorData } from "./types/error";
import Login from "./Login";
import socket from "./socket";
import viteLogo from "./assets/vite.svg";

function App() {
  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (err) {
    localStorage.removeItem("user");
  }

  const [errors, setErrors] = useState<ErrorData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedError, setSelectedError] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "processed" | "pending" | "failed">("all");
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  useEffect(() => {
    // Verify authentication with backend
    const verifyAuth = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) {
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        } else {
          const data = await res.json();
          localStorage.setItem("user", JSON.stringify(data.user));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      }
    };

    if (user) {
      verifyAuth();
    }
  }, []);

  if (!isAuthenticated) {
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

  const handleDeleteError = async (errorId: number) => {
    const confirmed = confirm("Delete this error and all related data?");
    if (!confirmed) return;

    try {
      await deleteError(errorId);
      setErrors((prev) => prev.filter((err) => err.id !== errorId));
      setSelectedError((prev) => (prev?.id === errorId ? null : prev));
    } catch (err) {
      console.error("Delete error failed:", err);
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

  const logout = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Socket listeners
  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleNewError = (newError: ErrorData) => {
      // console.log("Realtime new error:", newError);
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
      // console.log("Realtime updated error:", updatedError);
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
      // console.log("Realtime processed error:", processedError);
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
    if (!isAuthenticated || !user) return;
    fetchProjects();
  }, [isAuthenticated, user]);

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
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-[#222] text-zinc-100' : 'bg-white text-gray-900'}`}>
      {/* NAV */}
      <nav className="border-b sticky top-0 z-50" style={{ background: '#C7F9CC' }}>
        <div className="mx-auto flex w-full items-center justify-between gap-4 px-6 py-5 max-w-6xl">
          <div className="flex items-center gap-3">
            <img src={viteLogo} alt="Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#14532d' }}>ErrorLens</h1>
              <p className="text-sm mt-1 max-w-2xl" style={{ color: '#276749' }}>
                AI-powered observability for your error workflows, with live project insights and smart analysis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="rounded-full px-4 py-2 text-sm font-medium transition border"
              style={{ background: '#A8E6A3', color: '#14532d', borderColor: '#A8E6A3' }}
            >
              {darkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
            <button
              onClick={logout}
              className="rounded-full px-5 py-2 text-sm font-medium transition border"
              style={{ background: '#A8E6A3', color: '#14532d', borderColor: '#A8E6A3' }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-6 py-8">
          {/* PROJECTS */}
          <section className="mb-10">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: '#14532d' }}>Projects</h2>
                <p className="text-sm mt-1" style={{ color: '#276749' }}>
                  Manage your workspaces and jump directly into the project you want to inspect.
                </p>
              </div>
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition border"
                style={{ background: '#C7F9CC', color: '#14532d', borderColor: '#A8E6A3' }}
              >
                + Create Project
              </button>
            </div>
            {projects.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed p-8 text-center shadow-xl" style={{ background: '#A8E6A3', borderColor: '#A8E6A3' }}>
                <p className="text-sm" style={{ color: '#14532d' }}>No projects yet</p>
                <p className="text-xs mt-2" style={{ color: '#276749' }}>Create your first project to get started with error monitoring.</p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto pb-2">
                <div className="flex gap-4 min-w-max">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                    className={`min-w-[320px] shrink-0 rounded-[30px] border p-6 shadow-xl transition-all duration-300 ${selectedProject?.id === p.id ? '' : ''}`}
                    style={{ background: '#A8E6A3', borderColor: '#A8E6A3' }}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#276749' }}>Project</p>
                          <p className="mt-3 text-xl font-semibold" style={{ color: '#14532d' }}>{p.name}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                            style={{ background: '#C7F9CC', color: '#14532d' }}
                          >
                            {selectedProject?.id === p.id ? "Active view" : "Switch"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 rounded-3xl p-4 text-sm" style={{ background: '#C7F9CC', color: '#276749' }}>
                        <p className="truncate">{p.api_key ?? "No API key available"}</p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(p.api_key);
                            alert("Copied!");
                          }}
                          className="rounded-full border px-4 py-2 text-xs font-medium transition"
                          style={{ background: '#C7F9CC', color: '#14532d', borderColor: '#A8E6A3' }}
                        >
                          Copy ID
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(p.id);
                          }}
                          className="rounded-full border px-4 py-2 text-xs font-medium transition"
                          style={{ background: '#C7F9CC', color: '#14532d', borderColor: '#A8E6A3' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ACTIVE PROJECT HEADER */}
          {selectedProject && (
            <div className="mb-8 rounded-4xl border p-6 shadow-xl" style={{ background: '#A8E6A3', borderColor: '#A8E6A3' }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em]" style={{ color: '#276749' }}>Viewing</p>
                  <h2 className="mt-2 text-2xl font-semibold" style={{ color: '#14532d' }}>{selectedProject.name}</h2>
                </div>
                <div className="inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm" style={{ background: '#C7F9CC', color: '#14532d' }}>
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                  Active project view
                </div>
              </div>
            </div>
          )}

          {/* STATS */}
          <div className="grid gap-4 md:grid-cols-4 mb-10">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Processed" value={stats.processed} />
            <StatCard label="Pending" value={stats.pending} />
            <StatCard label="Failed" value={stats.failed} />
          </div>

          <div className="rounded-4xl border p-6 shadow-xl" style={{ background: '#A8E6A3', borderColor: '#A8E6A3' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold" style={{ color: '#14532d' }}>Error Feed</h3>
                <p className="text-sm mt-1" style={{ color: '#276749' }}>
                  Browse recent issues, then click any card for AI recommendations and stack trace details.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["all", "processed", "pending", "failed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="rounded-full px-4 py-2 text-xs font-semibold transition"
                    style={{
                      background: activeFilter === f ? '#C7F9CC' : '#DDFADC',
                      color: '#14532d',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p style={{ color: '#276749' }}>Loading errors...</p>
            ) : !selectedProject ? (
              <div className="rounded-3xl border border-dashed p-10 text-center" style={{ background: '#C7F9CC', borderColor: '#A8E6A3' }}>
                <p className="text-sm" style={{ color: '#14532d' }}>Select a project to view errors</p>
              </div>
            ) : filteredErrors.length === 0 ? (
              <div className="rounded-3xl border border-dashed p-10 text-center" style={{ background: '#C7F9CC', borderColor: '#A8E6A3' }}>
                <p className="text-sm" style={{ color: '#14532d' }}>No errors found</p>
                <p className="text-xs mt-2" style={{ color: '#276749' }}>Errors from your applications will appear here once they are reported.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredErrors.map((err) => (
                  <div
                    key={err.id}
                    onClick={() => setSelectedError(err)}
                    className="group overflow-hidden rounded-[28px] border p-6 shadow-xl transition duration-300"
                    style={{ background: '#C7F9CC', borderColor: '#A8E6A3' }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold line-clamp-2" style={{ color: '#14532d' }}>{err.error_text}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {err.occurrence_count > 1 && (
                            <span className="rounded-full px-3 py-2" style={{ background: '#A8E6A3', color: '#14532d' }}>
                              {err.occurrence_count} occurrences
                            </span>
                          )}
                          <span className="rounded-full px-3 py-2" style={{ background: '#DDFADC', color: '#14532d' }}>{err.service}</span>
                          <span
                            className="rounded-full px-3 py-2 font-semibold"
                            style={{
                              background: err.status === 'processed' ? '#A8E6A3' : err.status === 'failed' ? '#D4F8D4' : '#DDFADC',
                              color: '#14532d',
                            }}
                          >
                            {err.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-3 text-right sm:items-end">
                        <p className="text-xs" style={{ color: '#276749' }}>{new Date(err.created_at).toLocaleDateString()}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteError(err.id);
                          }}
                          className="rounded-full px-3 py-2 text-xs font-semibold transition"
                          style={{ background: '#A8E6A3', color: '#14532d' }}
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

          {/* ERROR DRAWER */}
          {selectedError && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
              <div className="w-full max-w-xl h-full bg-white border-l p-6 overflow-y-auto" style={{ borderColor: '#A8E6A3' }}>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold" style={{ color: '#14532d' }}>Error Details</h2>
                    <p className="text-sm mt-1" style={{ color: '#276749' }}>AI recommendations and stack trace to resolve the issue faster.</p>
                  </div>

                  <button
                    onClick={() => setSelectedError(null)}
                    className="text-2xl"
                    style={{ color: '#14532d' }}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: '#276749' }}>Error</p>
                    <p className="mt-3 text-sm whitespace-pre-wrap" style={{ color: '#14532d' }}>{selectedError.error_text}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl p-4" style={{ background: '#C7F9CC' }}>
                      <p className="text-xs" style={{ color: '#276749' }}>Status</p>
                      <p className="mt-2 text-sm" style={{ color: '#14532d' }}>{selectedError.status}</p>
                    </div>
                    <div className="rounded-3xl p-4" style={{ background: '#C7F9CC' }}>
                      <p className="text-xs" style={{ color: '#276749' }}>Service</p>
                      <p className="mt-2 text-sm" style={{ color: '#14532d' }}>{selectedError.service}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: '#276749' }}>AI Analysis</p>
                    <div className="rounded-3xl p-4" style={{ background: '#F0FFF1' }}>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: '#14532d' }}>{selectedError.analysis || "Not processed yet"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: '#276749' }}>Fix Suggestion</p>
                    <div className="rounded-3xl p-4" style={{ background: '#F0FFF1' }}>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: '#14532d' }}>{selectedError.fix_suggestion || "No fix available"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] mb-2" style={{ color: '#276749' }}>Stack Trace</p>
                    <div className="rounded-3xl p-4 overflow-x-auto" style={{ background: '#14532d' }}>
                      <pre className="text-xs whitespace-pre-wrap" style={{ color: '#F0FFF1' }}>{selectedError.stack || "No stack trace"}</pre>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl p-4" style={{ background: '#C7F9CC' }}>
                      <p className="text-xs" style={{ color: '#276749' }}>Retry Count</p>
                      <p className="mt-2 text-sm" style={{ color: '#14532d' }}>{selectedError.retry_count}</p>
                    </div>
                    <div className="rounded-3xl p-4" style={{ background: '#C7F9CC' }}>
                      <p className="text-xs" style={{ color: '#276749' }}>Created At</p>
                      <p className="mt-2 text-sm" style={{ color: '#14532d' }}>{selectedError.created_at}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl p-5 transition-all duration-200" style={{ background: '#A8E6A3', border: '1px solid #A8E6A3' }}>
    <p className="text-xs" style={{ color: '#276749' }}>{label}</p>
    <p className="text-xl" style={{ color: '#14532d' }}>{value}</p>
  </div>
);

export default App;