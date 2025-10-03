// src/components/approvals/ApprovalsPage.columns.jsx
import React from "react";
import { IconButton, Link as MuiLink, Stack, Tooltip } from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import StatusChip from "../shared/StatusChip";
import { normalizeDbStatus } from "../../utils/status";

// helper to pick the first defined value
const pick = (...vals) => vals.find((v) => v !== undefined && v !== null);

const fmt = {
  date(v) {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d)
      ? "—"
      : d.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  },
};

export function buildApprovalsColumns({
  onOpenInitiate, // open the request
  onOpenTrail,    // open Trail dialog
  onEdit,         // edit action
  onDelete,       // delete action
  onRetry,        // retry action
}) {
  return [
    // ID
    {
      field: "ref",
      headerName: "ID",
      minWidth: 90,
      valueGetter: (r) => pick(r.approvalId, r.fundRequestId, r.id),
      render: (row) => pick(row.approvalId, row.fundRequestId, row.id) ?? "—",
    },

    // Approvals (title)
    {
      field: "approvals",
      headerName: "Approvals",
      minWidth: 260,
      valueGetter: (r) =>
        pick(r.approvals, r.title, r.requestTitle, r.Name),
      render: (row) => (
        <MuiLink
          component="button"
          variant="body2"
          underline="hover"
          onClick={() => onOpenInitiate && onOpenInitiate(row)}
          sx={{ fontWeight: 600, textAlign: "left" }}
        >
          {pick(row.approvals, row.title, row.requestTitle, row.Name) ?? "—"}
        </MuiLink>
      ),
    },

    // Particulars (workflow/category/particulars)
    {
      field: "particulars",
      headerName: "Particulars",
      minWidth: 320,
      valueGetter: (r) =>
        pick(r.particulars, r.workflowName, r.workflow, r.categoryName),
      render: (row) =>
        pick(row.particulars, row.workflowName, row.workflow, row.categoryName) ??
        "—",
    },

    // Initiated By
    {
      field: "initiatedBy",
      headerName: "Initiated By",
      minWidth: 160,
      valueGetter: (r) =>
        pick(r.initiatedBy, r.initiatorName, r.requesterName),
      render: (row) =>
        pick(row.initiatedBy, row.initiatorName, row.requesterName) ?? "—",
    },

    // Initiated Date
    {
      field: "initiatedDate",
      headerName: "Initiated Date",
      minWidth: 140,
      valueGetter: (r) =>
        pick(r.initiatedDate, r.createdAt, r.created, r.CreatedAt),
      render: (row) =>
        fmt.date(pick(row.initiatedDate, row.createdAt, row.created, row.CreatedAt)),
    },

    // Last Action Date
    {
      field: "lastActionDate",
      headerName: "Last Action Date",
      minWidth: 150,
      valueGetter: (r) =>
        pick(r.lastActionDate, r.lastActionAt, r.actionedAt, r.ActionedAt),
      render: (row) =>
        fmt.date(
          pick(row.lastActionDate, row.lastActionAt, row.actionedAt, row.ActionedAt)
        ),
    },

    // Approval Needed by Date
    {
      field: "approvalNeededByDate",
      headerName: "Approval Needed by Date",
      minWidth: 190,
      valueGetter: (r) =>
        pick(
          r.approvalNeededByDate,
          r.neededBy,
          r.dueBy,
          r.requiredByDate,
          r.deadline
        ),
      render: (row) =>
        fmt.date(
          pick(
            row.approvalNeededByDate,
            row.neededBy,
            row.dueBy,
            row.requiredByDate,
            row.deadline
          )
        ),
    },

    // Approval Status
    {
      field: "approvalStatus",
      headerName: "Approval Status",
      minWidth: 140,
      valueGetter: (r) => pick(r.approvalStatus, r.status),
      render: (row) => (
        <StatusChip value={normalizeDbStatus(pick(row.approvalStatus, row.status))} />
      ),
    },

    // Approval Trail
    {
      field: "__trail",
      headerName: "Approval Trail",
      minWidth: 130,
      align: "center",
      headerAlign: "center",
      sortable: false,
      render: (row) => (
        <Tooltip title="View Trail">
          <span>
            <IconButton
              size="small"
              onClick={() => onOpenTrail && onOpenTrail(row)}
            >
              <TimelineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },

    // Actions (edit/delete)
    {
      field: "__actions",
      headerName: "Actions",
      minWidth: 120,
      align: "center",
      headerAlign: "center",
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Tooltip title="Edit">
            <span>
              <IconButton size="small" onClick={() => onEdit && onEdit(row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete">
            <span>
              <IconButton size="small" onClick={() => onDelete && onDelete(row)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },

    // Retry
    {
      field: "__retry",
      headerName: "Retry",
      minWidth: 90,
      align: "center",
      headerAlign: "center",
      sortable: false,
      render: (row) => (
        <Tooltip title="Retry">
          <span>
            <IconButton size="small" onClick={() => onRetry && onRetry(row)}>
              <ReplayIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },
  ];
}
