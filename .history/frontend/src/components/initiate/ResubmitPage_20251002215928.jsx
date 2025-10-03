// src/components/initiate/ResubmitPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Box } from "@mui/material";
import InitiateForm from "../forms/InitiateForm";
import { tabFromStatus } from "../../utils/tabFromStatus";
import ApprovalPathDialog from "./ApprovalPathDialog";

// Fetch the trail with JWT if present
async function getApprovalTrail(requestId) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
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

const ALLOWED_TABS = ["initiated", "sentback", "assigned", "approved", "rejected"];

export default function ResubmitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();

  const [trail, setTrail] = useState(null);
  const [openPath, setOpenPath] = useState(false);

  // fetch trail on id change
  useEffect(() => {
    let alive = true;
    setTrail(null);
    getApprovalTrail(id)
      .then((t) => alive && setTrail(t))
      .catch(() => alive && setTrail(null));
    return () => {
      alive = false;
    };
  }, [id]);

  // read tab from URL; do not write to URL here to avoid loops
  const urlTab = (search.get("tab") || "assigned").toLowerCase();

  // pick effective tab: prefer allowed URL tab, else infer from trail status
  const effectiveTab = useMemo(() => {
    // If URL tab is allowed, use it
    if (ALLOWED_TABS.includes(urlTab)) return urlTab;
    
    // Otherwise infer from trail status
    const inferred = tabFromStatus(trail?.requestStatus);
    if (ALLOWED_TABS.includes(inferred)) return inferred;
    
    // If still not resolved, use assigned only for pending/new requests
    const status = trail?.requestStatus?.toLowerCase();
    if (!status || status === 'pending' || status === 'initiated') return 'assigned';
    
    // For others, show as approved view
    return 'approved';
  }, [urlTab, trail?.requestStatus]);

  // force form remount when context changes
  const viewKey = `${id}:${effectiveTab}`;

  const isAssigned = effectiveTab === "assigned";

  return (
    <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto" }}>
      {openPath && (
        <ApprovalPathDialog open={openPath} onClose={() => setOpenPath(false)} trail={trail} />
      )}

      <React.Fragment key={viewKey}>
        <InitiateForm
          key={viewKey}
          disabled={effectiveTab === 'assigned' || effectiveTab === 'approved'}
          hideActions={effectiveTab !== 'assigned'}
          mode={effectiveTab === 'assigned' ? "approver" : "initiator"}
          showButtons={
            effectiveTab === 'assigned'
              ? { approve: true, sentBack: true, reject: true, approveWithModification: true }
              : {}
          }
          tabKey={effectiveTab}
          requestId={id}
          onCancel={() => navigate(`/approvals?tab=${effectiveTab}`)}
          onUpdate={() => navigate(`/approvals?tab=${effectiveTab}`)}
          showPathButton
          onOpenPath={() => setOpenPath(true)}
        />
      </React.Fragment>
    </Box>
  );
}
import React, { useEffect, useMemo, useState } from "react";
// ...existing imports...

export default function ResubmitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [trail, setTrail] = useState(null);
  const [openPath, setOpenPath] = useState(false);
  const [formData, setFormData] = useState(null); // Add state for form data

  // Add debugging for trail data
  useEffect(() => {
    let alive = true;
    setTrail(null);
    getApprovalTrail(id)
      .then((t) => {
        console.log('Trail Data:', t); // Debug trail data
        if (alive) setTrail(t);
      })
      .catch((error) => {
        console.error('Trail Error:', error);
        if (alive) setTrail(null);
      });
    return () => { alive = false; };
  }, [id]);

  // Add effect to fetch form data
  useEffect(() => {
    let alive = true;
    const fetchFormData = async () => {
      try {
        const response = await fetch(`/api/fundrequests/${id}/form-snapshot`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        console.log('Form Data:', data); // Debug form data
        if (alive) setFormData(data);
      } catch (error) {
        console.error('Form Data Error:', error);
      }
    };
    
    if (id) fetchFormData();
    return () => { alive = false; };
  }, [id]);

  // Update viewKey to include formData dependency
  const viewKey = useMemo(() => 
    `${id}:${effectiveTab}:${formData ? 'loaded' : 'loading'}`,
    [id, effectiveTab, formData]
  );

  return (
    <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto" }}>
      {/* ...existing ApprovalPathDialog... */}

      <React.Fragment key={viewKey}>
        <InitiateForm
          key={viewKey}
          disabled={effectiveTab === 'assigned' || effectiveTab === 'approved'}
          hideActions={effectiveTab !== 'assigned'}
          mode={effectiveTab === 'assigned' ? "approver" : "initiator"}
          showButtons={
            effectiveTab === 'assigned'
              ? { approve: true, sentBack: true, reject: true, approveWithModification: true }
              : {}
          }
          tabKey={effectiveTab}
          requestId={id}
          formData={formData} // Pass form data explicitly
          onCancel={() => navigate(`/approvals?tab=${effectiveTab}`)}
          onUpdate={() => navigate(`/approvals?tab=${effectiveTab}`)}
          showPathButton
          onOpenPath={() => setOpenPath(true)}
        />
      </React.Fragment>
    </Box>
  );
}