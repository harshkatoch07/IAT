// src/components/initiate/ResubmitPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Box } from "@mui/material";
import InitiateForm from "../forms/InitiateForm";
import { resolveInitiateFormSettings } from "../../utils/resolveInitiateFormSettings";
import { tabFromStatus } from "../../utils/tabFromStatus";
import ApprovalPathDialog from "./ApprovalPathDialog";

// Fetch the trail with JWT if present
async function getApprovalTrail(requestId) {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const res = await fetch(`/api/approvals/${requestId}/trail`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`trail fetch failed: ${res.status}`);
  return res.json();
}

export default function ResubmitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();

  const [trail, setTrail] = useState(null);
  const [openPath, setOpenPath] = useState(false);

  // Clear stale trail and refetch on id change
  useEffect(() => {
    let on = true;
    setTrail(null);
    getApprovalTrail(id)
      .then((t) => on && setTrail(t))
      .catch(() => on && setTrail(null));
    return () => {
      on = false;
    };
  }, [id]);

  // Get tab from query parameter
  const currentTab = (search.get("tab") || "").toLowerCase();

  // Only allow initiated, sentback, assigned tabs
  useEffect(() => {
    if (currentTab && !['initiated', 'sentback', 'assigned'].includes(currentTab)) {
      navigate('/approvals');
    }
  }, [currentTab, navigate]);

  const effectiveTab = useMemo(() => {
    if (['initiated', 'sentback', 'assigned'].includes(currentTab)) return currentTab;
    return tabFromStatus(trail?.requestStatus);
  }, [currentTab, trail?.requestStatus]);

  // Force remount when context changes to avoid sticky buttons
  const viewKey = `${id}:${effectiveTab}:${openPath}`;

  const isAssigned = effectiveTab === 'assigned';
  return (
    <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto" }}>
      {openPath && (
        <ApprovalPathDialog
          open={openPath}
          onClose={() => setOpenPath(false)}
          trail={trail}
        />
      )}

      <React.Fragment key={viewKey}>
        <InitiateForm
          key={viewKey}
          disabled={effectiveTab !== 'assigned' ? true : false}
          hideActions={effectiveTab !== 'assigned'}
          mode={effectiveTab === 'assigned' ? "approver" : "initiator"}
          showButtons={effectiveTab === 'assigned' ? { approve: true, sentBack: true, reject: true, approveWithModification: true } : {}}
          tabKey={effectiveTab}
          requestId={id}
          onCancel={() => navigate('/approvals?tab=' + effectiveTab)}
          onUpdate={() => {
            navigate('/approvals?tab=' + effectiveTab);
          }}
          showPathButton={true}
          onOpenPath={() => setOpenPath(true)}
        />
      </React.Fragment>
    </Box>
  );
}
