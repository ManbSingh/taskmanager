const API_BASE = "/api/tasks";

const taskModalEl = document.getElementById("taskModal");
const taskModal = new bootstrap.Modal(taskModalEl);
const deleteModalEl = document.getElementById("deleteModal");
const deleteModal = new bootstrap.Modal(deleteModalEl);

const taskForm = document.getElementById("taskForm");
const taskModalLabel = document.getElementById("taskModalLabel");
const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");
const taskStatusInput = document.getElementById("taskStatus");
const taskTableBody = document.getElementById("taskTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let pendingDeleteId = null;
let searchDebounceTimer = null;

function statusBadgeClass(status) {
    switch (status) {
        case "Open":
            return "status-open";
        case "In Progress":
            return "status-in-progress";
        case "Completed":
            return "status-completed";
        default:
            return "bg-secondary";
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(isoString) {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

async function loadTasks() {
    taskTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Loading tasks...</td></tr>`;

    const params = new URLSearchParams();
    const q = searchInput.value.trim();
    const status = statusFilter.value;
    if (q) params.append("q", q);
    if (status) params.append("status", status);

    try {
        const res = await fetch(`${API_BASE}?${params.toString()}`);
        if (res.status === 401) {
            window.location.href = "/login";
            return;
        }
        const tasks = await res.json();
        renderTasks(tasks);
    } catch (err) {
        taskTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Failed to load tasks.</td></tr>`;
        console.error(err);
    }
}

function renderTasks(tasks) {
    if (!tasks.length) {
        taskTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No tasks found.</td></tr>`;
        return;
    }

    taskTableBody.innerHTML = tasks.map(task => `
        <tr>
            <td><strong>${escapeHtml(task.title)}</strong></td>
            <td class="task-desc-cell text-muted">${escapeHtml(task.description) || "-"}</td>
            <td>
                <select class="form-select form-select-sm status-select" data-id="${task.id}">
                    ${["Open", "In Progress", "Completed"].map(s =>
                        `<option value="${s}" ${s === task.status ? "selected" : ""}>${s}</option>`
                    ).join("")}
                </select>
            </td>
            <td class="small text-muted">${formatDate(task.updated_at)}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${task.id}" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${task.id}" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll(".status-select").forEach(sel => {
        sel.addEventListener("change", (e) => updateTaskStatus(e.target.dataset.id, e.target.value));
    });
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => openDeleteModal(btn.dataset.id));
    });
}

function openCreateModal() {
    taskModalLabel.textContent = "New Task";
    taskIdInput.value = "";
    taskForm.reset();
    taskStatusInput.value = "Open";
}

async function openEditModal(id) {
    try {
        const res = await fetch(`${API_BASE}/${id}`);
        if (!res.ok) throw new Error("Task not found");
        const task = await res.json();

        taskModalLabel.textContent = "Edit Task";
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDescriptionInput.value = task.description || "";
        taskStatusInput.value = task.status;

        taskModal.show();
    } catch (err) {
        alert("Could not load task details.");
        console.error(err);
    }
}

async function updateTaskStatus(id, status) {
    try {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
        alert("Could not update task status.");
        console.error(err);
        loadTasks();
    }
}

function openDeleteModal(id) {
    pendingDeleteId = id;
    deleteModal.show();
}

confirmDeleteBtn.addEventListener("click", async () => {
    if (!pendingDeleteId) return;
    try {
        const res = await fetch(`${API_BASE}/${pendingDeleteId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete task");
        deleteModal.hide();
        pendingDeleteId = null;
        loadTasks();
    } catch (err) {
        alert("Could not delete task.");
        console.error(err);
    }
});

taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = taskIdInput.value;
    const payload = {
        title: taskTitleInput.value.trim(),
        description: taskDescriptionInput.value.trim(),
        status: taskStatusInput.value,
    };

    if (!payload.title) {
        alert("Title is required.");
        return;
    }

    try {
        const url = id ? `${API_BASE}/${id}` : API_BASE;
        const method = id ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to save task");
        }

        taskModal.hide();
        loadTasks();
    } catch (err) {
        alert(err.message);
        console.error(err);
    }
});

searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(loadTasks, 300);
});

statusFilter.addEventListener("change", loadTasks);

document.addEventListener("DOMContentLoaded", loadTasks);
