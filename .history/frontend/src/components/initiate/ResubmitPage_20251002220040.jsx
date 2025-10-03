import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Box } from "@mui/material";
import { getApprovalTrail } from "../../api/approvalsApi";
import InitiateForm from "../forms/InitiateForm";

// Allowed tabs and their handlers
const ALLOWED_TABS = ["initiated", "sentback", "assigned", "approved"];

export default function ResubmitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [trail, setTrail] = useState(null);
  const [openPath, setOpenPath] = useState(false);
  const [formData, setFormData] = useState(null);

  // Get the effective tab from URL or default
  const effectiveTab = useMemo(() => {
    const tabFromUrl = search.get("tab");
    return ALLOWED_TABS.includes(tabFromUrl) ? tabFromUrl : "assigned";
  }, [search]);

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
          formData={formData}
          onCancel={() => navigate(`/approvals?tab=${effectiveTab}`)}
          onUpdate={() => navigate(`/approvals?tab=${effectiveTab}`)}
          showPathButton
          onOpenPath={() => setOpenPath(true)}
        />
      </React.Fragment>
    </Box>
  );
}